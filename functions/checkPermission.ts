import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Generic permission checking function
 * Called by other backend functions to enforce permissions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { permission_key } = body;

    if (!permission_key) {
      return Response.json({ error: 'Missing permission_key' }, { status: 400 });
    }

    const perms = await base44.asServiceRole.entities.PermissionDefinition.filter({
      permission_key,
      active: true
    });

    if (perms.length === 0) {
      return Response.json({
        has_permission: false,
        message: `Permission not found: ${permission_key}`
      });
    }

    const perm = perms[0];
    const requiredRoles = perm.requires_role || [];

    // Platform admin always has all permissions
    if (user.role === 'admin') {
      return Response.json({
        has_permission: true,
        user_role: user.role,
        required_roles: requiredRoles
      });
    }

    // Check if user's role is in required roles
    const hasPermission = requiredRoles.includes(user.role);

    return Response.json({
      has_permission: hasPermission,
      user_role: user.role,
      required_roles: requiredRoles,
      permission_key
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});