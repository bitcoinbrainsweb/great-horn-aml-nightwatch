/**
 * NW-UPGRADE-076B: Validate Nightwatch session token; return authenticated user.
 * Checks token exists, not revoked, not expired, session_version matches user.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { hashSessionToken } from './auth-nw-helpers.ts';

const SENSITIVE_KEYS = ['password_hash', 'mfa_secret'];

function sanitizeUser(u: Record<string, unknown>): Record<string, unknown> {
  const out = { ...u };
  for (const key of SENSITIVE_KEYS) delete out[key];
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const token =
      typeof body.session_token === 'string' ? body.session_token.trim() :
      typeof body.token === 'string' ? body.token.trim() :
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')?.trim() ?? '';

    if (!token) {
      return Response.json({ error: 'session_token required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const NwAuthSession = (svc.entities as Record<string, {
      filter: (q: { token_hash: string }) => Promise<Record<string, unknown>[]>;
    }>).NwAuthSession;
    const NwAuthUser = (svc.entities as Record<string, {
      filter: (q: { id: string }) => Promise<Record<string, unknown>[]>;
    }>).NwAuthUser;

    if (!NwAuthSession?.filter || !NwAuthUser?.filter) {
      return Response.json(
        { error: 'Nightwatch auth entities not configured' },
        { status: 503 }
      );
    }

    const tokenHash = await hashSessionToken(token);
    const sessions = await NwAuthSession.filter({ token_hash: tokenHash });

    if (sessions.length === 0) {
      return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const session = sessions[0] as Record<string, unknown> & {
      user_id: string;
      revoked_at?: string | null;
      expires_at: string;
      session_version_snapshot?: number;
    };

    if (session.revoked_at) {
      return Response.json({ error: 'Session has been revoked' }, { status: 401 });
    }

    if (new Date(session.expires_at) <= new Date()) {
      return Response.json({ error: 'Session expired' }, { status: 401 });
    }

    const users = await NwAuthUser.filter({ id: session.user_id });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }

    const user = users[0] as Record<string, unknown> & { session_version?: number };
    const snapshot = session.session_version_snapshot ?? 0;
    const currentVersion = user.session_version ?? 0;
    if (snapshot !== currentVersion) {
      return Response.json({ error: 'Session invalidated (version mismatch)' }, { status: 401 });
    }

    return Response.json({
      authenticated: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('nwAuthValidateSession error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
