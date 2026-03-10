import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { upgrade_id } = body;

    if (!upgrade_id) {
      return Response.json({ error: 'Missing upgrade_id' }, { status: 400 });
    }

    const registries = await base44.asServiceRole.entities.UpgradeRegistry.filter({
      upgrade_id
    });

    if (registries.length === 0) {
      return Response.json(
        { error: 'Upgrade not found', upgrade_id },
        { status: 404 }
      );
    }

    const registry = registries[0];
    const today = new Date().toISOString().split('T')[0];
    const recordName = `Nightwatch_VerificationRecord_${registry.product_version}_${upgrade_id}_${today}`;
    const now = new Date().toISOString();

    const content = {
      title: registry.title,
      description: registry.description,
      upgrade_id,
      product_version: registry.product_version,
      delivery_gate_results: registry.delivery_gate_results ? JSON.parse(registry.delivery_gate_results) : {},
      change_summary: registry.change_summary ? JSON.parse(registry.change_summary) : {}
    };

    const existing = await base44.asServiceRole.entities.PublishedOutput.filter({
      upgrade_id,
      classification: 'verification_record'
    });

    let published;
    if (existing.length > 0 && existing[0].outputName === recordName) {
      published = await base44.asServiceRole.entities.PublishedOutput.update(
        existing[0].id,
        {
          status: 'published',
          published_at: now,
          content: JSON.stringify(content),
          summary: registry.title
        }
      );
    } else {
      published = await base44.asServiceRole.entities.PublishedOutput.create({
        outputName: recordName,
        classification: 'verification_record',
        subtype: 'upgrade_verification',
        is_runnable: false,
        is_user_visible: false,
        display_zone: 'internal_only',
        source_module: 'publishVerificationRecord',
        source_event_type: 'upgrade_completion',
        product_version: registry.product_version,
        upgrade_id,
        report_type: 'verification',
        status: 'published',
        published_at: now,
        content: JSON.stringify(content),
        summary: registry.title,
        metadata: JSON.stringify({ lifecycle_generated: true })
      });
    }

    const updated = await base44.asServiceRole.entities.UpgradeRegistry.update(
      registry.id,
      {
        verification_record_id: published.id
      }
    );

    await base44.asServiceRole.entities.UpgradeAuditLog.create({
      upgrade_id,
      action: 'verification_record_created',
      prior_status: registry.status,
      new_status: registry.status,
      triggering_function: 'publishVerificationRecord',
      actor: 'system',
      timestamp: now,
      context: JSON.stringify({ published_output_id: published.id, record_name: recordName })
    });

    return Response.json({
      success: true,
      upgrade_id,
      record_id: published.id,
      record_name: recordName
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});