import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { actionType, entityType, entityId, requestedBy, approvedBy } = body;

    const flags = [];

    // Check: same user requests and approves override
    if (actionType === 'override_approval' && requestedBy === approvedBy) {
      flags.push({
        type: 'same_user_override',
        severity: 'high',
        message: 'User requesting and approving their own override',
        actor: requestedBy,
      });
    }

    // Check: same user submits and approves evidence
    if (actionType === 'evidence_approval') {
      const evidence = await base44.entities.ControlEvidence.list();
      const userEvidence = evidence.filter(e => e.submittedBy === requestedBy && e.controlId === entityId);
      if (userEvidence.some(e => e.approvedBy === approvedBy && approvedBy === requestedBy)) {
        flags.push({
          type: 'same_user_evidence',
          severity: 'high',
          message: 'User submitting and approving their own evidence',
          actor: requestedBy,
        });
      }
    }

    // Check: same user approves own baseline
    if (actionType === 'baseline_approval' && requestedBy === approvedBy) {
      flags.push({
        type: 'same_user_baseline',
        severity: 'high',
        message: 'User approving their own baseline',
        actor: requestedBy,
      });
    }

    // Check: same user performs and approves release-gating override
    if (actionType === 'release_gating_override' && requestedBy === approvedBy) {
      flags.push({
        type: 'same_user_release_gating',
        severity: 'critical',
        message: 'User performing and approving their own release-gating override',
        actor: requestedBy,
      });
    }

    return Response.json({
      actionType,
      entityType,
      entityId,
      hasViolations: flags.length > 0,
      flags,
      summary: flags.length === 0 ? 'No segregation-of-duties violations detected' : `${flags.length} violation(s) detected`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});