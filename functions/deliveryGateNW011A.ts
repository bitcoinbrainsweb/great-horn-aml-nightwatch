import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();

    // Run verification checks
    const verifyRes = await base44.functions.invoke('verifyHistoricalNormalization', {});
    const verifyData = verifyRes.data;

    // Run architecture audit
    const auditRes = await base44.functions.invoke('historicalNormalizationAudit', {});
    const auditData = auditRes.data;

    // Compile delivery gate report
    const report = {
      upgradeId: 'NW-UPGRADE-011A',
      upgradeName: 'Historical Versioning + Naming Normalization',
      productVersion: 'v0.5.0',
      timestamp,
      status: verifyData.failed === 0 ? 'ready' : 'caution',

      // Implementation Summary
      implementation: {
        entities: [
          'PromptHistoryRecord',
        ],
        functions: [
          'normalizeHistoricalVersioning',
          'verifyHistoricalNormalization',
          'historicalNormalizationAudit',
          'deliveryGateNW011A',
        ],
        normalizedEntities: [
          'ProductVersion (v0.1.0-v0.5.0)',
          'UpgradeVersionMapping (established)',
          'UpgradeRegistry (all records)',
          'DeliveryGateRun (canonical titles)',
        ],
        canonicalProductVersions: {
          'v0.1.0': ['NW-UPGRADE-001', 'NW-UPGRADE-002', 'NW-UPGRADE-003'],
          'v0.2.0': ['NW-UPGRADE-004', 'NW-UPGRADE-005'],
          'v0.3.0': ['NW-UPGRADE-006', 'NW-UPGRADE-007'],
          'v0.4.0': ['NW-UPGRADE-008'],
          'v0.5.0': ['NW-UPGRADE-009', 'NW-UPGRADE-010'],
          'v0.6.0': ['NW-UPGRADE-011', 'NW-UPGRADE-012'],
        },
      },

      // Verification Report
      verification: verifyData,

      // Architecture Audit
      architecture: auditData,

      // Documentation Update Summary
      documentation: {
        concepts: [
          'NW-UPGRADE-### : Permanent engineering change identifier',
          'ProductVersion : Semantic version release milestone (v0.1.0, v0.2.0, etc.)',
          'Historical normalization : Retroactive cleanup of naming confusion',
          'Canonical report title format : Nightwatch_<ReportType>_<ProductVersion>_<UpgradeID>_<Date>',
          'Canonical prompt format : Prompt ID + Name + Target Product Version',
        ],
        standards: [
          'ProductVersion must use semantic versioning',
          'Report titles must include ProductVersion and UpgradeID',
          'Prompts must declare Prompt ID, Name, and Target ProductVersion',
          'DeliveryGate must reject reports missing canonical fields',
          'UpgradeRegistry version field must match ProductVersion enum',
        ],
        historicalMap: {
          'v0.1.0': 'Core Architecture + Internal Audit (001-003)',
          'v0.2.0': 'Deterministic Engine + Platform Infrastructure (004-005)',
          'v0.3.0': 'User Access + System Configuration (006-007)',
          'v0.4.0': 'Evidence & Control Testing (008)',
          'v0.5.0': 'Release Versioning & Regression Testing (009-010)',
          'v0.6.0': 'Governance (011) & Assessment Templates (012)',
        },
      },

      // Release Readiness
      releaseReadiness: verifyData.failed === 0 ? 'ready' : 'caution',
      recommendedActions: [
        'Run normalizeHistoricalVersioning to apply all normalization updates',
        'Verify all ProductVersion and UpgradeVersionMapping records are correct',
        'Update dashboards to display canonical product versions',
        'Ensure future DeliveryGate operations use canonical report title format',
        'Train team on new versioning standard: ProductVersion vs NW-UPGRADE',
      ],

      // Current State
      currentProductVersion: 'v0.5.0',
      nextPlannedProductVersion: 'v0.6.0',
      remainingCleanupGaps: [
        'Legacy report titles in archival reports (retained for reference)',
        'Historic dashboard reports may still show old version labels (recommend batch update)',
        'Some older documentation may reference v0.9.0/v0.10.0 labels (not critical)',
      ],
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});