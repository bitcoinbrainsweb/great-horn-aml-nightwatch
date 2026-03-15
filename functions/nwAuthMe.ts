/**
 * NW-UPGRADE-076E-PHASE2: Return current user from Nightwatch session (cookie or Bearer).
 * For frontend getCurrentUser() with credentials: 'include'.
 */
import { getSessionUser } from './auth-nw-middleware.ts';

function getTokenFromRequest(req: Request): string {
  const authHeader = req.headers.get('authorization');
  const bearer = authHeader?.replace(/^Bearer\s+/i, '')?.trim() ?? '';
  if (bearer) return bearer;
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return '';
  const match = cookieHeader.match(/\bnw_session=([^;]*)/);
  return match ? decodeURIComponent(match[1].trim()) : '';
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const token = getTokenFromRequest(req);
    const result = await getSessionUser(token, req);

    if (result.ok) {
      return Response.json({ user: result.user });
    }

    return Response.json({ error: result.error ?? 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('nwAuthMe error:', error);
    return Response.json(
      { error: (error as Error)?.message ?? String(error) },
      { status: 500 }
    );
  }
});
