import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_name, ids, action, value } = await req.json();

    if (!entity_name || !ids || !action || !value) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const results = {
      total: ids.length,
      success: 0,
      failed: 0,
      errors: []
    };

    const updateData = {};
    updateData[action] = value;

    for (const id of ids) {
      try {
        await base44.asServiceRole.entities[entity_name].update(id, updateData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `Bulk update completed: ${results.success} succeeded, ${results.failed} failed`,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});