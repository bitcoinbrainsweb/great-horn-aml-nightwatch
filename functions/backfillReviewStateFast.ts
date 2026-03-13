import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Technical Admin access required' }, { status: 403 });
    }

    // Fetch all RiskLibrary records
    const riskLibrary = await base44.asServiceRole.entities.RiskLibrary.list('-created_date', 1000);
    
    let risksUpdated = 0;
    const riskUpdates = [];

    for (const risk of riskLibrary) {
      // Skip if already has review_state set (and not 'none')
      if (risk.review_state && risk.review_state !== 'none') continue;

      // Core risks (is_core=true): review_state = 'none'
      // Non-core risks (is_core=false): review_state = 'legacy_unreviewed'
      const reviewState = risk.is_core ? 'none' : 'legacy_unreviewed';
      const lifecycleState = risk.status === 'Archived' ? 'archived' : (risk.status === 'Draft' ? 'draft' : 'active');

      riskUpdates.push({ id: risk.id, reviewState, lifecycleState });
    }

    // Batch update risks
    for (const update of riskUpdates) {
      await base44.asServiceRole.entities.RiskLibrary.update(update.id, {
        review_state: update.reviewState,
        lifecycle_state: update.lifecycleState,
      });
      risksUpdated++;
    }

    // Fetch all ControlLibrary records
    const controlLibrary = await base44.asServiceRole.entities.ControlLibrary.list('-created_date', 1000);
    
    let controlsUpdated = 0;
    const controlUpdates = [];

    for (const control of controlLibrary) {
      // Skip if already has review_state set (and not 'none')
      if (control.review_state && control.review_state !== 'none') continue;

      // Core controls: review_state = 'none'
      // Non-core controls: review_state = 'legacy_unreviewed'
      const reviewState = control.is_core ? 'none' : 'legacy_unreviewed';
      const lifecycleState = control.status === 'Archived' ? 'archived' : (control.status === 'Draft' ? 'draft' : 'active');

      controlUpdates.push({ id: control.id, reviewState, lifecycleState });
    }

    // Batch update controls
    for (const update of controlUpdates) {
      await base44.asServiceRole.entities.ControlLibrary.update(update.id, {
        review_state: update.reviewState,
        lifecycle_state: update.lifecycleState,
      });
      controlsUpdated++;
    }

    return Response.json({
      success: true,
      backfill_summary: {
        risks_total: riskLibrary.length,
        risks_updated: risksUpdated,
        risks_marked_legacy: riskLibrary.filter(r => !r.is_core).length,
        risks_marked_core: riskLibrary.filter(r => r.is_core).length,
        controls_total: controlLibrary.length,
        controls_updated: controlsUpdated,
        controls_marked_legacy: controlLibrary.filter(c => !c.is_core).length,
        controls_marked_core: controlLibrary.filter(c => c.is_core).length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});