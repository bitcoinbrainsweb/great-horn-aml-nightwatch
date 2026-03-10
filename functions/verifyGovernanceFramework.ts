import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: '',
      passed: 0,
      failed: 0,
    };

    // Check 1: RoleDefinition entities exist
    try {
      const roles = await base44.entities.RoleDefinition.list();
      const roleCheck = roles.length >= 5;
      results.checks.push({
        name: 'RoleDefinition entities',
        status: roleCheck ? 'pass' : 'fail',
        details: `Found ${roles.length} roles (expected >= 5)`,
      });
      roleCheck ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'RoleDefinition entities', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 2: PermissionDefinition entities exist
    try {
      const perms = await base44.entities.PermissionDefinition.list();
      const permCheck = perms.length >= 19;
      results.checks.push({
        name: 'PermissionDefinition entities',
        status: permCheck ? 'pass' : 'fail',
        details: `Found ${perms.length} permissions (expected >= 19)`,
      });
      permCheck ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'PermissionDefinition entities', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 3: UserRoleAssignment can be created
    try {
      const assignments = await base44.entities.UserRoleAssignment.list();
      results.checks.push({
        name: 'UserRoleAssignment entity',
        status: 'pass',
        details: `Found ${assignments.length} existing assignments`,
      });
      results.passed++;
    } catch (e) {
      results.checks.push({ name: 'UserRoleAssignment entity', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 4: OverrideLog can be created
    try {
      const overrides = await base44.entities.OverrideLog.list();
      results.checks.push({
        name: 'OverrideLog entity',
        status: 'pass',
        details: `Found ${overrides.length} existing overrides`,
      });
      results.passed++;
    } catch (e) {
      results.checks.push({ name: 'OverrideLog entity', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 5: ApprovalRequest can be created
    try {
      const approvals = await base44.entities.ApprovalRequest.list();
      results.checks.push({
        name: 'ApprovalRequest entity',
        status: 'pass',
        details: `Found ${approvals.length} existing approval requests`,
      });
      results.passed++;
    } catch (e) {
      results.checks.push({ name: 'ApprovalRequest entity', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 6: Permission checker function works
    try {
      const response = await base44.functions.invoke('permissionChecker', {
        userEmail: user.email,
        permissionKey: 'view_assessment',
      });
      const check = response.data && 'hasPermission' in response.data;
      results.checks.push({
        name: 'permissionChecker function',
        status: check ? 'pass' : 'fail',
        details: check ? 'Function returns correct format' : 'Invalid response format',
      });
      check ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'permissionChecker function', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 7: Segregation of duties checker works
    try {
      const response = await base44.functions.invoke('segregationOfDutiesChecker', {
        actionType: 'override_approval',
        entityType: 'test',
        entityId: 'test-1',
        requestedBy: 'user@example.com',
        approvedBy: 'user@example.com',
      });
      const check = response.data && 'hasViolations' in response.data;
      results.checks.push({
        name: 'segregationOfDutiesChecker function',
        status: check ? 'pass' : 'fail',
        details: check ? 'Function returns correct format' : 'Invalid response format',
      });
      check ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'segregationOfDutiesChecker function', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 8: Break-glass action function works
    try {
      const response = await base44.functions.invoke('breakGlassAction', {
        actionDescription: 'Test action',
        justification: 'Testing break-glass capability',
        targetEntityType: 'test',
        targetEntityId: 'test-1',
      });
      const check = response.data && response.data.success;
      results.checks.push({
        name: 'breakGlassAction function',
        status: check ? 'pass' : 'fail',
        details: check ? 'Function executed successfully' : 'Function execution failed',
      });
      check ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'breakGlassAction function', status: 'fail', details: e.message });
      results.failed++;
    }

    results.summary = `${results.passed} passed, ${results.failed} failed`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});