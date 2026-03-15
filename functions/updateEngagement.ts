/**
 * NW-UPGRADE-076D-PHASE3: Update engagement (write route).
 * Protected by Nightwatch auth middleware.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nwAuthMiddleware, requireAuth } from './auth-nw-middleware.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const auth = await nwAuthMiddleware(req);
    const err = requireAuth(auth);
    if (err) return err;

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id : null;
    if (!id) {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }
    const { id: _id, ...payload } = body as Record<string, unknown>;

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const Entity = (svc.entities as Record<string, { update: (id: string, p: Record<string, unknown>) => Promise<unknown> }>).Engagement;
    if (!Entity?.update) {
      return Response.json({ error: 'Engagement entity not available' }, { status: 503 });
    }

    const updated = await Entity.update(id, payload);
    return Response.json({ engagement: updated });
  } catch (error) {
    console.error('updateEngagement error:', error);
    return Response.json(
      { error: (error as Error)?.message ?? String(error) },
      { status: 500 }
    );
  }
});
