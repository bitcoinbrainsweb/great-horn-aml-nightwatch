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

    const report = {
      upgradeId: 'NW-UPGRADE-011A',
      upgradeName: 'Historical Versioning + Naming Normalization',
      productVersion: 'v0.5.0',
      timestamp,
      status: verifyData.failed === 0 ? 'ready' : 'caution',

      implementation: {
        entities: ['PromptHistoryRecord'],
        functions: [
          'normalizeHistoricalVersioning',
          'verifyHistoricalNormalization',
          'historicalNormalizationAudit',
          'deliveryGateNW011A',
        ],
        normalizedEntities: [
          'ProductVersion (v0.1.0-v0.5.0)',
          'UpgradeVersionMapping (established)',
          'PromptHistoryRecord (backfilled)',
        ],
      },

      verification: verifyData,
      architecture: auditData,

      documentation: {
        canonicalProductVersions: {
          'v0.1.0': 'Core Architecture (001-003)',
          'v0.2.0': 'Deterministic Engine (004-005)',
          'v0.3.0': 'User & Config Management (006-007)',
          'v0.4.0': 'Evidence & Testing (008)',
          'v0.5.0': 'Release Versioning & Regression (009-010)',
          'v0.6.0': 'Governance (011) & Assessment Templates (012)',
        },
        standards: [
          'ProductVersion uses semantic versioning (v0.1.0, v0.2.0, etc.)',
          'NW-UPGRADE-### is permanent engineering change ID',
          'Canonical report format: Nightwatch_<Type>_<Version>_<UpgradeID>_<Date>',
        ],
      },

      releaseReadiness: verifyData.failed === 0 ? 'ready' : 'caution',
      currentProductVersion: 'v0.5.0',
      nextPlannedProductVersion: 'v0.6.0',
      remainingCleanupGaps: [
        'Legacy report titles in archives (retained for reference)',
        'Older documentation may reference v0.9.0/v0.10.0 labels (non-critical)',
      ],
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});