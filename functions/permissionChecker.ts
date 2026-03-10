import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userEmail, permissionKey } = body;

    // Get user's role assignments
    const assignments = await base44.entities.UserRoleAssignment.filter({ userEmail, active: true });

    if (assignments.length === 0) {
      return Response.json({ hasPermission: false, reason: 'No active role assignments' });
    }

    // Collect all permissions from assigned roles
    let allPermissions = [];
    for (const assignment of assignments) {
      const roleDefinitions = await base44.entities.RoleDefinition.filter({ roleId: assignment.roleId, active: true });
      if (roleDefinitions.length > 0) {
        const role = roleDefinitions[0];
        allPermissions = allPermissions.concat(role.permissions || []);
      }
    }

    const hasPermission = allPermissions.includes(permissionKey);

    return Response.json({
      userEmail,
      permissionKey,
      hasPermission,
      assignedRoles: assignments.map(a => a.roleId),
      allPermissions: Array.from(new Set(allPermissions)),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});