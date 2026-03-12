import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { upgrade_id } = body;

    if (!upgrade_id) {
      return Response.json({ error: 'Missing upgrade_id' }, { status: 400 });
    }

    // Delegate all completion responsibilities to Release Controller
    console.log(`[completeUpgrade] Delegating upgrade ${upgrade_id} completion to ReleaseController`);

    const controllerResponse = await base44.functions.invoke('releaseController', { upgrade_id } as any);

    // Surface ReleaseController response directly
    return Response.json(controllerResponse?.data ?? controllerResponse);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});