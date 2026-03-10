import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // Validate required fields
    const required = ['classification', 'source_module', 'product_version'];
    for (const field of required) {
      if (!payload[field]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Determine display zone from classification
    const zoneMap = {
      report: 'reports',
      documentation: 'docs',
      help: 'help',
      tool: 'tools',
      dashboard_widget: 'dashboard',
      internal_record: 'internal_only',
    };

    const classification = payload.classification || 'internal_record';
    const displayZone = payload.display_zone || zoneMap[classification] || 'internal_only';

    // Default safe values
    const isRunnable = classification === 'tool' ? (payload.is_runnable ?? false) : false;
    const isUserVisible = ['report', 'documentation', 'help', 'dashboard_widget'].includes(classification);

    // Generate canonical name
    const date = new Date().toISOString().split('T')[0];
    const reportType = payload.report_type || payload.subtype || classification;
    const upgradeId = payload.upgrade_id || 'NW-UNKNOWN';
    const outputName = payload.outputName || `Nightwatch_${reportType}_${payload.product_version}_${upgradeId}_${date}`;

    // Create the published output
    const output = await base44.entities.PublishedOutput.create({
      outputName,
      classification,
      subtype: payload.subtype || classification,
      is_runnable: isRunnable,
      is_user_visible: isUserVisible,
      display_zone: displayZone,
      source_module: payload.source_module,
      source_event_type: payload.source_event_type || 'manual_publication',
      product_version: payload.product_version,
      upgrade_id: payload.upgrade_id,
      report_type: payload.report_type,
      status: payload.status || 'published',
      published_at: new Date().toISOString(),
      content: typeof payload.content === 'string' ? payload.content : JSON.stringify(payload.content, null, 2),
      summary: payload.summary,
      metadata: typeof payload.metadata === 'string' ? payload.metadata : JSON.stringify(payload.metadata || {}),
    });

    // Create audit log entry
    const auditId = `AUDIT-${output.id}-${Date.now()}`;
    await base44.entities.PublicationAuditLog.create({
      auditId,
      outputId: output.id,
      outputName: outputName,
      eventType: 'publication',
      newClassification: classification,
      newDisplayZone: displayZone,
      triggeringFunction: 'CentralPublisher',
      actorEmail: user.email,
      timestamp: new Date().toISOString(),
      context: JSON.stringify({ source: payload.source_module }),
    });

    return Response.json({
      success: true,
      output: output,
      displayZone: displayZone,
      auditId: auditId,
      message: `Published to ${displayZone}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});