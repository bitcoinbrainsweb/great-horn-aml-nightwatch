/**
 * NW-UPGRADE-076D-PHASE2: List risks / RiskLibrary (read-only operator route).
 * Protected by Nightwatch auth middleware.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nwAuthMiddleware, requireAuth } from './auth-nw-middleware.ts';

Deno.serve(async (req) => {
  try {
    const auth = await nwAuthMiddleware(req);
    const err = requireAuth(auth);
    if (err) return err;

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const list = await (svc.entities as Record<string, { list: (sort?: string, limit?: number) => Promise<unknown[]> }>).RiskLibrary?.list?.('-created_date', 500) ?? [];

    return Response.json({ risks: list });
  } catch (error) {
    console.error('listRisks error:', error);
    return Response.json(
      { error: (error as Error)?.message ?? String(error) },
      { status: 500 }
    );
  }
});
