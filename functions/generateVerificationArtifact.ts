import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * DEPRECATED: generateVerificationArtifact
 * 
 * This function is replaced by createVerificationArtifact (canonical writer).
 * Left in codebase for backward compatibility only—do not use for new upgrades.
 * 
 * NW-UPGRADE-031 REFACTOR: All verification artifact creation must route through
 * createVerificationArtifact, which is the sole canonical publisher for verification_record
 * classification in the Nightwatch platform.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const input = await req.json();

    // Validate required fields
    const requiredFields = ['upgrade_id', 'prompt_id', 'product_version', 'title', 'description'];
    const missing = requiredFields.filter(f => !input[f]);
    if (missing.length > 0) {
      return Response.json({
        error: 'Missing required fields',
        missing_fields: missing
      }, { status: 400 });
    }

    // Build structured verification artifact
    const timestamp = new Date().toISOString();
    const artifactName = `Nightwatch_VerificationRecord_${sanitizeForFilename(input.title)}_${input.product_version}_${input.upgrade_id}_${timestamp.split('T')[0]}`;

    const validation = input.validation_results || {};
    const impact = input.system_impact || {};
    const issues = input.known_issues || {};

    // Calculate status
    const hasFailures = (issues.failures || []).length > 0;
    const hasWarnings = (issues.warnings || []).length > 0;
    const status = hasFailures ? 'FAIL' : hasWarnings ? 'PASS_WITH_WARNINGS' : 'PASS';

    // Build verification content
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

    // DEPRECATED: Route through canonical createVerificationArtifact instead
    console.warn('[generateVerificationArtifact] DEPRECATED: Use createVerificationArtifact (canonical writer)');
    
    return Response.json({
      error: 'DEPRECATED: Use createVerificationArtifact',
      message: 'generateVerificationArtifact has been deprecated. Please use createVerificationArtifact (canonical publisher for verification_record classification).',
      upgrade_id: input.upgrade_id
    }, { status: 410 });

  } catch (error) {
    console.error('Verification artifact generation error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
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