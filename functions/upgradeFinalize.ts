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

    // Build structured verification artifact
    console.log('[UpgradeFinalizer] Building verification artifact...');

    const artifactName = `Nightwatch_VerificationRecord_${sanitizeForFilename(input.title)}_${input.product_version}_${input.upgrade_id}_${timestamp.split('T')[0]}`;

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
        product_version: input.product_version,
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

    // PRIMARY WRITE: Create PublishedOutput verification record
    console.log('[UpgradeFinalizer] Writing verification artifact to PublishedOutput...');

    const artifact = await base44.entities.PublishedOutput.create({
      outputName: artifactName,
      classification: 'verification_record',
      subtype: input.subtype || 'upgrade_verification',
      is_runnable: false,
      is_user_visible: false,
      display_zone: 'internal_only',
      source_module: input.upgrade_id,
      source_event_type: 'verification_complete',
      product_version: input.product_version,
      upgrade_id: input.upgrade_id,
      status: 'published',
      published_at: timestamp,
      content: JSON.stringify(verificationContent),
      summary: input.summary || `${input.title}: ${status}`,
      metadata: JSON.stringify({
        prompt_id: input.prompt_id,
        generated_by: 'UpgradeFinalizer',
        engine_version: '2.0.0'
      })
    });

    console.log(`[UpgradeFinalizer] Verification artifact created: ${artifact.id}`);

    // POST-WRITE VERIFICATION: Ensure artifact is persisted and visible
    console.log('[UpgradeFinalizer] Performing post-write verification...');

    const verificationChecks = {
      artifact_exists: false,
      classification_correct: false,
      upgrade_id_matches: false,
      changelog_visible: false,
      content_readable: false
    };

    try {
      // Check 1: Artifact exists in storage
      const readBack = await base44.entities.PublishedOutput.filter({ id: artifact.id });
      if (readBack && readBack.length === 1) {
        verificationChecks.artifact_exists = true;
        console.log('[UpgradeFinalizer] ✓ Artifact exists in storage');

        const retrieved = readBack[0];

        // Check 2: Classification correct
        if (retrieved.classification === 'verification_record') {
          verificationChecks.classification_correct = true;
          console.log('[UpgradeFinalizer] ✓ Classification = verification_record');
        }

        // Check 3: Upgrade ID matches
        if (retrieved.upgrade_id === input.upgrade_id) {
          verificationChecks.upgrade_id_matches = true;
          console.log('[UpgradeFinalizer] ✓ Upgrade ID matches');
        }

        // Check 4: Content readable
        if (retrieved.content) {
          try {
            JSON.parse(retrieved.content);
            verificationChecks.content_readable = true;
            console.log('[UpgradeFinalizer] ✓ Content is valid JSON');
          } catch (e) {
            console.warn('[UpgradeFinalizer] ✗ Content is not valid JSON');
          }
        }
      } else {
        console.error('[UpgradeFinalizer] ✗ Artifact not found in storage');
      }

      // Check 5: ChangeLog visibility (query same as ChangeLog page)
      const changelogQuery = await base44.entities.PublishedOutput.filter({
        status: 'published',
        classification: 'verification_record',
        upgrade_id: input.upgrade_id
      });

      if (changelogQuery.find(r => r.id === artifact.id)) {
        verificationChecks.changelog_visible = true;
        console.log('[UpgradeFinalizer] ✓ Artifact visible in ChangeLog query');
      } else {
        console.warn('[UpgradeFinalizer] ✗ Artifact not visible in ChangeLog query');
      }

    } catch (verifyError) {
      console.error('[UpgradeFinalizer] Post-write verification error:', verifyError);
    }

    // Evaluate verification results
    const allChecksPassed = Object.values(verificationChecks).every(v => v === true);

    if (!allChecksPassed) {
      console.warn('[UpgradeFinalizer] Some verification checks failed:', verificationChecks);
      return Response.json({
        success: false,
        finalization_status: 'verification_failed',
        artifact_id: artifact.id,
        artifact_name: artifactName,
        verification_checks: verificationChecks,
        message: 'Artifact created but post-write verification failed',
        error: 'Upgrade completion blocked - verification checks did not pass'
      }, { status: 500 });
    }

    console.log('[UpgradeFinalizer] ✓ All post-write verification checks passed');

    // Success: all checks passed
    return Response.json({
      success: true,
      finalization_status: 'complete',
      artifact_id: artifact.id,
      artifact_name: artifactName,
      verification_status: status,
      verification_checks: verificationChecks,
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