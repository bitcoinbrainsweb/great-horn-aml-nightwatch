/**
 * NW-UPGRADE-076B: Validate Nightwatch session token; return authenticated user.
 * Uses shared getSessionUser from auth-nw-middleware.
 */
import { getSessionUser } from './auth-nw-middleware.ts';

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

    const result = await getSessionUser(token, req);

    if (result.ok) {
      return Response.json({
        authenticated: true,
        user: result.user,
      });
    }

    return Response.json({ error: result.error ?? 'Invalid or expired session' }, { status: 401 });
  } catch (error) {
    console.error('nwAuthValidateSession error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
