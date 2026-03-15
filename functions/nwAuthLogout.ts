/**
 * NW-UPGRADE-076B: Revoke Nightwatch session (logout).
 * Sets revoked_at on session; appends AuthEvent logout.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { hashSessionToken } from './auth-nw-helpers.ts';

function getIp(req: Request): string | null {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
}

/** NW-UPGRADE-076E-PHASE2: Get session token from body, Bearer, or Cookie nw_session. */
function getTokenFromRequest(req: Request, body: Record<string, unknown>): string {
  const fromBody =
    typeof body.session_token === 'string' ? body.session_token.trim() :
    typeof body.token === 'string' ? body.token.trim() : '';
  if (fromBody) return fromBody;
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')?.trim() ?? '';
  if (bearer) return bearer;
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return '';
  const match = cookieHeader.match(/\bnw_session=([^;]*)/);
  return match ? decodeURIComponent(match[1].trim()) : '';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const token = getTokenFromRequest(req, body);

    if (!token) {
      return Response.json({ error: 'session_token required (or send cookie)' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const NwAuthSession = (svc.entities as Record<string, {
      filter: (q: { token_hash: string }) => Promise<Record<string, unknown>[]>;
      update: (id: string, p: Record<string, unknown>) => Promise<unknown>;
    }>).NwAuthSession;
    const NwAuthEvent = (svc.entities as Record<string, {
      create: (p: Record<string, unknown>) => Promise<unknown>;
    }>).NwAuthEvent;

    if (!NwAuthSession?.filter || !NwAuthSession?.update) {
      return Response.json(
        { error: 'Nightwatch auth entities not configured' },
        { status: 503 }
      );
    }

    const tokenHash = await hashSessionToken(token);
    const sessions = await NwAuthSession.filter({ token_hash: tokenHash });

    if (sessions.length === 0) {
      return Response.json({ success: true, message: 'Session already invalid' });
    }

    const session = sessions[0] as Record<string, unknown> & { id: string; user_id: string };
    const now = new Date().toISOString();

    await NwAuthSession.update(session.id, { revoked_at: now });

    if (NwAuthEvent?.create) {
      await NwAuthEvent.create({
        user_id: session.user_id,
        event_type: 'logout',
        performed_by: session.user_id,
        ip_address: getIp(req),
        timestamp: now,
        metadata: {},
      });
    }

    const res = Response.json({ success: true, message: 'Logged out' });
    res.headers.set(
      'Set-Cookie',
      'nw_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'
    );
    return res;
  } catch (error) {
    console.error('nwAuthLogout error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
