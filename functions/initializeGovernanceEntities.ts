import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    // Seed PermissionDefinitions
    const permissions = [
      { permissionId: 'p_view_assessment', permissionKey: 'view_assessment', category: 'assessment' },
      { permissionId: 'p_edit_assessment', permissionKey: 'edit_assessment', category: 'assessment' },
      { permissionId: 'p_generate_report', permissionKey: 'generate_report', category: 'reporting' },
      { permissionId: 'p_view_evidence', permissionKey: 'view_evidence', category: 'evidence' },
      { permissionId: 'p_submit_evidence', permissionKey: 'submit_evidence', category: 'evidence' },
      { permissionId: 'p_review_evidence', permissionKey: 'review_evidence', category: 'evidence' },
      { permissionId: 'p_create_test', permissionKey: 'create_test', category: 'testing' },
      { permissionId: 'p_review_test', permissionKey: 'review_test', category: 'testing' },
      { permissionId: 'p_view_audit_logs', permissionKey: 'view_audit_logs', category: 'audit' },
      { permissionId: 'p_view_decision_trace', permissionKey: 'view_decision_trace', category: 'audit' },
      { permissionId: 'p_view_user_activity', permissionKey: 'view_user_activity', category: 'audit' },
      { permissionId: 'p_edit_system_config', permissionKey: 'edit_system_config', category: 'config' },
      { permissionId: 'p_approve_baseline', permissionKey: 'approve_baseline', category: 'testing' },
      { permissionId: 'p_run_regression_tests', permissionKey: 'run_regression_tests', category: 'testing' },
      { permissionId: 'p_create_override', permissionKey: 'create_override', category: 'override' },
      { permissionId: 'p_approve_override', permissionKey: 'approve_override', category: 'override' },
      { permissionId: 'p_view_release_history', permissionKey: 'view_release_history', category: 'release_governance' },
      { permissionId: 'p_manage_roles', permissionKey: 'manage_roles', category: 'user_access' },
      { permissionId: 'p_break_glass_action', permissionKey: 'break_glass_action', category: 'override' },
    ];

    for (const perm of permissions) {
      try {
        const exists = await base44.entities.PermissionDefinition.filter({ permissionId: perm.permissionId });
        if (exists.length === 0) {
          await base44.entities.PermissionDefinition.create(perm);
          results.created++;
        } else {
          results.skipped++;
        }
      } catch (err) {
        results.errors.push({ type: 'permission', id: perm.permissionId, error: err.message });
      }
    }

    // Seed RoleDefinitions
    const roles = [
      {
        roleId: 'admin',
        roleName: 'Administrator',
        description: 'Full system access and governance',
        permissions: [
          'view_assessment', 'edit_assessment', 'generate_report',
          'view_evidence', 'submit_evidence', 'review_evidence',
          'create_test', 'review_test', 'view_audit_logs', 'view_decision_trace', 'view_user_activity',
          'edit_system_config', 'approve_baseline', 'run_regression_tests',
          'create_override', 'approve_override', 'view_release_history', 'manage_roles', 'break_glass_action'
        ],
      },
      {
        roleId: 'analyst',
        roleName: 'Analyst',
        description: 'Assessment and evidence analysis',
        permissions: [
          'view_assessment', 'edit_assessment', 'generate_report',
          'view_evidence', 'submit_evidence',
          'create_test', 'view_audit_logs',
        ],
      },
      {
        roleId: 'reviewer',
        roleName: 'Reviewer',
        description: 'Review and approve evidence and assessments',
        permissions: [
          'view_assessment', 'generate_report',
          'view_evidence', 'review_evidence',
          'review_test', 'view_audit_logs', 'view_decision_trace',
          'approve_baseline', 'view_release_history',
        ],
      },
      {
        roleId: 'auditor',
        roleName: 'Auditor',
        description: 'Audit and compliance review access',
        permissions: [
          'view_assessment', 'view_evidence',
          'view_audit_logs', 'view_decision_trace', 'view_user_activity',
          'view_release_history',
        ],
      },
      {
        roleId: 'client_user',
        roleName: 'Client User',
        description: 'Limited client-facing view access',
        permissions: [
          'view_assessment', 'view_evidence', 'generate_report',
        ],
      },
    ];

    for (const role of roles) {
      try {
        const exists = await base44.entities.RoleDefinition.filter({ roleId: role.roleId });
        if (exists.length === 0) {
          await base44.entities.RoleDefinition.create(role);
          results.created++;
        } else {
          results.skipped++;
        }
      } catch (err) {
        results.errors.push({ type: 'role', id: role.roleId, error: err.message });
      }
    }

    return Response.json({
      success: true,
      message: 'Governance entities initialized',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});