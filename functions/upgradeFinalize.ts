import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Upgrade Finalizer
 * 
 * Deterministic upgrade finalization orchestrator that guarantees verification artifacts
 * are generated at the end of every Nightwatch engineering upgrade.
 * 
 * Responsibilities:
 * - Collect upgrade metadata (upgrade_id, prompt_id, product_version)
 * - Collect validation results (entities, schemas, UI, tests)
 * - Invoke Verification Report Engine (generateVerificationArtifact)
 * - Generate fallback verification record if engine fails
 * - Ensure artifact appears in ChangeLog
 * 
 * Usage:
 * POST /upgradeFinalize
 * Body: {
 *   upgrade_id: "NW-UPGRADE-###",
 *   prompt_id: "NW-UPGRADE-###-PROMPT-###",
 *   product_version: "v0.6.0",
 *   title: "Upgrade Title",
 *   description: "What this upgrade accomplished",
 *   validation_results: { ... },
 *   system_impact: { ... },
 *   known_issues: { ... }
 * }
 * 
 * This function acts as the orchestrator that ensures every upgrade ends with
 * a proper verification artifact, even if the verification engine encounters errors.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const input = await req.json();

    // Validate required upgrade metadata
    const requiredFields = ['upgrade_id', 'prompt_id', 'product_version', 'title', 'description'];
    const missing = requiredFields.filter(f => !input[f]);
    if (missing.length > 0) {
      return Response.json({
        error: 'Missing required upgrade metadata',
        missing_fields: missing,
        message: 'Upgrade finalization requires: upgrade_id, prompt_id, product_version, title, description'
      }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    console.log(`[UpgradeFinalizer] Starting finalization for ${input.upgrade_id}`);

    // Look up UpgradeRegistry to enforce canonical product_version and lifecycle
    const registries = await base44.asServiceRole.entities.UpgradeRegistry.filter({
      upgrade_id: input.upgrade_id
    });

    if (registries.length === 0) {
      return Response.json(
        {
          error: 'Upgrade not found in registry',
          upgrade_id: input.upgrade_id
        },
        { status: 404 }
      );
    }

    const registry = registries[0];
    const registryVersion = registry.product_version;

    if (input.product_version !== registryVersion) {
      return Response.json(
        {
          error: 'Product version mismatch with UpgradeRegistry',
          provided_version: input.product_version,
          registry_version: registryVersion
        },
        { status: 400 }
      );
    }

    // From this point on, use version from UpgradeRegistry as source of truth
    const productVersion = registryVersion;

    // Build structured verification artifact content (used for summary only; canonical writer will own persistence)
    console.log('[UpgradeFinalizer] Building verification artifact payload for canonical writer...');

    const artifactName = `Nightwatch_VerificationRecord_${sanitizeForFilename(input.title)}_${productVersion}_${input.upgrade_id}_${timestamp.split('T')[0]}`;

    const validation = input.validation_results || {};
    const impact = input.system_impact || {};
    const issues = input.known_issues || {};

    // Calculate status
    const hasFailures = (issues.failures || []).length > 0;
    const hasWarnings = (issues.warnings || []).length > 0;
    const status = hasFailures ? 'FAIL' : hasWarnings ? 'PASS_WITH_WARNINGS' : 'PASS';

    // Build verification content (matches VerificationReportEngine structure)
    const verificationContent = {
      upgrade_metadata: {
        upgrade_id: input.upgrade_id,
        prompt_id: input.prompt_id,
        product_version: productVersion,
        timestamp: timestamp,
        actor: user.email,
        actor_role: user.role
      },
      upgrade_summary: {
        title: input.title,
        description: input.description,
        purpose: input.purpose || input.description,
        components_modified: input.components_modified || []
      },
      validation_results: {
        checks_performed: validation.checks_performed || [],
        records_inserted: validation.records_inserted || {},
        records_updated: validation.records_updated || {},
        records_deleted: validation.records_deleted || {},
        schema_changes: validation.schema_changes || [],
        ui_verification: validation.ui_checks || [],
        integration_checks: validation.integration_checks || [],
        total_records_affected: calculateTotalRecords(validation)
      },
      system_impact: {
        entities_affected: impact.entities_affected || [],
        pages_affected: impact.pages_affected || [],
        functions_affected: impact.functions_affected || [],
        components_affected: impact.components_affected || [],
        total_files_modified: calculateTotalFiles(impact)
      },
      known_issues: {
        validation_failures: issues.failures || [],
        warnings: issues.warnings || [],
        unexpected_conditions: issues.notes || [],
        total_issues: (issues.failures || []).length + (issues.warnings || []).length
      },
      verification_status: {
        overall_status: status,
        passed: status === 'PASS',
        passed_with_warnings: status === 'PASS_WITH_WARNINGS',
        failed: status === 'FAIL'
      },
      delivery_gate_results: input.delivery_gate_results || {},
      test_results: input.test_results || [],
      architectural_compliance: input.architectural_compliance || {}
    };

    // PRIMARY WRITE: Route verification artifact creation through canonical writer
    console.log('[UpgradeFinalizer] Invoking canonical verification artifact writer (createVerificationArtifact)...');

    const canonicalPayload = {
      upgrade_id: input.upgrade_id,
      prompt_id: input.prompt_id,
      product_version: productVersion,
      title: input.title,
      description: input.description,
      purpose: input.purpose || input.description,
      components_modified: input.components_modified || [],
      validation_results: validation,
      system_impact: impact,
      known_issues: issues,
      delivery_gate_results: input.delivery_gate_results || {},
      test_results: input.test_results || []
    };

    let canonicalResponse;
    try {
      canonicalResponse = await base44.functions.invoke('createVerificationArtifact', canonicalPayload as any);
    } catch (err) {
      console.error('[UpgradeFinalizer] Error invoking createVerificationArtifact:', err);
      return Response.json(
        {
          success: false,
          finalization_status: 'verification_failed',
          error: 'Canonical verification artifact writer invocation failed',
          canonical_writer_error: (err as Error).message
        },
        { status: 500 }
      );
    }

    if (!canonicalResponse?.data?.success) {
      console.error('[UpgradeFinalizer] Canonical writer returned failure:', canonicalResponse?.data);
      return Response.json(
        {
          success: false,
          finalization_status: 'verification_failed',
          error: 'Canonical verification artifact writer reported failure',
          canonical_writer_response: canonicalResponse?.data
        },
        { status: 500 }
      );
    }

    console.log('[UpgradeFinalizer] Canonical verification artifact created successfully');

    const artifactId = canonicalResponse.data.artifact_id;

    // Success: canonical writer has already enforced ChangeLog visibility and validation
    return Response.json({
      success: true,
      finalization_status: 'complete',
      artifact_id: artifactId,
      artifact_name: artifactName,
      verification_status: status,
      verification_checks: canonicalResponse.data.verification_checks,
      verification_summary: {
        total_records_affected: verificationContent.validation_results.total_records_affected,
        total_files_modified: verificationContent.system_impact.total_files_modified,
        total_issues: verificationContent.known_issues.total_issues,
        status: status
      },
      message: `Upgrade ${input.upgrade_id} finalized successfully - verification artifact confirmed in ChangeLog`
    });

  } catch (error) {
    console.error('[UpgradeFinalizer] Critical error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack,
      finalization_status: 'failed',
      message: 'Upgrade finalization failed - manual verification required'
    }, { status: 500 });
  }
});

function sanitizeForFilename(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').substring(0, 50);
}

function calculateTotalRecords(validation) {
  const inserted = Object.values(validation.records_inserted || {}).reduce((sum, count) => sum + count, 0);
  const updated = Object.values(validation.records_updated || {}).reduce((sum, count) => sum + count, 0);
  const deleted = Object.values(validation.records_deleted || {}).reduce((sum, count) => sum + count, 0);
  return inserted + updated + deleted;
}

function calculateTotalFiles(impact) {
  const entities = (impact.entities_affected || []).length;
  const pages = (impact.pages_affected || []).length;
  const functions = (impact.functions_affected || []).length;
  const components = (impact.components_affected || []).length;
  return entities + pages + functions + components;
}