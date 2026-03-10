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
      reclassified: 0,
      archived: 0,
      verified: 0,
      details: [],
    };

    // Get all existing outputs
    const outputs = await base44.entities.OutputRegistryItem.list();

    for (const output of outputs) {
      let corrected = false;

      // Rule 1: Delivery Gate outputs should be reports, not tools
      if (output.upgradeId?.startsWith('NW-UPGRADE') && output.sourceType === 'DeliveryGateRun') {
        if (output.outputClass !== 'report' || !output.visibleInReports) {
          await base44.entities.OutputRegistryItem.update(output.id, {
            outputClass: 'report',
            visibleInReports: true,
            visibleInAdminTools: false,
            visibleInDocs: false,
            visibleInHelp: false,
            legacyClassification: output.outputClass,
            status: 'published',
          });
          results.reclassified++;
          results.details.push({ outputId: output.outputId, correction: 'delivery_gate_to_report' });
          corrected = true;
        }
      }

      // Rule 2: Documentation/help outputs should not be tools
      if (output.outputType?.includes('documentation') || output.outputType?.includes('help')) {
        if (output.visibleInAdminTools || output.outputClass === 'tool') {
          await base44.entities.OutputRegistryItem.update(output.id, {
            outputClass: 'documentation',
            visibleInDocs: true,
            visibleInHelp: true,
            visibleInAdminTools: false,
            visibleInReports: false,
            legacyClassification: output.outputClass,
            status: 'published',
          });
          results.reclassified++;
          results.details.push({ outputId: output.outputId, correction: 'doc_visibility_fixed' });
          corrected = true;
        }
      }

      // Rule 3: Reports should not be in AdminTools
      if (output.outputClass === 'report' && output.visibleInAdminTools) {
        await base44.entities.OutputRegistryItem.update(output.id, {
          visibleInAdminTools: false,
          status: 'published',
        });
        results.reclassified++;
        results.details.push({ outputId: output.outputId, correction: 'report_removed_from_tools' });
        corrected = true;
      }

      // Rule 4: Normalize any misclassified items
      if (output.status === 'misclassified') {
        // Infer correct class based on outputType
        let correctClass = 'internal_record';
        if (output.outputType?.includes('report')) correctClass = 'report';
        if (output.outputType?.includes('documentation') || output.outputType?.includes('help')) correctClass = 'documentation';
        if (output.outputType?.includes('tool')) correctClass = 'tool';

        await base44.entities.OutputRegistryItem.update(output.id, {
          outputClass: correctClass,
          status: 'published',
        });
        results.verified++;
        results.details.push({ outputId: output.outputId, correction: 'misclassified_resolved' });
        corrected = true;
      }

      if (!corrected) {
        results.verified++;
      }
    }

    results.summary = `Reclassified ${results.reclassified} items, verified ${results.verified} items`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});