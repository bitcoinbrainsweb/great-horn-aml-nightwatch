/**
 * NW-UPGRADE-076A: Update Nightwatch auth user full_name, role, status (admin only).
 * AuthEvent: role_changed, user_status_changed, user_updated as needed.
 * Never returns password_hash or mfa_secret.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { isNwAuthRole, isNwAuthStatus } from './auth-nw-constants.ts';

const SENSITIVE_KEYS = ['password_hash', 'mfa_secret'];

function sanitizeUser(u: Record<string, unknown>): Record<string, unknown> {
  const out = { ...u };
  for (const key of SENSITIVE_KEYS) {
    delete out[key];
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const NwAuthUser = (svc.entities as Record<string, {
      filter: (q: { id: string }) => Promise<Record<string, unknown>[]>;
      update: (id: string, p: Record<string, unknown>) => Promise<Record<string, unknown>>;
    }>).NwAuthUser;
    const NwAuthEvent = (svc.entities as Record<string, { create: (p: Record<string, unknown>) => Promise<unknown> }>).NwAuthEvent;

    if (!NwAuthUser?.filter || !NwAuthUser?.update || !NwAuthEvent?.create) {
      return Response.json(
        { error: 'Nightwatch auth entities (NwAuthUser, NwAuthEvent) not configured' },
        { status: 503 }
      );
    }

    const existing = await NwAuthUser.filter({ id });
    if (existing.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const current = existing[0];
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
    const performedBy = caller.email ?? '';

    const payload: Record<string, unknown> = {};
    if (typeof body.full_name === 'string') payload.full_name = body.full_name.trim() || null;
    if (isNwAuthRole(body.role)) payload.role = body.role;
    if (isNwAuthStatus(body.status)) payload.status = body.status;

    if (Object.keys(payload).length === 0) {
      return Response.json({ user: sanitizeUser(current) });
    }

    const updated = await NwAuthUser.update(id, payload);

    if (payload.role !== undefined && payload.role !== current.role) {
      await NwAuthEvent.create({
        user_id: id,
        event_type: 'role_changed',
        performed_by: performedBy,
        ip_address: ip,
        timestamp: now,
        metadata: { old_role: current.role, new_role: payload.role },
      });
    }
    if (payload.status !== undefined && payload.status !== current.status) {
      await NwAuthEvent.create({
        user_id: id,
        event_type: payload.status === 'disabled' ? 'user_disabled' : 'user_status_changed',
        performed_by: performedBy,
        ip_address: ip,
        timestamp: now,
        metadata: payload.status === 'disabled' ? {} : { old_status: current.status, new_status: payload.status },
      });
    }
    if (payload.full_name !== undefined && payload.full_name !== current.full_name) {
      await NwAuthEvent.create({
        user_id: id,
        event_type: 'user_updated',
        performed_by: performedBy,
        ip_address: ip,
        timestamp: now,
        metadata: { field: 'full_name', old_value: current.full_name, new_value: payload.full_name },
      });
    }

    return Response.json({ user: sanitizeUser(updated as Record<string, unknown>) });
  } catch (error) {
    console.error('nwAuthUpdateUser error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
