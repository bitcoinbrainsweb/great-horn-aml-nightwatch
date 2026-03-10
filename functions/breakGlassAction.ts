import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { actionDescription, justification, targetEntityType, targetEntityId } = body;

    if (!justification || justification.trim() === '') {
      return Response.json({ error: 'Break-glass actions require explicit justification' }, { status: 400 });
    }

    // Create OverrideLog record for break-glass action
    const overrideLog = await base44.entities.OverrideLog.create({
      overrideId: `BG-${Date.now()}`,
      overrideType: 'break_glass_action',
      entityType: targetEntityType || 'system',
      entityId: targetEntityId || 'system',
      originalValue: '',
      newValue: actionDescription,
      reason: justification,
      requestedBy: user.email,
      approvedBy: user.email,
      requestTimestamp: new Date().toISOString(),
      approvalTimestamp: new Date().toISOString(),
      status: 'applied',
      notes: `Break-glass action by ${user.full_name || user.email}`,
    });

    // Create ApprovalRequest for audit trail
    const approvalRequest = await base44.entities.ApprovalRequest.create({
      approvalId: `BR-${Date.now()}`,
      approvalType: 'break_glass_approval',
      entityType: targetEntityType || 'system',
      entityId: targetEntityId || 'system',
      requestedBy: user.email,
      requestedAt: new Date().toISOString(),
      approvedBy: user.email,
      approvedAt: new Date().toISOString(),
      status: 'approved',
      reason: actionDescription,
      notes: justification,
    });

    return Response.json({
      success: true,
      message: 'Break-glass action logged and applied',
      overrideLogId: overrideLog.id,
      approvalRequestId: approvalRequest.id,
      actor: user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});