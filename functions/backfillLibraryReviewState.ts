import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Backfill RiskLibrary records
    const riskLibrary = await base44.asServiceRole.entities.RiskLibrary.list('-created_date', 500);
    let risksUpdated = 0;

    for (const risk of riskLibrary) {
      // Skip if already has review_state
      if (risk.review_state && risk.review_state !== 'none') continue;

      // Mark non-core risks as legacy_unreviewed (candidate for review)
      // Core risks get review_state = none
      const reviewState = !risk.is_core ? 'legacy_unreviewed' : 'none';
      const lifecycleState = risk.status === 'Archived' ? 'archived' : (risk.status === 'Draft' ? 'draft' : 'active');

      await base44.asServiceRole.entities.RiskLibrary.update(risk.id, {
        review_state: reviewState,
        lifecycle_state: lifecycleState,
      });

      risksUpdated++;
    }

    // Backfill ControlLibrary records
    const controlLibrary = await base44.asServiceRole.entities.ControlLibrary.list('-created_date', 500);
    let controlsUpdated = 0;

    for (const control of controlLibrary) {
      // Skip if already has review_state
      if (control.review_state && control.review_state !== 'none') continue;

      // Mark non-core controls as legacy_unreviewed (candidate for review)
      // Core controls get review_state = none
      const reviewState = !control.is_core ? 'legacy_unreviewed' : 'none';
      const lifecycleState = control.status === 'Archived' ? 'archived' : (control.status === 'Draft' ? 'draft' : 'active');

      await base44.asServiceRole.entities.ControlLibrary.update(control.id, {
        review_state: reviewState,
        lifecycle_state: lifecycleState,
      });

      controlsUpdated++;
    }

    // Log the migration
    const summaryBefore = {
      total_risks: riskLibrary.length,
      total_controls: controlLibrary.length,
      risks_without_review_state: riskLibrary.filter(r => !r.review_state || r.review_state === 'none').length,
      controls_without_review_state: controlLibrary.filter(c => !c.review_state || c.review_state === 'none').length,
    };

    const summaryAfter = {
      risks_updated: risksUpdated,
      controls_updated: controlsUpdated,
      legacy_risks_marked: riskLibrary.filter(r => !r.is_core).length,
      legacy_controls_marked: controlLibrary.filter(c => !c.is_core).length,
    };

    return Response.json({
      success: true,
      timestamp: now,
      migration_summary: {
        before: summaryBefore,
        after: summaryAfter,
        details: `Backfilled ${risksUpdated} risks and ${controlsUpdated} controls with review_state and lifecycle_state fields.`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});