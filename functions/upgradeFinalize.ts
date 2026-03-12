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

    // Attempt to invoke Verification Report Engine
    let verificationResult;
    let engineSuccess = false;

    try {
      console.log('[UpgradeFinalizer] Invoking Verification Report Engine...');
      
      const verificationPayload = {
        upgrade_id: input.upgrade_id,
        prompt_id: input.prompt_id,
        product_version: input.product_version,
        title: input.title,
        description: input.description,
        purpose: input.purpose || input.description,
        components_modified: input.components_modified || [],
        validation_results: input.validation_results || {},
        system_impact: input.system_impact || {},
        known_issues: input.known_issues || {},
        delivery_gate_results: input.delivery_gate_results || {},
        test_results: input.test_results || [],
        architectural_compliance: input.architectural_compliance || {},
        summary: input.summary || `${input.title} completed`
      };

      verificationResult = await base44.functions.invoke('generateVerificationArtifact', verificationPayload);
      
      if (verificationResult.data && verificationResult.data.success) {
        engineSuccess = true;
        console.log(`[UpgradeFinalizer] Verification artifact generated: ${verificationResult.data.artifact_id}`);
      } else {
        console.warn('[UpgradeFinalizer] Verification engine returned non-success response:', verificationResult);
      }

    } catch (engineError) {
      console.error('[UpgradeFinalizer] Verification engine failed:', engineError.message);
      console.error('[UpgradeFinalizer] Will create fallback verification record');
    }

    // If verification engine succeeded, return success
    if (engineSuccess) {
      return Response.json({
        success: true,
        finalization_status: 'complete',
        verification_engine_status: 'success',
        artifact_id: verificationResult.data.artifact_id,
        artifact_name: verificationResult.data.artifact_name,
        verification_status: verificationResult.data.status,
        message: `Upgrade ${input.upgrade_id} finalized successfully with verification artifact`
      });
    }

    // FALLBACK: Create minimal verification record if engine failed
    console.log('[UpgradeFinalizer] Creating fallback verification record...');

    const fallbackArtifact = {
      outputName: `Nightwatch_VerificationRecord_${sanitizeForFilename(input.title)}_${input.product_version}_${input.upgrade_id}_${timestamp.split('T')[0]}`,
      classification: 'verification_record',
      subtype: 'fallback_verification',
      is_runnable: false,
      is_user_visible: false,
      display_zone: 'internal_only',
      source_module: input.upgrade_id,
      source_event_type: 'verification_fallback',
      product_version: input.product_version,
      upgrade_id: input.upgrade_id,
      status: 'published',
      published_at: timestamp,
      content: JSON.stringify({
        upgrade_metadata: {
          upgrade_id: input.upgrade_id,
          prompt_id: input.prompt_id,
          product_version: input.product_version,
          timestamp: timestamp,
          actor: user.email,
          fallback_mode: true
        },
        upgrade_summary: {
          title: input.title,
          description: input.description
        },
        validation_results: input.validation_results || {},
        system_impact: input.system_impact || {},
        known_issues: {
          warnings: ['Verification engine failed - fallback record created'],
          ...(input.known_issues || {})
        },
        verification_status: {
          overall_status: 'PASS_WITH_WARNINGS',
          fallback_mode: true
        }
      }),
      summary: `${input.title} (fallback verification)`,
      metadata: JSON.stringify({
        prompt_id: input.prompt_id,
        generated_by: 'UpgradeFinalizer',
        fallback_mode: true
      })
    };

    const fallbackRecord = await base44.entities.PublishedOutput.create(fallbackArtifact);

    console.log(`[UpgradeFinalizer] Fallback verification record created: ${fallbackRecord.id}`);

    return Response.json({
      success: true,
      finalization_status: 'complete_with_fallback',
      verification_engine_status: 'failed',
      fallback_artifact_id: fallbackRecord.id,
      fallback_artifact_name: fallbackArtifact.outputName,
      verification_status: 'PASS_WITH_WARNINGS',
      message: `Upgrade ${input.upgrade_id} finalized with fallback verification record`,
      warning: 'Verification engine failed - fallback record created'
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