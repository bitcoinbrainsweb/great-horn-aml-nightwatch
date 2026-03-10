import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Generate the delivery gate report
    const dgRes = await base44.functions.invoke('deliveryGateNW011', {});
    const dgReport = dgRes.data;

    // Publish using CentralPublisher
    const publishRes = await base44.functions.invoke('CentralPublisher', {
      classification: 'report',
      subtype: 'verification',
      outputName: dgReport.reportName,
      source_module: 'DeliveryGateRunner',
      source_event_type: 'verification_complete',
      product_version: 'v0.6.0',
      upgrade_id: 'NW-UPGRADE-011',
      report_type: 'verification',
      status: 'published',
      content: JSON.stringify(dgReport, null, 2),
      summary: `NW-UPGRADE-011 ${dgReport.status}: ${dgReport.summary.objective}`,
      metadata: {
        verificationTests: dgReport.verificationTests.total,
        passed: dgReport.verificationTests.passed,
        failed: dgReport.verificationTests.failed,
      },
    });

    return Response.json({
      success: true,
      published: publishRes.data.output,
      displayZone: publishRes.data.displayZone,
      auditId: publishRes.data.auditId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});