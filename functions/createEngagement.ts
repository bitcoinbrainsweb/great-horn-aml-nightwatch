/**
 * NW-UPGRADE-076D-PHASE3: Create engagement (write route).
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
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const Entity = (svc.entities as Record<string, { create: (p: Record<string, unknown>) => Promise<unknown> }>).Engagement;
    if (!Entity?.create) {
      return Response.json({ error: 'Engagement entity not available' }, { status: 503 });
    }

    const created = await Entity.create(body as Record<string, unknown>);
    return Response.json({ engagement: created });
  } catch (error) {
    console.error('createEngagement error:', error);
    return Response.json(
      { error: (error as Error)?.message ?? String(error) },
      { status: 500 }
    );
  }
});
