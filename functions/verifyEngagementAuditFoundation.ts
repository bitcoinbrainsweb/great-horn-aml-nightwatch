import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const checks = [];
    const warnings = [];
    const violations = [];

    // Check A — Engagement entity structure
    try {
      const engagementSchema = await base44.entities.Engagement.schema();
      const requiredFields = [
        'client_id',
        'engagement_type',
        'engagement_owner',
        'reviewer',
        'status',
        'review_period_start',
        'review_period_end'
      ];

      const missingFields = requiredFields.filter(
        field => !engagementSchema.properties[field]
      );

      if (missingFields.length > 0) {
        violations.push({
          check: 'Check A - Engagement Entity Structure',
          issue: `Missing required fields: ${missingFields.join(', ')}`,
          severity: 'critical'
        });
      } else {
        checks.push({
          check: 'Check A - Engagement Entity Structure',
          status: 'passed',
          details: 'All required fields present in Engagement entity'
        });
      }
    } catch (error) {
      violations.push({
        check: 'Check A - Engagement Entity Structure',
        issue: `Failed to read Engagement schema: ${error.message}`,
        severity: 'critical'
      });
    }

    // Check B — Engagement type support
    try {
      const engagementSchema = await base44.entities.Engagement.schema();
      const engagementTypeEnum = engagementSchema.properties.engagement_type?.enum || [];
      
      const requiredTypes = [
        'Effectiveness Review',
        'Risk Assessment',
        'Control Testing',
        'Regulatory Exam',
        'Remediation Follow-Up',
        'Targeted Review',
        'Policy Creation'
      ];

      const missingTypes = requiredTypes.filter(
        type => !engagementTypeEnum.includes(type)
      );

      if (missingTypes.length > 0) {
        warnings.push({
          check: 'Check B - Engagement Type Support',
          issue: `Missing engagement types: ${missingTypes.join(', ')}`,
          severity: 'medium'
        });
      } else {
        checks.push({
          check: 'Check B - Engagement Type Support',
          status: 'passed',
          details: `All ${requiredTypes.length} engagement types supported`
        });
      }
    } catch (error) {
      warnings.push({
        check: 'Check B - Engagement Type Support',
        issue: `Could not verify engagement types: ${error.message}`,
        severity: 'medium'
      });
    }

    // Check C — Audit object existence
    const requiredEntities = [
      'ReviewArea',
      'EngagementControlTest',
      'AuditControlSnapshot',
      'Workpaper',
      'SampleSet',
      'SampleItem',
      'EvidenceItem',
      'Observation'
    ];

    const missingEntities = [];
    for (const entityName of requiredEntities) {
      try {
        await base44.asServiceRole.entities[entityName].schema();
        checks.push({
          check: `Check C - Entity Existence: ${entityName}`,
          status: 'passed',
          details: `${entityName} entity exists`
        });
      } catch (error) {
        missingEntities.push(entityName);
        violations.push({
          check: `Check C - Entity Existence: ${entityName}`,
          issue: `Entity ${entityName} does not exist`,
          severity: 'critical'
        });
      }
    }

    // Check D — Control linkage
    try {
      const testSchema = await base44.entities.EngagementControlTest.schema();
      const requiredRefs = [
        'control_library_id',
        'review_area_id',
        'engagement_id'
      ];

      const missingRefs = requiredRefs.filter(
        ref => !testSchema.properties[ref]
      );

      if (missingRefs.length > 0) {
        violations.push({
          check: 'Check D - Control Linkage',
          issue: `Missing linkage fields in EngagementControlTest: ${missingRefs.join(', ')}`,
          severity: 'critical'
        });
      } else {
        checks.push({
          check: 'Check D - Control Linkage',
          status: 'passed',
          details: 'EngagementControlTest has proper control/review/engagement linkage'
        });
      }
    } catch (error) {
      violations.push({
        check: 'Check D - Control Linkage',
        issue: `Could not verify control linkage: ${error.message}`,
        severity: 'critical'
      });
    }

    // Check E — Evidence linkage
    try {
      const evidenceSchema = await base44.entities.EvidenceItem.schema();
      const requiredRefs = [
        'engagement_id',
        'control_test_id',
        'observation_id',
        'remediation_id'
      ];

      const hasRefs = requiredRefs.filter(
        ref => evidenceSchema.properties[ref]
      );

      if (hasRefs.length < requiredRefs.length) {
        const missing = requiredRefs.filter(ref => !evidenceSchema.properties[ref]);
        violations.push({
          check: 'Check E - Evidence Linkage',
          issue: `Missing linkage fields in EvidenceItem: ${missing.join(', ')}`,
          severity: 'critical'
        });
      } else {
        checks.push({
          check: 'Check E - Evidence Linkage',
          status: 'passed',
          details: 'EvidenceItem supports engagement/control_test/observation/remediation linkage'
        });
      }
    } catch (error) {
      violations.push({
        check: 'Check E - Evidence Linkage',
        issue: `Could not verify evidence linkage: ${error.message}`,
        severity: 'critical'
      });
    }

    // Check F — Snapshot model
    try {
      const snapshotSchema = await base44.entities.AuditControlSnapshot.schema();
      const requiredFields = [
        'source_control_id',
        'control_name',
        'control_description',
        'engagement_id',
        'snapshot_timestamp'
      ];

      const missingFields = requiredFields.filter(
        field => !snapshotSchema.properties[field]
      );

      if (missingFields.length > 0) {
        violations.push({
          check: 'Check F - Snapshot Model',
          issue: `Missing snapshot fields: ${missingFields.join(', ')}`,
          severity: 'critical'
        });
      } else {
        checks.push({
          check: 'Check F - Snapshot Model',
          status: 'passed',
          details: 'AuditControlSnapshot has proper snapshot structure'
        });
      }
    } catch (error) {
      violations.push({
        check: 'Check F - Snapshot Model',
        issue: `Could not verify snapshot model: ${error.message}`,
        severity: 'critical'
      });
    }

    // Additional Check — Backend Functions
    const requiredFunctions = ['initializeAMLReviewAreas', 'createEngagementSnapshots'];
    for (const funcName of requiredFunctions) {
      checks.push({
        check: `Backend Function: ${funcName}`,
        status: 'info',
        details: `Function ${funcName} should exist (manual verification required)`
      });
    }

    // Additional Check — Pages
    const requiredPages = [
      'EngagementsV2',
      'EngagementDetailV2',
      'EngagementControlTesting',
      'AdminEngagementSetup'
    ];
    for (const pageName of requiredPages) {
      checks.push({
        check: `Page: ${pageName}`,
        status: 'info',
        details: `Page ${pageName} should exist (manual verification required)`
      });
    }

    const success = violations.length === 0;

    const verificationResults = {
      success,
      upgrade_id: 'NW-UPGRADE-040',
      product_version: 'v0.7.0',
      verified_at: new Date().toISOString(),
      summary: {
        total_checks: checks.length,
        passed_checks: checks.filter(c => c.status === 'passed').length,
        warnings: warnings.length,
        violations: violations.length
      },
      checks,
      warnings,
      violations
    };

    // Publish verification artifact - write directly to PublishedOutput
    try {
      const publishedAt = new Date().toISOString();
      const dateSlug = publishedAt.split('T')[0];
      
      // Check for existing artifact (deduplication)
      const existingArtifacts = await base44.asServiceRole.entities.PublishedOutput.filter({
        upgrade_id: 'NW-UPGRADE-040',
        classification: 'verification_record'
      });

      let artifact;
      if (existingArtifacts.length > 0) {
        console.log('[NW-040 Verification] Updating existing artifact:', existingArtifacts[0].id);
        artifact = await base44.asServiceRole.entities.PublishedOutput.update(
          existingArtifacts[0].id,
          {
            outputName: `Nightwatch_VerificationRecord_NW-UPGRADE-040_${dateSlug}`,
            status: 'published',
            published_at: publishedAt,
            content: JSON.stringify(verificationResults, null, 2),
            summary: `NW-UPGRADE-040 Verification - ${success ? 'PASSED' : 'FAILED'} (${violations.length} violations, ${warnings.length} warnings)`,
            metadata: JSON.stringify({
              verified_by: user.email,
              verification_type: 'automated',
              framework_version: 'v0.7.0',
              updated: true
            })
          }
        );
      } else {
        console.log('[NW-040 Verification] Creating new artifact');
        artifact = await base44.asServiceRole.entities.PublishedOutput.create({
          outputName: `Nightwatch_VerificationRecord_NW-UPGRADE-040_${dateSlug}`,
          classification: 'verification_record',
          subtype: 'verification',
          is_runnable: false,
          is_user_visible: false,
          display_zone: 'internal_only',
          source_module: 'VerificationEngine',
          source_event_type: 'verification_complete',
          product_version: 'v0.7.0',
          upgrade_id: 'NW-UPGRADE-040',
          status: 'published',
          published_at: publishedAt,
          content: JSON.stringify(verificationResults, null, 2),
          summary: `NW-UPGRADE-040 Verification - ${success ? 'PASSED' : 'FAILED'} (${violations.length} violations, ${warnings.length} warnings)`,
          metadata: JSON.stringify({
            verified_by: user.email,
            verification_type: 'automated',
            framework_version: 'v0.7.0'
          })
        });
      }

      verificationResults.artifact_published = true;
      verificationResults.artifact_id = artifact.id;
      verificationResults.artifact_title = artifact.outputName;
      verificationResults.artifact_published_at = publishedAt;
      verificationResults.artifact_classification = artifact.classification;
      
      console.log('[NW-040 Verification] ✓ Artifact published:', artifact.id);
    } catch (error) {
      verificationResults.artifact_published = false;
      verificationResults.artifact_error = error.message;
      verificationResults.artifact_error_stack = error.stack;
      console.error('[NW-040 Verification] ✗ Artifact publish failed:', error);
    }

    return Response.json(verificationResults, { status: success ? 200 : 422 });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});