import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { control_test_id } = await req.json();

    if (!control_test_id) {
      return Response.json({ error: 'control_test_id required' }, { status: 400 });
    }

    // Get the control test
    const test = await base44.entities.ControlTest.list().then(all =>
      all.find(t => t.id === control_test_id)
    );

    if (!test) {
      return Response.json({ error: 'Control test not found' }, { status: 404 });
    }

    // Check if test is in In Progress state
    const canAttachEvidence = test.status === 'In Progress';

    return Response.json({
      valid: canAttachEvidence,
      control_test_id: control_test_id,
      current_status: test.status,
      message: canAttachEvidence 
        ? 'Evidence can be attached to this test'
        : `Cannot attach evidence to ${test.status} tests. Only In Progress tests accept evidence.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});