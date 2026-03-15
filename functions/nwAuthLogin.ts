/**
 * NW-UPGRADE-076B: Nightwatch password login.
 * Uses NwAuthUser, NwAuthSession, NwAuthEvent. Lockout after 5 failures for 15 min.
 * Does NOT replace Base44 auth; parallel auth only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import bcrypt from 'npm:bcrypt@5.1.1';
import {
  generateSessionToken,
  hashSessionToken,
  sessionExpiresAt,
  lockedUntil,
  LOCKOUT_THRESHOLD,
} from './auth-nw-helpers.ts';

const SENSITIVE_KEYS = ['password_hash', 'mfa_secret'];

function sanitizeUser(u: Record<string, unknown>): Record<string, unknown> {
  const out = { ...u };
  for (const key of SENSITIVE_KEYS) delete out[key];
  return out;
}

function getIp(req: Request): string | null {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
}

function getUserAgent(req: Request): string | null {
  return req.headers.get('user-agent') ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return Response.json({ error: 'email and password are required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const NwAuthUser = (svc.entities as Record<string, {
      filter: (q: { email: string }) => Promise<Record<string, unknown>[]>;
      update: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }>).NwAuthUser;
    const NwAuthSession = (svc.entities as Record<string, {
      create: (p: Record<string, unknown>) => Promise<Record<string, unknown>>;
    }>).NwAuthSession;
    const NwAuthEvent = (svc.entities as Record<string, {
      create: (p: Record<string, unknown>) => Promise<unknown>;
    }>).NwAuthEvent;

    if (!NwAuthUser?.filter || !NwAuthUser?.update || !NwAuthSession?.create || !NwAuthEvent?.create) {
      return Response.json(
        { error: 'Nightwatch auth entities not configured' },
        { status: 503 }
      );
    }

    const users = await NwAuthUser.filter({ email });
    const now = new Date().toISOString();
    const ip = getIp(req);
    const userAgent = getUserAgent(req);

    if (users.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0] as Record<string, unknown> & { id: string; status: string; locked_until?: string | null; password_hash?: string | null; failed_login_count?: number };
    const userId = user.id;

    if (user.status === 'disabled') {
      return Response.json({ error: 'Account is disabled' }, { status: 403 });
    }

    const lockedUntilVal = user.locked_until;
    if (lockedUntilVal && new Date(lockedUntilVal) > new Date()) {
      await NwAuthEvent.create({
        user_id: userId,
        event_type: 'account_locked',
        performed_by: email,
        ip_address: ip,
        timestamp: now,
        metadata: { attempt: 'login_rejected_locked' },
      });
      return Response.json({ error: 'Account is temporarily locked' }, { status: 403 });
    }

    if (!user.password_hash) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      const count = ((user.failed_login_count as number) ?? 0) + 1;
      const payload: Record<string, unknown> = { failed_login_count: count };
      if (count >= LOCKOUT_THRESHOLD) {
        payload.locked_until = lockedUntil();
      }
      await NwAuthUser.update(userId, payload);

      await NwAuthEvent.create({
        user_id: userId,
        event_type: 'login_failure',
        performed_by: email,
        ip_address: ip,
        timestamp: now,
        metadata: { failed_login_count: count },
      });
      if (count >= LOCKOUT_THRESHOLD) {
        await NwAuthEvent.create({
          user_id: userId,
          event_type: 'account_locked',
          performed_by: email,
          ip_address: ip,
          timestamp: now,
          metadata: { reason: 'threshold', failed_login_count: count },
        });
      }
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await NwAuthUser.update(userId, {
      failed_login_count: 0,
      locked_until: null,
      last_login_at: now,
    });

    const sessionToken = generateSessionToken();
    const tokenHash = await hashSessionToken(sessionToken);
    const expiresAt = sessionExpiresAt();
    const sessionVersion = (user.session_version as number) ?? 0;

    await NwAuthSession.create({
      user_id: userId,
      token_hash: tokenHash,
      created_at: now,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: userAgent,
      revoked_at: null,
      session_version_snapshot: sessionVersion,
    });

    await NwAuthEvent.create({
      user_id: userId,
      event_type: 'login_success',
      performed_by: email,
      ip_address: ip,
      timestamp: now,
      metadata: {},
    });
    await NwAuthEvent.create({
      user_id: userId,
      event_type: 'session_created',
      performed_by: email,
      ip_address: ip,
      timestamp: now,
      metadata: {},
    });

    const sanitized = sanitizeUser(user);
    return Response.json({
      session_token: sessionToken,
      expires_at: expiresAt,
      user: sanitized,
    });
  } catch (error) {
    console.error('nwAuthLogin error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
