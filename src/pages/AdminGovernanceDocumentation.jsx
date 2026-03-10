import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminGovernanceDocumentation() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Governance & Permissions Documentation"
        subtitle="NW-UPGRADE-011: Complete reference for role management, override governance, and approval workflows"
      />

      {/* Part 1: Role Model */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Role Model (RoleDefinition)</h2>
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">Define official Nightwatch roles and permissions.</p>
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800">Seeded Roles:</h3>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li><strong>admin</strong> - Full system access and governance (19 permissions)</li>
              <li><strong>analyst</strong> - Assessment and evidence analysis (8 permissions)</li>
              <li><strong>reviewer</strong> - Review and approve evidence and assessments (8 permissions)</li>
              <li><strong>auditor</strong> - Audit and compliance review access (5 permissions)</li>
              <li><strong>client_user</strong> - Limited client-facing view access (3 permissions)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Part 2: Permission Model */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Permission Model (PermissionDefinition)</h2>
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">Define discrete system permissions across 9 categories.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { cat: 'Assessment', perms: ['view_assessment', 'edit_assessment'] },
              { cat: 'Evidence', perms: ['view_evidence', 'submit_evidence', 'review_evidence'] },
              { cat: 'Testing', perms: ['create_test', 'review_test', 'approve_baseline', 'run_regression_tests'] },
              { cat: 'Config', perms: ['edit_system_config'] },
              { cat: 'Audit', perms: ['view_audit_logs', 'view_decision_trace', 'view_user_activity'] },
              { cat: 'Override', perms: ['create_override', 'approve_override', 'break_glass_action'] },
              { cat: 'User Access', perms: ['manage_roles'] },
              { cat: 'Release Governance', perms: ['view_release_history'] },
              { cat: 'Reporting', perms: ['generate_report'] },
            ].map(({ cat, perms }) => (
              <div key={cat}>
                <Badge className="mb-2">{cat}</Badge>
                <ul className="text-xs text-slate-600 space-y-0.5">
                  {perms.map(p => <li key={p}>• {p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Part 3: User Role Assignment */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">3. User Role Assignment (UserRoleAssignment)</h2>
        <div className="space-y-4 text-sm text-slate-600">
          <p>Assign roles to users and track assignment history.</p>
          <div className="bg-slate-50 p-3 rounded text-xs font-mono space-y-1">
            <p>• userId / userEmail: Who is being assigned</p>
            <p>• roleId: Which role (admin, analyst, reviewer, auditor, client_user)</p>
            <p>• active: Enable/disable assignment without deletion</p>
            <p>• assignedBy / assignedAt: Audit trail of who assigned and when</p>
          </div>
        </div>
      </Card>

      {/* Part 4: Override Governance */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Override Governance (OverrideLog)</h2>
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">Track all manual overrides with full auditability.</p>
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800">Override Types:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>• risk_override</div>
              <div>• control_effectiveness_override</div>
              <div>• residual_risk_override</div>
              <div>• evidence_review_override</div>
              <div>• baseline_override</div>
              <div>• release_gating_override</div>
              <div>• config_override</div>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded text-xs">
            <p className="font-semibold mb-2">Requirements:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>No override without non-empty reason field</li>
              <li>originalValue and newValue preserved (serialized)</li>
              <li>requestedBy and approvedBy tracked separately</li>
              <li>Status progression: requested → approved → applied</li>
              <li>Linked to DecisionTrace and AssessmentFinding records</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Part 5: Approval Workflows */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Approval Workflows (ApprovalRequest)</h2>
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">Track approval-required actions.</p>
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800">Approval Types:</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <div>• evidence_approval - Evidence review and approval</div>
              <div>• override_approval - Override requests</div>
              <div>• baseline_approval - Test baseline approvals</div>
              <div>• release_approval - Release readiness approvals</div>
              <div>• config_change_approval - System config changes</div>
              <div>• break_glass_approval - Emergency high-privilege actions</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Part 6: Segregation of Duties */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Segregation of Duties (SOD)</h2>
        <div className="space-y-4 text-sm text-slate-600">
          <p>Flag when same user performs AND approves sensitive actions.</p>
          <div className="bg-slate-50 p-3 rounded text-xs space-y-1">
            <p><strong>Violations Detected:</strong></p>
            <p>• same_user_override - User requests & approves own override (HIGH severity)</p>
            <p>• same_user_evidence - User submits & approves own evidence (HIGH severity)</p>
            <p>• same_user_baseline - User approves own baseline (HIGH severity)</p>
            <p>• same_user_release_gating - User performs & approves release-gating override (CRITICAL severity)</p>
          </div>
        </div>
      </Card>

      {/* Part 7: Permission-Aware UI */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Permission-Aware UI</h2>
        <div className="space-y-4 text-sm text-slate-600">
          <p>Actions are hidden/disabled based on user permissions.</p>
          <div className="bg-slate-50 p-3 rounded text-xs space-y-1">
            <p><strong>Applied to:</strong></p>
            <p>• Evidence review and approval actions</p>
            <p>• Override creation and approval actions</p>
            <p>• System config editing</p>
            <p>• Regression baseline approval</p>
            <p>• Audit log and decision trace viewing</p>
            <p>• User activity viewing</p>
          </div>
        </div>
      </Card>

      {/* Part 8: Break-Glass Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Break-Glass Actions</h2>
        <div className="space-y-4 text-sm text-slate-600">
          <p>Emergency high-privilege actions with explicit justification.</p>
          <div className="bg-slate-50 p-3 rounded text-xs space-y-1">
            <p><strong>Requirements:</strong></p>
            <p>• Explicit justification required (non-empty field)</p>
            <p>• Actor, timestamp, action, and justification logged</p>
            <p>• OverrideLog record created (status: applied)</p>
            <p>• ApprovalRequest record created (status: approved)</p>
            <p>• Highly visible in audit history</p>
          </div>
        </div>
      </Card>

      {/* Part 9: Functions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Core Functions</h2>
        <div className="space-y-3 text-sm">
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">permissionChecker</p>
            <p className="text-xs text-slate-600">Check if user has permission. Returns: hasPermission, assignedRoles, allPermissions</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">segregationOfDutiesChecker</p>
            <p className="text-xs text-slate-600">Flag SOD violations. Returns: flags array with severity, message, actor</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">breakGlassAction</p>
            <p className="text-xs text-slate-600">Log emergency action. Requires justification. Creates OverrideLog + ApprovalRequest</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">initializeGovernanceEntities</p>
            <p className="text-xs text-slate-600">Seed roles and permissions. Safe to run multiple times</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">verifyGovernanceFramework</p>
            <p className="text-xs text-slate-600">Verify all governance components are operational</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">governanceArchitectureAudit</p>
            <p className="text-xs text-slate-600">Audit architecture integrity and governance strength</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">deliveryGateNW011</p>
            <p className="text-xs text-slate-600">Compile full delivery gate report for upgrade</p>
          </div>
        </div>
      </Card>

      {/* Part 10: Admin UI Components */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">10. Admin UI Components</h2>
        <div className="space-y-3 text-sm">
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">RolePermissionDashboard</p>
            <p className="text-xs text-slate-600">List all roles and permissions with category grouping</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">UserRoleAssignmentView</p>
            <p className="text-xs text-slate-600">Manage user-to-role assignments with removal capability</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">OverrideLogView</p>
            <p className="text-xs text-slate-600">View override audit trail with original/new values and approval chain</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">ApprovalQueueView</p>
            <p className="text-xs text-slate-600">Approve/reject pending approval requests</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-800 mb-1">SegregationOfDutiesPanel</p>
            <p className="text-xs text-slate-600">View SOD violations with severity levels and linked records</p>
          </div>
        </div>
      </Card>

      {/* Part 11: Getting Started */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Getting Started</h2>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Navigate to <strong>Admin → Governance & Permissions</strong></li>
          <li>Click <strong>Initialize Governance Entities</strong> to seed roles and permissions</li>
          <li>Go to <strong>Assignments</strong> tab and assign users to roles</li>
          <li>Monitor <strong>Overrides</strong> and <strong>Approvals</strong> tabs for compliance</li>
          <li>Review <strong>SOD</strong> tab regularly for violations</li>
          <li>Use break-glass actions only in emergencies with full justification</li>
        </ol>
      </Card>

      {/* Footer */}
      <p className="text-xs text-slate-400 text-center pb-6">
        Nightwatch v0.11.0 · NW-UPGRADE-011: Governance & Permissions
      </p>
    </div>
  );
}