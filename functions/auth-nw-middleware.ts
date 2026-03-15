/**
 * NW-UPGRADE-076C: Nightwatch auth middleware.
 * Validates Bearer token, attaches authenticated_user to request context.
 * Does not replace Base44 auth; for Nightwatch routes only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { hashSessionToken } from './auth-nw-helpers.ts';

const SENSITIVE_KEYS = ['password_hash', 'mfa_secret'];

function sanitizeUser(u: Record<string, unknown>): Record<string, unknown> {
  const out = { ...u };
  for (const key of SENSITIVE_KEYS) delete out[key];
  return out;
}

export type SessionValidationResult =
  | { ok: true; user: Record<string, unknown> }
  | { ok: false; error: string; reason?: 'not_found' | 'revoked' | 'expired' | 'version_mismatch' | 'user_not_found'; userId?: string };

/**
 * Validate session token and return the authenticated user (or error).
 * Shared by nwAuthValidateSession endpoint and nwAuthMiddleware.
 */
export async function getSessionUser(token: string, req: Request): Promise<SessionValidationResult> {
  if (!token.trim()) {
    return { ok: false, error: 'Missing token', reason: 'not_found' };
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
    return { ok: false, error: 'Nightwatch auth entities not configured' };
  }

  const tokenHash = await hashSessionToken(token);
  const sessions = await NwAuthSession.filter({ token_hash: tokenHash });

  if (sessions.length === 0) {
    return { ok: false, error: 'Invalid or expired session', reason: 'not_found' };
  }

  const session = sessions[0] as Record<string, unknown> & {
    user_id: string;
    revoked_at?: string | null;
    expires_at: string;
    session_version_snapshot?: number;
  };

  if (session.revoked_at) {
    return { ok: false, error: 'Session has been revoked', reason: 'revoked', userId: session.user_id };
  }

  if (new Date(session.expires_at) <= new Date()) {
    return { ok: false, error: 'Session expired', reason: 'expired', userId: session.user_id };
  }

  const users = await NwAuthUser.filter({ id: session.user_id });
  if (users.length === 0) {
    return { ok: false, error: 'User not found', reason: 'user_not_found', userId: session.user_id };
  }

  const user = users[0] as Record<string, unknown> & { session_version?: number };
  const snapshot = session.session_version_snapshot ?? 0;
  const currentVersion = user.session_version ?? 0;
  if (snapshot !== currentVersion) {
    return { ok: false, error: 'Session invalidated (version mismatch)', reason: 'version_mismatch', userId: session.user_id };
  }

  return { ok: true, user: sanitizeUser(user) };
}

/**
 * Middleware: read Authorization Bearer token, validate session, attach user or return 401.
 * On invalid session (revoked/expired), optionally writes AuthEvent session_invalid.
 */
export async function nwAuthMiddleware(
  req: Request,
  options?: { writeSessionInvalidEvent?: boolean }
): Promise<
  | { authenticated_user: Record<string, unknown> }
  | { error: Response }
> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '')?.trim() ?? '';

  const result = await getSessionUser(token, req);

  if (result.ok) {
    return { authenticated_user: result.user };
  }

  if (options?.writeSessionInvalidEvent && (result.reason === 'revoked' || result.reason === 'expired') && result.userId) {
    try {
      const base44 = createClientFromRequest(req);
      const NwAuthEvent = (base44.asServiceRole.entities as Record<string, {
        create: (p: Record<string, unknown>) => Promise<unknown>;
      }>).NwAuthEvent;
      if (NwAuthEvent?.create) {
        await NwAuthEvent.create({
          user_id: result.userId,
          event_type: 'session_invalid',
          performed_by: result.userId,
          ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
          timestamp: new Date().toISOString(),
          metadata: { reason: result.reason },
        });
      }
    } catch (e) {
      console.error('auth-nw-middleware: failed to write session_invalid event', e);
    }
  }

  return {
    error: Response.json({ error: result.error ?? 'Unauthorized' }, { status: 401 }),
  };
}

/**
 * Ensures middleware was executed and a user is present.
 * Returns 401 Response if not authenticated; otherwise returns null (caller may proceed).
 */
export function requireAuth(
  auth: { authenticated_user?: Record<string, unknown>; error?: Response }
): Response | null {
  if (auth.error) return auth.error;
  if (!auth.authenticated_user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
