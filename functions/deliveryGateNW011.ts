import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const timestamp = new Date().toISOString();

    // Run verification checks
    const verifyRes = await base44.functions.invoke('verifyGovernanceFramework', {});
    const verifyData = verifyRes.data;

    // Run architecture audit
    const auditRes = await base44.functions.invoke('governanceArchitectureAudit', {});
    const auditData = auditRes.data;

    // Compile delivery gate report
    const report = {
      upgradeId: 'NW-UPGRADE-011',
      upgradeName: 'Role/Permission Model + Override Governance + Report Naming Standardization',
      productVersion: 'v0.11.0',
      timestamp,
      status: verifyData.failed === 0 ? 'ready' : 'caution',

      // Implementation Summary
      implementation: {
        entities: [
          'RoleDefinition',
          'PermissionDefinition',
          'UserRoleAssignment',
          'OverrideLog',
          'ApprovalRequest',
        ],
        functions: [
          'permissionChecker',
          'segregationOfDutiesChecker',
          'breakGlassAction',
          'initializeGovernanceEntities',
          'verifyGovernanceFramework',
          'governanceArchitectureAudit',
          'deliveryGateNW011',
        ],
        components: [
          'RolePermissionDashboard',
          'UserRoleAssignmentView',
          'OverrideLogView',
          'ApprovalQueueView',
          'SegregationOfDutiesPanel',
        ],
        roles: ['admin', 'analyst', 'reviewer', 'auditor', 'client_user'],
        permissions: 19,
      },

      // Verification Report
      verification: verifyData,

      // Architecture Audit
      architecture: auditData,

      // Documentation Update Summary
      documentation: {
        entities: [
          'RoleDefinition: Official Nightwatch roles and permissions',
          'PermissionDefinition: Discrete system permissions',
          'UserRoleAssignment: User-to-role mappings',
          'OverrideLog: Override audit trail',
          'ApprovalRequest: Approval request tracking',
        ],
        functions: [
          'permissionChecker: Permission validation for users',
          'segregationOfDutiesChecker: Segregation of duties flagging',
          'breakGlassAction: Emergency high-privilege actions',
          'initializeGovernanceEntities: Seeding governance data',
        ],
        components: [
          'RolePermissionDashboard: Role and permission overview',
          'UserRoleAssignmentView: User role assignment management',
          'OverrideLogView: Override audit and tracking',
          'ApprovalQueueView: Pending approvals management',
          'SegregationOfDutiesPanel: SOD violation visibility',
        ],
        concepts: [
          'Role-Based Access Control (RBAC)',
          'Segregation of Duties (SOD)',
          'Approval Workflows',
          'Break-Glass Actions',
          'Override Governance & Auditing',
        ],
      },

      // Release Readiness
      releaseReadiness: verifyData.failed === 0 ? 'ready' : 'caution',
      recommendedActions: [
        'Run initializeGovernanceEntities to seed roles and permissions',
        'Assign users to roles using UserRoleAssignmentView',
        'Monitor OverrideLog and ApprovalQueue for governance compliance',
        'Review SegregationOfDutiesPanel regularly for SOD violations',
        'Update report naming in future delivery gates to enforce canonical ProductVersion format',
      ],
    };

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});