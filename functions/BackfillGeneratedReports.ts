import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      backfilledCount: 0,
      skippedCount: 0,
      failedCount: 0,
      details: [],
    };

    // Get recent DeliveryGateRun records
    const deliveryRuns = await base44.entities.DeliveryGateRun.list();
    
    for (const run of deliveryRuns) {
      if (!run.upgradeId || !run.productVersion) continue;

      // Check if report already exists
      const existing = await base44.entities.GeneratedReport.filter({
        upgradeId: run.upgradeId,
        productVersion: run.productVersion,
        reportType: 'delivery_gate',
      });

      if (existing.length > 0) {
        results.skippedCount++;
        continue;
      }

      // Create GeneratedReport from DeliveryGateRun
      try {
        const reportTitle = run.canonicalReportTitle || 
          `Nightwatch_DeliveryGate_${run.productVersion}_${run.upgradeId}_${new Date(run.startedAt).toISOString().split('T')[0]}`;

        await base44.entities.GeneratedReport.create({
          reportId: `gr-backfill-${run.id}`,
          reportTitle,
          reportType: 'delivery_gate',
          upgradeId: run.upgradeId,
          upgradeName: run.upgradeName || run.upgradeId,
          productVersion: run.productVersion,
          sourceRunId: run.id,
          sourceType: 'DeliveryGateRun',
          status: 'published',
          visibleOnReportsPage: true,
          reportDate: run.startedAt,
          publishedAt: new Date().toISOString(),
          summary: `DeliveryGate report for ${run.upgradeId} (v${run.productVersion})`,
        });

        results.backfilledCount++;
        results.details.push({ upgradeId: run.upgradeId, status: 'backfilled' });
      } catch (e) {
        results.failedCount++;
        results.details.push({ upgradeId: run.upgradeId, status: 'failed', error: e.message });
      }
    }

    results.summary = `Backfilled ${results.backfilledCount} reports, skipped ${results.skippedCount}, failed ${results.failedCount}`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});