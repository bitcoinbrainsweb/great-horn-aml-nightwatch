/**
 * NW-UPGRADE-076A: List Nightwatch auth users (admin only).
 * Never returns password_hash or mfa_secret.
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

    const svc = base44.asServiceRole;
    const list = await (svc.entities as Record<string, { list: (opts?: unknown) => Promise<Record<string, unknown>[]> }>).NwAuthUser?.list?.() ?? [];
    const sanitized = list.map((u) => sanitizeUser(u));

    return Response.json({ users: sanitized });
  } catch (error) {
    console.error('nwAuthListUsers error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
