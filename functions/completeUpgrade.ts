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
    const now = new Date().toISOString();

    // 1. Run delivery gate checks
    const gateCheckResp = await base44.asServiceRole.functions.invoke('runDeliveryGateChecks', {
      upgrade_id
    });

    if (!gateCheckResp.data.all_passed) {
      return Response.json(
        { error: 'Delivery gate checks failed', details: gateCheckResp.data.results },
        { status: 400 }
      );
    }

    // 2. Publish verification record
    const verifyResp = await base44.asServiceRole.functions.invoke('publishVerificationRecord', {
      upgrade_id
    });

    // 3. Update registry to completed
    const updated = await base44.asServiceRole.entities.UpgradeRegistry.update(
      registry.id,
      {
        status: 'completed',
        delivery_gate_status: 'passed',
        completed_at: now,
        verification_record_id: verifyResp.data.record_id
      }
    );

    // 4. Log completion
    await base44.asServiceRole.entities.UpgradeAuditLog.create({
      upgrade_id,
      action: 'marked_complete',
      prior_status: registry.status,
      new_status: 'completed',
      triggering_function: 'completeUpgrade',
      actor: 'system',
      timestamp: now,
      context: JSON.stringify({
        verification_record_id: verifyResp.data.record_id,
        delivery_gate_passed: true
      })
    });

    return Response.json({
      success: true,
      upgrade_id,
      status: 'completed',
      verification_record_id: verifyResp.data.record_id,
      message: 'Upgrade completed with automatic artifact generation'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});