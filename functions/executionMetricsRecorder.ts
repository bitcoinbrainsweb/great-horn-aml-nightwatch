import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { assessmentId, generationType, promptTokens = 0, completionTokens = 0, executionTime = 0, narrativeCacheHit = false } = payload;

    if (!assessmentId || !generationType) {
      return Response.json({ error: 'assessmentId and generationType required' }, { status: 400 });
    }

    const metricId = `METRIC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await base44.asServiceRole.entities.ExecutionMetric.create({
      metricId,
      assessmentId,
      generationType,
      promptTokens,
      completionTokens,
      executionTime,
      narrativeCacheHit,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      metricId,
      message: `Metrics recorded for ${generationType}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});