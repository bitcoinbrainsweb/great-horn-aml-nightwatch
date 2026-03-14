import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NW-UPGRADE-075A: Ensure smoke-test account exists for Browser Use.
 *
 * Idempotent. Ensures smoke@nightwatch.test has an Active UserInvitation
 * (role admin) so they can register and log in with password SmokeTest123!
 * Does not create User or set password; Base44 uses invitation + registration.
 *
 * ADMIN-ONLY. Call from Admin Users "Ensure smoke user" or once at setup.
 */

const SMOKE_EMAIL = 'smoke@nightwatch.test';
const SMOKE_ROLE = 'admin';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
      return Response.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const svc = base44.asServiceRole;

    // 1. User already exists → nothing to do
    const existingUsers = await svc.entities.User.filter({ email: SMOKE_EMAIL });
    if (existingUsers.length > 0) {
      return Response.json({
        success: true,
        user_exists: true,
        email: SMOKE_EMAIL,
        role: existingUsers[0].role,
        message: 'Smoke user already exists. Login with smoke@nightwatch.test and your set password.',
      });
    }

    // 2. Invitation already exists and is Active → nothing to do
    const existingInv = await svc.entities.UserInvitation.filter({ email: SMOKE_EMAIL });
    const activeInv = existingInv.find((i) => i.status === 'Active' || i.status === 'Pending');
    if (activeInv) {
      return Response.json({
        success: true,
        invitation_exists: true,
        email: SMOKE_EMAIL,
        message:
          'Invitation already active. Complete registration once with smoke@nightwatch.test / SmokeTest123! then login normally.',
      });
    }

    // 3. Create or reactivate invitation
    const revoked = existingInv.find((i) => i.status === 'Revoked');
    if (revoked) {
      await svc.entities.UserInvitation.update(revoked.id, {
        status: 'Active',
        invited_by: caller.email,
        notes: 'NW-UPGRADE-075A: Smoke test account re-activated.',
      });
      return Response.json({
        success: true,
        invitation_reactivated: true,
        email: SMOKE_EMAIL,
        message:
          'Invitation re-activated. Complete registration with smoke@nightwatch.test / SmokeTest123! if not already done.',
      });
    }

    const workspace = await svc.entities.Workspace.filter({ is_default: true }).then((w) => w[0]);
    await svc.entities.UserInvitation.create({
      email: SMOKE_EMAIL,
      role: SMOKE_ROLE,
      status: 'Active',
      invited_by: caller.email,
      workspace_id: workspace?.id || '',
      notes: 'NW-UPGRADE-075A: Dedicated smoke-test account for Browser Use. Password: set on first registration (SmokeTest123!).',
    });

    return Response.json({
      success: true,
      invitation_created: true,
      email: SMOKE_EMAIL,
      role: SMOKE_ROLE,
      message:
        'Smoke invitation created. Complete registration once with smoke@nightwatch.test / SmokeTest123! then login normally.',
    });
  } catch (error) {
    console.error('ensureSmokeUser error:', error);
    return Response.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
});
