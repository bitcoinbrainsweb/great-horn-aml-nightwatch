/**
 * NW-UPGRADE-026: Workflow State Data Migration
 * 
 * Safely migrates existing records into valid lifecycle states.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const migrationLog = [];

    // Migrate TestCycles
    const testCycles = await base44.asServiceRole.entities.TestCycle.list();
    for (const cycle of testCycles) {
      const oldStatus = cycle.status;
      let newStatus = oldStatus;

      // Map old states to new states
      if (oldStatus === 'Planned') newStatus = 'Draft';
      if (oldStatus === 'In Progress') newStatus = 'Active';
      if (oldStatus === 'Cancelled') newStatus = 'Archived';

      if (newStatus !== oldStatus) {
        await base44.asServiceRole.entities.TestCycle.update(cycle.id, { status: newStatus });
        migrationLog.push({
          entity: 'TestCycle',
          id: cycle.id,
          name: cycle.name,
          old_status: oldStatus,
          new_status: newStatus
        });
      }
    }

    // Migrate ControlTests
    const controlTests = await base44.asServiceRole.entities.ControlTest.list();
    for (const test of controlTests) {
      const oldStatus = test.status;
      let newStatus = oldStatus;

      // Map old states to new states
      if (oldStatus === 'Draft') newStatus = 'Planned';
      if (oldStatus === 'Complete') newStatus = 'Completed';
      if (oldStatus === 'Reviewed') {
        // Reviewed tests are completed
        newStatus = 'Completed';
      }

      if (newStatus !== oldStatus) {
        await base44.asServiceRole.entities.ControlTest.update(test.id, { status: newStatus });
        migrationLog.push({
          entity: 'ControlTest',
          id: test.id,
          old_status: oldStatus,
          new_status: newStatus
        });
      }
    }

    // Migrate Findings
    const findings = await base44.asServiceRole.entities.Finding.list();
    for (const finding of findings) {
      const oldStatus = finding.status;
      let newStatus = oldStatus;

      // Map old states to new states
      if (oldStatus === 'In Review') newStatus = 'Under Review';
      if (oldStatus === 'Remediation In Progress') newStatus = 'Under Review';

      if (newStatus !== oldStatus) {
        await base44.asServiceRole.entities.Finding.update(finding.id, { status: newStatus });
        migrationLog.push({
          entity: 'Finding',
          id: finding.id,
          title: finding.title,
          old_status: oldStatus,
          new_status: newStatus
        });
      }
    }

    // Migrate RemediationActions
    const remediations = await base44.asServiceRole.entities.RemediationAction.list();
    for (const action of remediations) {
      const oldStatus = action.status;
      let newStatus = oldStatus;

      // Map old states to new states
      if (oldStatus === 'Open') newStatus = 'Planned';
      if (oldStatus === 'Complete') newStatus = 'Completed';
      if (oldStatus === 'Closed') newStatus = 'Verified';

      if (newStatus !== oldStatus) {
        await base44.asServiceRole.entities.RemediationAction.update(action.id, { status: newStatus });
        migrationLog.push({
          entity: 'RemediationAction',
          id: action.id,
          title: action.title,
          old_status: oldStatus,
          new_status: newStatus
        });
      }
    }

    // Add lifecycle_state to EngagementRisks if missing
    const risks = await base44.asServiceRole.entities.EngagementRisk.list();
    for (const risk of risks) {
      if (!risk.lifecycle_state) {
        await base44.asServiceRole.entities.EngagementRisk.update(risk.id, { 
          lifecycle_state: 'Active' 
        });
        migrationLog.push({
          entity: 'EngagementRisk',
          id: risk.id,
          risk_name: risk.risk_name,
          action: 'Set lifecycle_state to Active'
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Workflow state migration complete',
      migrations_applied: migrationLog.length,
      migration_log: migrationLog
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});