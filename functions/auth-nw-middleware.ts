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

/** NW-UPGRADE-076E-PHASE2: Get session token from Bearer or Cookie nw_session. */
function getTokenFromRequest(req: Request): string {
  const authHeader = req.headers.get('authorization');
  const bearer = authHeader?.replace(/^Bearer\s+/i, '')?.trim() ?? '';
  if (bearer) return bearer;
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return '';
  const match = cookieHeader.match(/\bnw_session=([^;]*)/);
  return match ? decodeURIComponent(match[1].trim()) : '';
}

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** NW-076F-PHASE1: Constant-time string comparison. */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** NW-076F-PHASE1: Read nw_csrf_token from Cookie header. */
function getCsrfTokenFromCookie(req: Request): string {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return '';
  const match = cookieHeader.match(/\bnw_csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1].trim()) : '';
}

/**
 * NW-076F-PHASE1: Validate double-submit cookie CSRF.
 * For POST/PUT/PATCH/DELETE: X-CSRF-Token header must equal nw_csrf_token cookie.
 * Returns 403 Response if invalid/missing; otherwise null.
 * Does not invalidate session.
 */
export function validateCsrf(req: Request): Response | null {
  if (!STATE_CHANGING_METHODS.has(req.method)) return null;
  const headerToken = req.headers.get('x-csrf-token')?.trim() ?? '';
  const cookieToken = getCsrfTokenFromCookie(req);
  if (!headerToken || !cookieToken || !constantTimeCompare(headerToken, cookieToken)) {
    return Response.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Middleware: read Authorization Bearer token or Cookie nw_session, validate session, attach user or return 401.
 * NW-076F-PHASE1: For POST/PUT/PATCH/DELETE, validates CSRF (double-submit cookie); returns 403 if invalid.
 * On invalid session (revoked/expired), optionally writes AuthEvent session_invalid.
 */
export async function nwAuthMiddleware(
  req: Request,
  options?: { writeSessionInvalidEvent?: boolean }
): Promise<
  | { authenticated_user: Record<string, unknown> }
  | { error: Response }
> {
  const csrfError = validateCsrf(req);
  if (csrfError) return { error: csrfError };

  const token = getTokenFromRequest(req);

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
