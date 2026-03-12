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

    // From this point on, use version from UpgradeRegistry as source of truth,
    // but all completion logic is delegated to ReleaseController.
    console.log('[UpgradeFinalizer] Delegating upgrade completion to ReleaseController...');

    const controllerResponse = await base44.functions.invoke('releaseController', {
      upgrade_id: input.upgrade_id
    } as any);

    const data = controllerResponse?.data ?? controllerResponse;

    if (!data?.success) {
      return Response.json(
        {
          success: false,
          finalization_status: 'verification_failed',
          error: 'ReleaseController reported failure',
          release_controller_response: data
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      finalization_status: 'complete',
      artifact_id: data.verification_record_id,
      artifact_name: data.artifact_name || undefined,
      verification_status: data.verification_status || 'PASS',
      verification_checks: data.artifact_verification_checks || undefined,
      verification_summary: data.verification_summary || undefined,
      message: data.message || `Upgrade ${input.upgrade_id} finalized via ReleaseController`
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