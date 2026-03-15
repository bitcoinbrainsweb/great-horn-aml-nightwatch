/**
 * NW-UPGRADE-076A: List auth events for a Nightwatch user (admin only).
 * Append-only AuthEvent; no update/delete.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
    if (!userId) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const NwAuthEvent = (svc.entities as Record<string, { filter: (q: { user_id: string }) => Promise<Record<string, unknown>[]> }>).NwAuthEvent;

    if (!NwAuthEvent?.filter) {
      return Response.json(
        { error: 'Nightwatch auth entity NwAuthEvent not configured' },
        { status: 503 }
      );
    }

    const events = await NwAuthEvent.filter({ user_id: userId });
    const sorted = [...events].sort(
      (a, b) => new Date((b.timestamp as string) ?? 0).getTime() - new Date((a.timestamp as string) ?? 0).getTime()
    );

    return Response.json({ events: sorted });
  } catch (error) {
    console.error('nwAuthListAuthEvents error:', error);
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
});
