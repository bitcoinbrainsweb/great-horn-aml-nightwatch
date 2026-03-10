import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();

    // Run verification
    const verifyRes = await base44.functions.invoke('verifyReportPublicationPipeline', {});
    const verifyData = verifyRes.data;

    // Run audit
    const auditRes = await base44.functions.invoke('auditReportPublicationArchitecture', {});
    const auditData = auditRes.data;

    // Backfill historical reports
    const backfillRes = await base44.functions.invoke('BackfillGeneratedReports', {});
    const backfillData = backfillRes.data;

    const report = {
      upgradeId: 'NW-UPGRADE-010A',
      upgradeName: 'Report Publication Pipeline Fix',
      productVersion: 'v0.5.0',
      timestamp,
      status: verifyData.failed === 0 ? 'ready' : 'caution',

      implementation: {
        entities: ['GeneratedReport'],
        functions: [
          'PublishGeneratedReport',
          'BackfillGeneratedReports',
          'verifyReportPublicationPipeline',
          'auditReportPublicationArchitecture',
        ],
        components: [
          'ReportPublicationDashboard',
          'ReportPublicationDetailView',
        ],
        changes: [
          'Created GeneratedReport entity as canonical report storage',
          'PublishGeneratedReport function for reliable publication',
          'Reports page refactored to read from GeneratedReport',
          'DeliveryGateRunner integrated with PublishGeneratedReport',
          'BackfillGeneratedReports repairs historical missing reports',
          'Duplicate prevention based on upgrade+version+type',
          'Publication failures are now visible and tracked',
        ],
      },

      verification: verifyData,
      architecture: auditData,
      backfill: backfillData,

      documentation: {
        pipeline: {
          step1: 'Report generated (any function)',
          step2: 'PublishGeneratedReport called with metadata',
          step3: 'GeneratedReport record persisted',
          step4: 'visibleOnReportsPage = true',
          step5: 'Reports page reads from GeneratedReport',
          step6: 'Report appears to end users',
        },
        failureHandling: [
          'Publication failures mark status = "failed"',
          'Error message stored in publicationError field',
          'Admin sees failed reports in ReportPublicationDashboard',
          'DeliveryGate must explicitly handle publication failures',
        ],
        duplicationPrevention: [
          'Uniqueness key: (upgradeId, productVersion, reportType)',
          'Publishing same report twice returns existing record',
          'No duplicate visible reports created',
        ],
      },

      releaseReadiness: verifyData.failed === 0 ? 'ready' : 'caution',
      recommendedActions: [
        'Run BackfillGeneratedReports to repair historical reports',
        'Verify all recent DeliveryGate outputs now appear on Reports page',
        'Test publication failure handling',
        'Update any custom report generation to use PublishGeneratedReport',
      ],

      currentProductVersion: 'v0.5.0',
      historicalReportsRepaired: backfillData.backfilledCount,
      reportsNowCanonical: true,
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});