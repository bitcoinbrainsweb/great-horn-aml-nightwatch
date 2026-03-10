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
      skipped: 0,
      failed: 0,
      details: [],
    };

    // Try to migrate from DeliveryGateRun (legacy)
    try {
      const legacyRuns = await base44.entities.DeliveryGateRun.list();
      
      for (const run of legacyRuns) {
        if (!run.runId) continue;
        
        try {
          // Check if already exists in PublishedOutput
          const existing = await base44.entities.PublishedOutput.filter({
            outputName: run.implementationSummary?.runId || run.runId,
          });
          
          if (existing.length > 0) {
            results.skipped++;
            continue;
          }

          // Create canonical PublishedOutput record
          const date = new Date(run.completedAt || new Date()).toISOString().split('T')[0];
          const outputName = `Nightwatch_Verification_${run.version || 'v0.6.0'}_${run.upgradeId || 'NW-UNKNOWN'}_${date}`;
          
          const newRecord = await base44.entities.PublishedOutput.create({
            outputName,
            classification: 'report',
            subtype: 'verification',
            is_runnable: false,
            is_user_visible: true,
            display_zone: 'reports',
            source_module: 'DeliveryGateRunner',
            source_event_type: 'verification_complete',
            product_version: run.version || 'v0.6.0',
            upgrade_id: run.upgradeId || 'NW-UNKNOWN',
            report_type: 'verification',
            status: 'published',
            published_at: run.completedAt || new Date().toISOString(),
            content: JSON.stringify({
              summary: 'Historical verification report migrated from DeliveryGateRun',
              runId: run.runId,
              implementationSummary: run.implementationSummary,
              verificationChecks: run.verificationChecks,
            }, null, 2),
            summary: 'Historical verification report',
            normalization_source: `DeliveryGateRun:${run.id}`,
          });

          // Create audit log
          await base44.entities.PublicationAuditLog.create({
            auditId: `AUDIT-NORM-${newRecord.id}-${Date.now()}`,
            outputId: newRecord.id,
            outputName: outputName,
            eventType: 'normalization',
            newClassification: 'report',
            newDisplayZone: 'reports',
            triggeringFunction: 'NormalizeVerificationReports',
            actorEmail: user.email,
            timestamp: new Date().toISOString(),
            context: JSON.stringify({ source: 'DeliveryGateRun', legacyId: run.id }),
          });

          results.normalized++;
          results.details.push({
            action: 'migrated',
            from: `DeliveryGateRun:${run.runId}`,
            to: `PublishedOutput:${newRecord.id}`,
          });
        } catch (err) {
          results.failed++;
          results.details.push({
            action: 'failed',
            runId: run.runId,
            error: err.message,
          });
        }
      }
    } catch (err) {
      results.details.push({
        action: 'skipped',
        reason: 'DeliveryGateRun not accessible',
        error: err.message,
      });
    }

    results.summary = `Normalized ${results.normalized} reports, skipped ${results.skipped}, failed ${results.failed}`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});