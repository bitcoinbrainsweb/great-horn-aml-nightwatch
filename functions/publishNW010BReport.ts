import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Generate the delivery gate report
    const dgRes = await base44.functions.invoke('deliveryGateNW010B', {});
    const dgReport = dgRes.data;

    // Create the GeneratedReport entry
    const reportId = `NW-010B-${Date.now()}`;
    const content = JSON.stringify(dgReport, null, 2);

    const generated = await base44.entities.GeneratedReport.create({
      reportId,
      reportTitle: 'NW-UPGRADE-010B: Output Classification Correction',
      reportType: 'delivery_gate',
      upgradeId: 'NW-UPGRADE-010B',
      upgradeName: 'Output Classification + Report/Doc Routing Correction',
      productVersion: 'v0.5.0',
      sourceRunId: reportId,
      sourceType: 'DeliveryGateRun',
      status: 'published',
      content,
      summary: `Fixed output classification and routing. Reclassified ${dgReport.normalization?.reclassified || 0} misclassified items. Reports now visible only on Reports page, docs only in documentation, tools only in AdminTools.`,
      reportDate: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      visibleOnReportsPage: true,
    });

    // Also register in OutputRegistryItem
    const outputItem = await base44.entities.OutputRegistryItem.create({
      outputId: reportId,
      title: 'NW-UPGRADE-010B: Output Classification Correction',
      outputClass: 'report',
      outputType: 'delivery_gate_report',
      sourceType: 'DeliveryGateRun',
      sourceId: reportId,
      upgradeId: 'NW-UPGRADE-010B',
      upgradeName: 'Output Classification + Report/Doc Routing Correction',
      productVersion: 'v0.5.0',
      status: 'published',
      visibleInReports: true,
      visibleInDocs: false,
      visibleInAdminTools: false,
      visibleInHelp: false,
    });

    return Response.json({
      success: true,
      generatedReport: generated,
      outputRegistry: outputItem,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});