import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { upgrade_id, product_version, title, description, tags } = body;

    if (!upgrade_id || !product_version || !title) {
      return Response.json(
        { error: 'Missing required fields: upgrade_id, product_version, title' },
        { status: 400 }
      );
    }

    const existing = await base44.asServiceRole.entities.UpgradeRegistry.filter({
      upgrade_id
    });

    if (existing.length > 0) {
      return Response.json(
        { error: 'Upgrade already exists', upgrade_id },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const registry = await base44.asServiceRole.entities.UpgradeRegistry.create({
      upgrade_id,
      product_version,
      title,
      description: description || '',
      status: 'initialized',
      delivery_gate_status: 'pending',
      started_at: now,
      triggered_by: 'system',
      tags: tags || []
    });

    await base44.asServiceRole.entities.UpgradeAuditLog.create({
      upgrade_id,
      action: 'initialized',
      prior_status: null,
      new_status: 'initialized',
      triggering_function: 'initializeUpgrade',
      actor: 'system',
      timestamp: now,
      context: JSON.stringify({ title, product_version })
    });

    return Response.json({
      success: true,
      registry_id: registry.id,
      upgrade_id,
      status: 'initialized'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});