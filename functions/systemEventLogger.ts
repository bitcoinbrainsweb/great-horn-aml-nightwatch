import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { eventType, entityType, entityId, description, severity = 'info', linkedJob, linkedAssessment, linkedFeedback } = payload;

    if (!eventType) {
      return Response.json({ error: 'eventType required' }, { status: 400 });
    }

    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await base44.asServiceRole.entities.SystemEvent.create({
      eventId,
      timestamp: new Date().toISOString(),
      eventType,
      entityType,
      entityId,
      actor: user.email,
      sourceFunction: 'systemEventLogger',
      description: description || eventType,
      severity,
      linkedJob,
      linkedAssessment,
      linkedFeedback
    });

    return Response.json({
      success: true,
      eventId
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});