/**
 * NW-UPGRADE-076A: Disable a Nightwatch auth user (admin only).
 * Sets status to disabled and appends AuthEvent user_disabled.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    if (existing[0].status === 'disabled') {
      return Response.json({ user: sanitizeUser(existing[0]) });
    }

    const now = new Date().toISOString();
    const updated = await NwAuthUser.update(id, { status: 'disabled' });

    await NwAuthEvent.create({
      user_id: id,
      event_type: 'user_disabled',
      performed_by: caller.email ?? '',
      ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
      timestamp: now,
      metadata: {},
    });

    return Response.json({ user: sanitizeUser(updated as Record<string, unknown>) });
  } catch (error) {
    console.error('nwAuthDisableUser error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
