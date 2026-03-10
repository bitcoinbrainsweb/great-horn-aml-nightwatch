import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();

    // Run normalization
    const normalizeRes = await base44.functions.invoke('NormalizeOutputClassification', {});
    const normalizeData = normalizeRes.data;

    // Run verification
    const verifyRes = await base44.functions.invoke('verifyOutputClassification', {});
    const verifyData = verifyRes.data;

    // Run audit
    const auditRes = await base44.functions.invoke('auditOutputClassificationArchitecture', {});
    const auditData = auditRes.data;

    const report = {
      upgradeId: 'NW-UPGRADE-010B',
      upgradeName: 'Output Classification + Report/Doc Routing Correction',
      productVersion: 'v0.5.0',
      timestamp,
      status: verifyData.failed === 0 ? 'ready' : 'caution',

      implementation: {
        entities: ['OutputRegistryItem'],
        functions: [
          'NormalizeOutputClassification',
          'verifyOutputClassification',
          'auditOutputClassificationArchitecture',
          'deliveryGateNW010B',
        ],
        components: [
          'OutputClassificationDashboard',
          'MisclassifiedOutputReview',
        ],
        changes: [
          'Created OutputRegistryItem for canonical output classification',
          'Implemented classification rules (report, documentation, tool)',
          'Reports route to Reports page only, not AdminTools',
          'Documentation routes to docs/help only, not AdminTools',
          'NormalizeOutputClassification fixes historical misclassifications',
          'AdminTools filter now requires outputClass = tool',
          'Visibility flags are now explicit, not inferred',
        ],
      },

      normalization: normalizeData,
      verification: verifyData,
      architecture: auditData,

      documentation: {
        classificationRules: {
          report: {
            visibleInReports: true,
            visibleInAdminTools: false,
            visibleInDocs: false,
          },
          documentation: {
            visibleInDocs: true,
            visibleInHelp: true,
            visibleInAdminTools: false,
            visibleInReports: false,
          },
          tool: {
            visibleInAdminTools: true,
            visibleInReports: false,
            visibleInDocs: false,
          },
        },
        routingGuarantees: [
          'Generated reports never appear as tools',
          'Generated docs never appear as tools',
          'Reports page sources only outputClass=report items',
          'AdminTools sources only outputClass=tool items',
          'Help/Docs sources only outputClass=documentation/help items',
        ],
      },

      releaseReadiness: verifyData.failed === 0 ? 'ready' : 'caution',
      recommendedActions: [
        'Run NormalizeOutputClassification to repair historical misclassifications',
        'Verify all reports appear only on Reports page',
        'Verify AdminTools shows only true tools',
        'Review OutputClassificationDashboard for any remaining issues',
        'Update any custom output generation to use OutputRegistryItem',
      ],

      currentProductVersion: 'v0.5.0',
      historicalItemsReclassified: normalizeData.reclassified,
      internalToolsNowCorrect: verifyData.checks.find(c => c.name.includes('AdminTools'))?.status === 'pass',
      reportsPageCanonical: verifyData.checks.find(c => c.name.includes('Reports'))?.status === 'pass',
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});