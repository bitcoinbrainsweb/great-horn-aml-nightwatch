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
      normalized: 0,
      failed: 0,
      skipped: 0,
      versionMapping: {
        'v0.1.0': ['NW-UPGRADE-001', 'NW-UPGRADE-002', 'NW-UPGRADE-003'],
        'v0.2.0': ['NW-UPGRADE-004', 'NW-UPGRADE-005'],
        'v0.3.0': ['NW-UPGRADE-006', 'NW-UPGRADE-007'],
        'v0.4.0': ['NW-UPGRADE-008'],
        'v0.5.0': ['NW-UPGRADE-009', 'NW-UPGRADE-010'],
        'v0.6.0': ['NW-UPGRADE-011'],
      },
      details: [],
    };

    // Try to migrate from old GeneratedReport and OutputRegistryItem
    try {
      const oldReports = await base44.entities.GeneratedReport.list();
      
      for (const report of oldReports) {
        if (!report.reportId) continue;
        
        try {
          // Check if already exists in PublishedOutput
          const existing = await base44.entities.PublishedOutput.filter({
            outputName: report.reportTitle,
          });
          
          if (existing.length > 0) {
            results.skipped++;
            continue;
          }

          // Normalize version and upgrade ID
          let productVersion = report.productVersion || 'v0.5.0';
          let upgradeId = report.upgradeId || 'NW-UPGRADE-010';

          // Create PublishedOutput record
          const newRecord = await base44.entities.PublishedOutput.create({
            outputName: `Nightwatch_${report.reportType}_${productVersion}_${upgradeId}_${new Date(report.reportDate).toISOString().split('T')[0]}`,
            classification: 'report',
            subtype: report.reportType,
            is_runnable: false,
            is_user_visible: true,
            display_zone: 'reports',
            source_module: 'GeneratedReport',
            source_event_type: 'historical_migration',
            product_version: productVersion,
            upgrade_id: upgradeId,
            report_type: report.reportType,
            status: 'published',
            published_at: report.publishedAt || report.reportDate,
            content: report.content,
            summary: report.summary,
            normalization_source: `GeneratedReport:${report.id}`,
          });

          // Create audit log
          await base44.entities.PublicationAuditLog.create({
            auditId: `AUDIT-BACKFILL-${newRecord.id}-${Date.now()}`,
            outputId: newRecord.id,
            outputName: newRecord.outputName,
            eventType: 'normalization',
            newClassification: 'report',
            newDisplayZone: 'reports',
            triggeringFunction: 'BackfillHistoricalRecords',
            actorEmail: user.email,
            timestamp: new Date().toISOString(),
            context: JSON.stringify({ source: 'GeneratedReport', legacyId: report.id }),
          });

          results.normalized++;
          results.details.push({
            action: 'migrated',
            from: `GeneratedReport:${report.reportId}`,
            to: `PublishedOutput:${newRecord.id}`,
          });
        } catch (err) {
          results.failed++;
          results.details.push({
            action: 'failed',
            reportId: report.reportId,
            error: err.message,
          });
        }
      }
    } catch (err) {
      results.details.push({
        action: 'skipped',
        reason: 'GeneratedReport not accessible',
        error: err.message,
      });
    }

    results.summary = `Normalized ${results.normalized} records, skipped ${results.skipped}, failed ${results.failed}`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});