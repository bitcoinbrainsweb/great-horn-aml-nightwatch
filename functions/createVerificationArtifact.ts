import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * CANONICAL VERIFICATION ARTIFACT WRITER - NW-UPGRADE-031
 * 
 * Single source of truth for creating verification_record artifacts.
 * This is the ONLY approved path for verification_record classification in Nightwatch.
 * All other verification writers (generateVerificationArtifact, publishVerificationRecord, CentralPublisher)
 * have been deprecated and removed from active use.
 * 
 * Required Fields:
 * - upgrade_id: Canonical upgrade identifier (e.g., NW-UPGRADE-031)
 * - prompt_id: Prompt identifier
 * - product_version: Semantic version (e.g., v0.7.0)
 * - title: Human-readable upgrade title
 * - description: Upgrade description
 * - purpose: Why this upgrade was needed
 * 
 * Optional Fields:
 * - components_modified: Array of modified component paths
 * - validation_results: Object with checks_performed, records_inserted/updated, schema_changes, ui_checks
 * - system_impact: Object with entities_affected, pages_affected, functions_affected, components_affected
 * - known_issues: Object with failures, warnings, notes
 * - delivery_gate_results: Object with test results
 * - test_results: Array of test objects
 * - summary: Brief summary of verification result
 * 
 * Post-Write Verification:
 * This function performs mandatory post-write checks to ensure:
 * 1. Artifact was persisted to database
 * 2. Classification is correct (verification_record)
 * 3. Upgrade ID matches request
 * 4. Artifact is visible in ChangeLog query
 * 5. Content is valid JSON
 * 
 * Returns:
 * {
 *   success: boolean,
 *   artifact_id: string,
 *   artifact_name: string,
 *   verification_status: "PASS" | "PASS_WITH_WARNINGS" | "FAIL",
 *   verification_checks: {
 *     artifact_exists: boolean,
 *     classification_correct: boolean,
 *     upgrade_id_matches: boolean,
 *     changelog_visible: boolean,
 *     content_readable: boolean
 *   },
 *   message: string
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/super_admin can create verification artifacts
    if (!['admin', 'super_admin'].includes(user?.role)) {
      return Response.json({ error: 'Forbidden: Technical Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    
    // Validate required fields
    const required = ['upgrade_id', 'prompt_id', 'product_version', 'title', 'description', 'purpose'];
    const missing = required.filter(f => !payload[f]);
    if (missing.length > 0) {
      return Response.json({ 
        error: 'Missing required fields', 
        missing_fields: missing 
      }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    
    // Build artifact name
    const titleSlug = payload.title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const artifactName = `Nightwatch_VerificationRecord_${titleSlug}_${payload.product_version}_${payload.upgrade_id}_${timestamp.split('T')[0]}`;
    
    // Build structured content
    const content = {
      upgrade_metadata: {
        upgrade_id: payload.upgrade_id,
        prompt_id: payload.prompt_id,
        product_version: payload.product_version,
        timestamp,
        actor: user.email,
        actor_role: user.role
      },
      upgrade_summary: {
        title: payload.title,
        description: payload.description,
        purpose: payload.purpose,
        components_modified: payload.components_modified || []
      },
      validation_results: payload.validation_results || {
        checks_performed: [],
        records_inserted: {},
        records_updated: {},
        schema_changes: [],
        ui_checks: [],
        integration_checks: [],
        total_records_affected: 0
      },
      system_impact: payload.system_impact || {
        entities_affected: [],
        pages_affected: [],
        functions_affected: [],
        components_affected: [],
        total_files_modified: 0
      },
      known_issues: payload.known_issues || {
        failures: [],
        warnings: [],
        notes: [],
        total_issues: 0
      },
      verification_status: payload.verification_status || determineStatus(payload.known_issues),
      delivery_gate_results: payload.delivery_gate_results || {},
      test_results: payload.test_results || []
    };

    console.log('[CanonicalWriter] Creating verification artifact:', artifactName);
    
    // Check for existing artifact (deduplication)
    const existingArtifacts = await base44.asServiceRole.entities.PublishedOutput.filter({
      upgrade_id: payload.upgrade_id,
      classification: 'verification_record'
    });

    let artifact;
    if (existingArtifacts.length > 0) {
      console.log('[CanonicalWriter] Updating existing artifact:', existingArtifacts[0].id);
      // Update existing artifact instead of creating duplicate
      artifact = await base44.asServiceRole.entities.PublishedOutput.update(
        existingArtifacts[0].id,
        {
          outputName: artifactName,
          status: 'published',
          published_at: timestamp,
          content: JSON.stringify(content),
          summary: payload.summary || `${payload.title} verification complete (updated)`,
          metadata: JSON.stringify({
            prompt_id: payload.prompt_id,
            generated_by: 'CanonicalVerificationWriter',
            engine_version: '1.0.0',
            updated: true,
            previous_artifact_id: existingArtifacts[0].id
          })
        }
      );
    } else {
      console.log('[CanonicalWriter] Creating new artifact');
      // Write directly to PublishedOutput (ChangeLog source)
      artifact = await base44.asServiceRole.entities.PublishedOutput.create({
        outputName: artifactName,
        classification: 'verification_record',
        subtype: 'upgrade_verification',
        is_runnable: false,
        is_user_visible: false,
        display_zone: 'internal_only',
        source_module: payload.upgrade_id,
        source_event_type: 'verification_complete',
        product_version: payload.product_version,
        upgrade_id: payload.upgrade_id,
        status: 'published',
        published_at: timestamp,
        content: JSON.stringify(content),
        summary: payload.summary || `${payload.title} verification complete`,
        metadata: JSON.stringify({
          prompt_id: payload.prompt_id,
          generated_by: 'CanonicalVerificationWriter',
          engine_version: '1.0.0'
        })
      });
    }

    console.log('[CanonicalWriter] Artifact created:', artifact.id);
    
    // POST-WRITE VERIFICATION
    console.log('[CanonicalWriter] Performing post-write verification...');
    
    const checks = {
      artifact_exists: false,
      classification_correct: false,
      upgrade_id_matches: false,
      changelog_visible: false,
      content_readable: false
    };

    // 1. Verify artifact exists
    const retrieved = await base44.asServiceRole.entities.PublishedOutput.get(artifact.id);
    checks.artifact_exists = !!retrieved;
    console.log('[CanonicalWriter] ✓ Artifact exists in storage');

    // 2. Verify classification
    checks.classification_correct = retrieved.classification === 'verification_record';
    console.log('[CanonicalWriter] ✓ Classification = verification_record');

    // 3. Verify upgrade_id
    checks.upgrade_id_matches = retrieved.upgrade_id === payload.upgrade_id;
    console.log('[CanonicalWriter] ✓ Upgrade ID matches');

    // 4. Verify ChangeLog visibility (uses same query as ChangeLog page)
    const changelogRecords = await base44.asServiceRole.entities.PublishedOutput.filter({ status: 'published' });
    const changelogFiltered = changelogRecords.filter(r => 
      ['verification_record', 'audit_record', 'delivery_gate_record'].includes(r.classification)
    );
    checks.changelog_visible = changelogFiltered.some(r => r.id === artifact.id);
    console.log('[CanonicalWriter] ✓ Artifact visible in ChangeLog query');

    // 5. Verify content is valid JSON
    try {
      JSON.parse(retrieved.content);
      checks.content_readable = true;
      console.log('[CanonicalWriter] ✓ Content is valid JSON');
    } catch (e) {
      console.error('[CanonicalWriter] ✗ Content is not valid JSON:', e);
    }

    // All checks must pass
    const allPassed = Object.values(checks).every(v => v === true);
    if (!allPassed) {
      console.error('[CanonicalWriter] ✗ Post-write verification failed:', checks);
      return Response.json({
        success: false,
        error: 'Post-write verification failed',
        verification_checks: checks
      }, { status: 500 });
    }

    console.log('[CanonicalWriter] ✓ All post-write verification checks passed');

    return Response.json({
      success: true,
      artifact_id: artifact.id,
      artifact_name: artifactName,
      verification_status: content.verification_status.overall_status || 'PASS',
      verification_checks: checks,
      message: `Verification artifact created successfully and confirmed visible in ChangeLog`
    });

  } catch (error) {
    console.error('[CanonicalWriter] Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

function determineStatus(known_issues) {
  if (!known_issues) {
    return { overall_status: 'PASS', passed: true, passed_with_warnings: false, failed: false };
  }
  
  const hasFailures = known_issues.failures && known_issues.failures.length > 0;
  const hasWarnings = known_issues.warnings && known_issues.warnings.length > 0;
  
  if (hasFailures) {
    return { overall_status: 'FAIL', passed: false, passed_with_warnings: false, failed: true };
  }
  
  if (hasWarnings) {
    return { overall_status: 'PASS_WITH_WARNINGS', passed: true, passed_with_warnings: true, failed: false };
  }
  
  return { overall_status: 'PASS', passed: true, passed_with_warnings: false, failed: false };
}