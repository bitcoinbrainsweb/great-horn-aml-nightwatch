import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Generic state machine transition function
 * Handles state validation, permission checks, approval requirements, and audit logging
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      entity_type,
      entity_id,
      new_state,
      reason,
      approval_granted_by,
      metadata
    } = body;

    if (!entity_type || !entity_id || !new_state) {
      return Response.json({ error: 'Missing required fields: entity_type, entity_id, new_state' }, { status: 400 });
    }

    // Fetch state machine definition
    const machines = await base44.asServiceRole.entities.StateMachineDefinition.filter({
      entity_type: entity_type
    });

    if (machines.length === 0) {
      return Response.json({ error: `No state machine found for entity_type: ${entity_type}` }, { status: 404 });
    }

    const machine = machines[0];
    const states = JSON.parse(machine.states || '[]');
    const transitions = JSON.parse(machine.transitions || '[]');

    // Get current entity
    const Entity = base44.asServiceRole.entities[entity_type];
    if (!Entity) {
      return Response.json({ error: `Entity type not found: ${entity_type}` }, { status: 404 });
    }

    const entity = await Entity.get(entity_id);
    if (!entity) {
      return Response.json({ error: `Entity not found: ${entity_id}` }, { status: 404 });
    }

    const prior_state = entity.status || entity.state || 'unknown';

    // Validate state exists
    const stateExists = states.some(s => s.state === new_state);
    if (!stateExists) {
      return Response.json({ error: `Invalid state: ${new_state}` }, { status: 400 });
    }

    // Check if transition is allowed
    const transition = transitions.find(t => t.from === prior_state && t.to === new_state);
    if (!transition) {
      return Response.json({
        error: `Transition not allowed: ${prior_state} -> ${new_state}`,
        allowed_transitions: transitions.filter(t => t.from === prior_state).map(t => t.to)
      }, { status: 403 });
    }

    // Permission check
    if (transition.requires_permission) {
      const hasPermission = await checkPermission(base44, user.email, transition.requires_permission);
      if (!hasPermission) {
        return Response.json({
          error: `Permission denied: ${transition.requires_permission}`,
          required_permission: transition.requires_permission
        }, { status: 403 });
      }
    }

    // Approval check
    if (transition.requires_approval && !approval_granted_by) {
      return Response.json({
        error: 'Approval required for this transition',
        requires_approval: true
      }, { status: 403 });
    }

    // Perform state transition
    const stateFieldName = entity.status !== undefined ? 'status' : 'state';
    await Entity.update(entity_id, { [stateFieldName]: new_state });

    // Log transition
    const transitionLog = await base44.asServiceRole.entities.StateTransitionLog.create({
      entity_type,
      entity_id,
      machine_id: machine.id,
      prior_state,
      new_state,
      actor: user.email,
      permission_checked: !!transition.requires_permission,
      permission_key: transition.requires_permission || null,
      approval_required: !!transition.requires_approval,
      approval_granted_by: approval_granted_by || null,
      reason: reason || '',
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify(metadata || {})
    });

    return Response.json({
      success: true,
      entity_type,
      entity_id,
      prior_state,
      new_state,
      transition_log_id: transitionLog.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkPermission(base44, userEmail, permissionKey) {
  try {
    const perms = await base44.asServiceRole.entities.PermissionDefinition.filter({
      permission_key: permissionKey
    });

    if (perms.length === 0) return false;

    const perm = perms[0];
    const requiredRoles = perm.requires_role || [];
    
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (users.length === 0) return false;

    const userRole = users[0].role || 'user';
    return requiredRoles.includes(userRole) || userRole === 'admin';
  } catch {
    return false;
  }
}