import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_id, control_library_id } = await req.json();

    if (!test_id || !control_library_id) {
      return Response.json({ error: 'test_id and control_library_id required' }, { status: 400 });
    }

    // Get the control definition
    const control = await base44.entities.ControlLibrary.list().then(all => 
      all.find(c => c.id === control_library_id)
    );

    if (!control) {
      return Response.json({ error: 'Control not found' }, { status: 404 });
    }

    // Create snapshot object with required fields
    const snapshot = {
      control_id: control.id,
      control_name: control.control_name,
      control_description: control.description,
      control_type: control.control_category,
      control_requirement_flag: control.status === 'Active',
      control_tags: control.scope_tags || []
    };

    // Update the test with snapshot and timestamp
    await base44.entities.ControlTest.update(test_id, {
      control_snapshot: JSON.stringify(snapshot),
      snapshot_captured_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Control snapshot captured',
      snapshot: snapshot
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});