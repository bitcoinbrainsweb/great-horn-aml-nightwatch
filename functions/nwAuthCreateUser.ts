/**
 * NW-UPGRADE-076A: Create a Nightwatch auth user (admin only).
 * AuthEvent: user_created. Never returns password_hash or mfa_secret.
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
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() || null : null;
    const role = isNwAuthRole(body.role) ? body.role : 'reviewer';
    const status = isNwAuthStatus(body.status) ? body.status : 'pending';

    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const NwAuthUser = (svc.entities as Record<string, { filter: (q: { email: string }) => Promise<{ id: string }[]>; create: (p: Record<string, unknown>) => Promise<Record<string, unknown>> }>).NwAuthUser;
    const NwAuthEvent = (svc.entities as Record<string, { create: (p: Record<string, unknown>) => Promise<unknown> }>).NwAuthEvent;

    if (!NwAuthUser?.filter || !NwAuthUser?.create || !NwAuthEvent?.create) {
      return Response.json(
        { error: 'Nightwatch auth entities (NwAuthUser, NwAuthEvent) not configured' },
        { status: 503 }
      );
    }

    const existing = await NwAuthUser.filter({ email });
    if (existing.length > 0) {
      return Response.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const created = await NwAuthUser.create({
      email,
      password_hash: null,
      full_name,
      role,
      org_id: null,
      status,
      mfa_enabled: false,
      mfa_secret: null,
      oauth_provider: null,
      oauth_provider_id: null,
      created_by: caller.email ?? '',
      created_at: now,
      last_login_at: null,
      password_changed_at: null,
      failed_login_count: 0,
      locked_until: null,
      session_version: 0,
    });

    await NwAuthEvent.create({
      user_id: (created as { id: string }).id,
      event_type: 'user_created',
      performed_by: caller.email ?? '',
      ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
      timestamp: now,
      metadata: { role, status },
    });

    return Response.json({ user: sanitizeUser(created as Record<string, unknown>) });
  } catch (error) {
    console.error('nwAuthCreateUser error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
