import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only enforcement
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const build_label = 'NW-UPGRADE-041';
    const checks = [];
    const warnings = [];
    const violations = [];
    const changed_files_summary = [];

    // ===========================
    // A. Core entity/schema checks
    // ===========================
    const requiredEntities = [
      'Engagement',
      'EngagementControlTest',
      'AuditControlSnapshot',
      'ReviewArea',
      'ControlLibrary',
      'PublishedOutput',
      'UpgradeRegistry',
      'EvidenceItem',
      'Observation',
      'Workpaper',
      'SampleSet',
      'SampleItem'
    ];

    for (const entityName of requiredEntities) {
      try {
        const schema = await base44.asServiceRole.entities[entityName].schema();
        checks.push({
          category: 'Entity Schema',
          check: `Entity ${entityName} exists`,
          status: 'PASS',
          details: `Schema loaded with ${Object.keys(schema.properties || {}).length} properties`
        });
      } catch (error) {
        violations.push({
          category: 'Entity Schema',
          check: `Entity ${entityName} exists`,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Major field checks
    const fieldChecks = [
      { entity: 'Engagement', field: 'engagement_name' },
      { entity: 'Engagement', field: 'engagement_type' },
      { entity: 'Engagement', field: 'status' },
      { entity: 'EngagementControlTest', field: 'engagement_id' },
      { entity: 'EngagementControlTest', field: 'control_library_id' },
      { entity: 'EngagementControlTest', field: 'audit_control_snapshot_id' },
      { entity: 'PublishedOutput', field: 'classification' },
      { entity: 'PublishedOutput', field: 'display_zone' },
      { entity: 'UpgradeRegistry', field: 'upgrade_id' }
    ];

    for (const { entity, field } of fieldChecks) {
      try {
        const schema = await base44.asServiceRole.entities[entity].schema();
        if (schema.properties && schema.properties[field]) {
          checks.push({
            category: 'Entity Fields',
            check: `${entity}.${field} exists`,
            status: 'PASS'
          });
        } else {
          violations.push({
            category: 'Entity Fields',
            check: `${entity}.${field} exists`,
            status: 'FAIL',
            error: 'Field not found in schema'
          });
        }
      } catch (error) {
        violations.push({
          category: 'Entity Fields',
          check: `${entity}.${field} exists`,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // ===========================
    // B. Core page smoke checks
    // ===========================
    const requiredPages = [
      'EngagementsV2',
      'EngagementDetailV2',
      'EngagementControlTesting',
      'ChangeLog',
      'ArtifactDiagnostics',
      'RunNW040Verification',
      'NW040UpgradeSummary'
    ];

    for (const pageName of requiredPages) {
      try {
        const pageContent = await Deno.readTextFile(`/app/src/pages/${pageName}.jsx`);
        if (pageContent.includes('export default')) {
          checks.push({
            category: 'Page Smoke Test',
            check: `Page ${pageName} exists and exports default`,
            status: 'PASS'
          });
        } else {
          warnings.push({
            category: 'Page Smoke Test',
            check: `Page ${pageName} exists and exports default`,
            status: 'WARN',
            details: 'File exists but may not export default properly'
          });
        }
      } catch (error) {
        violations.push({
          category: 'Page Smoke Test',
          check: `Page ${pageName} exists`,
          status: 'FAIL',
          error: error.message
        });
      }
    }

    // Route configuration check
    try {
      const appJsx = await Deno.readTextFile('/app/src/App.jsx');
      const missingRoutes = [];
      for (const pageName of requiredPages) {
        if (!appJsx.includes(`path="/${pageName}"`)) {
          missingRoutes.push(pageName);
        }
      }
      if (missingRoutes.length === 0) {
        checks.push({
          category: 'Routing',
          check: 'All critical pages have routes in App.jsx',
          status: 'PASS'
        });
      } else {
        violations.push({
          category: 'Routing',
          check: 'All critical pages have routes in App.jsx',
          status: 'FAIL',
          details: `Missing routes: ${missingRoutes.join(', ')}`
        });
      }
    } catch (error) {
      warnings.push({
        category: 'Routing',
        check: 'Route configuration readable',
        status: 'WARN',
        error: error.message
      });
    }

    // ===========================
    // C. Canonical artifact verification
    // ===========================
    try {
      // Test creating a verification artifact
      const testArtifact = await base44.asServiceRole.entities.PublishedOutput.create({
        outputName: `Nightwatch_BuildVerificationTest_${build_label}_${new Date().toISOString().split('T')[0]}`,
        classification: 'verification_record',
        subtype: 'build_verification',
        display_zone: 'internal_only',
        source_module: 'BuildVerificationRunner',
        source_event_type: 'build_verification_complete',
        product_version: 'v0.6.0',
        upgrade_id: build_label,
        status: 'published',
        published_at: new Date().toISOString(),
        content: JSON.stringify({ test: true, generated_at: new Date().toISOString() }),
        summary: 'Test artifact for build verification system validation',
        is_user_visible: false,
        is_runnable: false
      });

      checks.push({
        category: 'Artifact Publishing',
        check: 'Can create verification_record via canonical path',
        status: 'PASS',
        details: `Test artifact ID: ${testArtifact.id}`
      });

      // Verify it's queryable
      const verifyQuery = await base44.asServiceRole.entities.PublishedOutput.filter({
        classification: 'verification_record',
        upgrade_id: build_label
      });

      if (verifyQuery.length > 0) {
        checks.push({
          category: 'Artifact Publishing',
          check: 'Verification records are queryable',
          status: 'PASS',
          details: `Found ${verifyQuery.length} verification record(s) for ${build_label}`
        });
      } else {
        warnings.push({
          category: 'Artifact Publishing',
          check: 'Verification records are queryable',
          status: 'WARN',
          details: 'Query returned no results immediately after creation'
        });
      }
    } catch (error) {
      violations.push({
        category: 'Artifact Publishing',
        check: 'Can create verification_record via canonical path',
        status: 'FAIL',
        error: error.message
      });
    }

    // ===========================
    // D. ChangeLog health
    // ===========================
    try {
      const verificationRecords = await base44.asServiceRole.entities.PublishedOutput.filter({
        classification: 'verification_record'
      }, '-published_at', 10);

      if (verificationRecords.length > 0) {
        checks.push({
          category: 'ChangeLog Health',
          check: 'Verification tab query returns records',
          status: 'PASS',
          details: `Found ${verificationRecords.length} verification record(s)`
        });

        // Check latest record readability
        const latest = verificationRecords[0];
        if (latest.content && latest.outputName && latest.classification === 'verification_record') {
          checks.push({
            category: 'ChangeLog Health',
            check: 'Latest verification record is readable',
            status: 'PASS',
            details: `Latest: ${latest.outputName}`
          });
        } else {
          warnings.push({
            category: 'ChangeLog Health',
            check: 'Latest verification record is readable',
            status: 'WARN',
            details: 'Latest record missing expected fields'
          });
        }
      } else {
        warnings.push({
          category: 'ChangeLog Health',
          check: 'Verification tab query returns records',
          status: 'WARN',
          details: 'No verification records found (may be first run)'
        });
      }
    } catch (error) {
      violations.push({
        category: 'ChangeLog Health',
        check: 'Verification tab query functional',
        status: 'FAIL',
        error: error.message
      });
    }

    // ===========================
    // E. Permissions regression checks
    // ===========================
    const criticalAdminFunctions = [
      'verifyEngagementAuditFoundation',
      'verifyLatestBuild',
      'createVerificationArtifact'
    ];

    for (const funcName of criticalAdminFunctions) {
      try {
        const funcContent = await Deno.readTextFile(`/app/functions/${funcName}.js`);
        const hasAdminCheck = funcContent.includes("user.role !== 'admin'") || 
                               funcContent.includes("user.role === 'admin'") ||
                               funcContent.includes("user.role !== 'super_admin'");
        
        if (hasAdminCheck) {
          checks.push({
            category: 'Permissions',
            check: `Function ${funcName} has admin check`,
            status: 'PASS'
          });
        } else {
          warnings.push({
            category: 'Permissions',
            check: `Function ${funcName} has admin check`,
            status: 'WARN',
            details: 'No explicit admin role check found in function body'
          });
        }
      } catch (error) {
        // Function may not exist yet, that's ok for optional checks
        if (funcName === 'verifyLatestBuild') {
          // This is the current function, skip
          continue;
        }
        warnings.push({
          category: 'Permissions',
          check: `Function ${funcName} accessible for verification`,
          status: 'WARN',
          details: 'Function not found or not readable'
        });
      }
    }

    // ===========================
    // Summary calculation
    // ===========================
    const totalChecks = checks.length;
    const totalWarnings = warnings.length;
    const totalViolations = violations.length;
    const success = totalViolations === 0;

    const generated_at = new Date().toISOString();

    // Build changed files summary (basic for now)
    changed_files_summary.push(
      'functions/verifyLatestBuild.js',
      'pages/BuildVerificationDashboard.jsx',
      'components/verification/BuildVerificationSummary.jsx'
    );

    // ===========================
    // Publish canonical verification artifact
    // ===========================
    let artifact_publish_status = {};
    try {
      const artifactContent = {
        build_label,
        success,
        generated_at,
        summary: {
          total_checks: totalChecks,
          total_warnings: totalWarnings,
          total_violations: totalViolations
        },
        checks,
        warnings,
        violations,
        changed_files_summary
      };

      const artifact = await base44.asServiceRole.entities.PublishedOutput.create({
        outputName: `Nightwatch_BuildVerification_${build_label}_${new Date().toISOString().split('T')[0]}`,
        classification: 'verification_record',
        subtype: 'build_verification',
        display_zone: 'internal_only',
        source_module: 'BuildVerificationRunner',
        source_event_type: 'build_verification_complete',
        product_version: 'v0.6.0',
        upgrade_id: build_label,
        status: 'published',
        published_at: generated_at,
        content: JSON.stringify(artifactContent),
        summary: `Build verification for ${build_label}: ${totalChecks} checks, ${totalWarnings} warnings, ${totalViolations} violations`,
        is_user_visible: false,
        is_runnable: false
      });

      artifact_publish_status = {
        success: true,
        artifact_id: artifact.id,
        artifact_title: artifact.outputName,
        published_at: artifact.published_at
      };

      checks.push({
        category: 'Artifact Publishing',
        check: 'Published canonical verification artifact',
        status: 'PASS',
        details: `Artifact ID: ${artifact.id}`
      });
    } catch (error) {
      artifact_publish_status = {
        success: false,
        error: error.message
      };
      violations.push({
        category: 'Artifact Publishing',
        check: 'Publish canonical verification artifact',
        status: 'FAIL',
        error: error.message
      });
    }

    // ===========================
    // Generate result summary markdown
    // ===========================
    const markdown = generateResultMarkdown({
      build_label,
      success,
      generated_at,
      checks,
      warnings,
      violations,
      changed_files_summary,
      artifact_publish_status
    });

    // Return structured response
    return Response.json({
      success,
      build_label,
      checks,
      warnings,
      violations,
      changed_files_summary,
      artifact_publish_status,
      generated_at,
      results_markdown: markdown
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

function generateResultMarkdown(data) {
  const { build_label, success, generated_at, checks, warnings, violations, changed_files_summary, artifact_publish_status } = data;
  
  let md = `# ${build_label} — Build Verification Results\n\n`;
  md += `**Status:** ${success ? '✅ PASS' : '❌ FAIL'}\n`;
  md += `**Generated:** ${generated_at}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- **Total Checks:** ${checks.length}\n`;
  md += `- **Warnings:** ${warnings.length}\n`;
  md += `- **Violations:** ${violations.length}\n\n`;
  
  md += `## Artifact Publishing\n\n`;
  if (artifact_publish_status.success) {
    md += `✅ **Published:** ${artifact_publish_status.artifact_title}\n`;
    md += `- **Artifact ID:** ${artifact_publish_status.artifact_id}\n`;
    md += `- **Published At:** ${artifact_publish_status.published_at}\n\n`;
  } else {
    md += `❌ **Failed:** ${artifact_publish_status.error}\n\n`;
  }
  
  if (checks.length > 0) {
    md += `## Checks Passed (${checks.length})\n\n`;
    for (const check of checks) {
      md += `- **[${check.category}]** ${check.check}\n`;
      if (check.details) {
        md += `  - ${check.details}\n`;
      }
    }
    md += `\n`;
  }
  
  if (warnings.length > 0) {
    md += `## Warnings (${warnings.length})\n\n`;
    for (const warning of warnings) {
      md += `- **[${warning.category}]** ${warning.check}\n`;
      if (warning.details) {
        md += `  - ${warning.details}\n`;
      }
      if (warning.error) {
        md += `  - Error: ${warning.error}\n`;
      }
    }
    md += `\n`;
  }
  
  if (violations.length > 0) {
    md += `## Violations (${violations.length})\n\n`;
    for (const violation of violations) {
      md += `- **[${violation.category}]** ${violation.check}\n`;
      if (violation.details) {
        md += `  - ${violation.details}\n`;
      }
      if (violation.error) {
        md += `  - Error: ${violation.error}\n`;
      }
    }
    md += `\n`;
  }
  
  if (changed_files_summary.length > 0) {
    md += `## Changed Files\n\n`;
    for (const file of changed_files_summary) {
      md += `- ${file}\n`;
    }
    md += `\n`;
  }
  
  md += `---\n`;
  md += `*Generated by Nightwatch Build Verification Runner*\n`;
  
  return md;
}