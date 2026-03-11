import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Initialize Nightwatch infrastructure: state machines, permissions, governance rules, migrations
 * Run once during upgrade; subsequent runs are idempotent
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      state_machines: [],
      permissions: [],
      governance_rules: [],
      migrations: []
    };

    // Initialize state machines
    const stateMachines = [
      {
        machine_id: 'engagement_sm',
        machine_name: 'Engagement State Machine',
        entity_type: 'Engagement',
        initial_state: 'draft',
        states: JSON.stringify([
          { state: 'draft', label: 'Draft', is_terminal: false, description: 'Initial state' },
          { state: 'intake_complete', label: 'Intake Complete', is_terminal: false, description: 'Intake questionnaire completed' },
          { state: 'assessment_in_progress', label: 'Assessment In Progress', is_terminal: false, description: 'Assessment actively being conducted' },
          { state: 'assessment_complete', label: 'Assessment Complete', is_terminal: false, description: 'Assessment finished, review pending' },
          { state: 'approved', label: 'Approved', is_terminal: false, description: 'Assessment approved by management' },
          { state: 'finalized', label: 'Finalized', is_terminal: true, description: 'Engagement finalized' },
          { state: 'archived', label: 'Archived', is_terminal: true, description: 'Engagement archived' }
        ]),
        transitions: JSON.stringify([
          { from: 'draft', to: 'intake_complete', requires_permission: null, requires_approval: false, description: 'Submit intake' },
          { from: 'intake_complete', to: 'assessment_in_progress', requires_permission: 'start_assessment', requires_approval: false, description: 'Begin assessment' },
          { from: 'assessment_in_progress', to: 'assessment_complete', requires_permission: 'complete_assessment', requires_approval: false, description: 'Mark assessment complete' },
          { from: 'assessment_complete', to: 'approved', requires_permission: 'approve_engagement', requires_approval: true, description: 'Approve engagement' },
          { from: 'approved', to: 'finalized', requires_permission: 'finalize_engagement', requires_approval: false, description: 'Finalize engagement' },
          { from: 'draft', to: 'archived', requires_permission: 'archive_engagement', requires_approval: false, description: 'Archive draft' },
          { from: 'assessment_in_progress', to: 'archived', requires_permission: 'archive_engagement', requires_approval: false, description: 'Archive in-progress' }
        ])
      },
      {
        machine_id: 'proposal_sm',
        machine_name: 'Proposal State Machine',
        entity_type: 'RiskChangeProposal',
        initial_state: 'submitted',
        states: JSON.stringify([
          { state: 'submitted', label: 'Submitted', is_terminal: false, description: 'Proposal submitted for review' },
          { state: 'under_review', label: 'Under Review', is_terminal: false, description: 'Being reviewed' },
          { state: 'approved', label: 'Approved', is_terminal: false, description: 'Approved by reviewer' },
          { state: 'merged', label: 'Merged', is_terminal: true, description: 'Merged to library' },
          { state: 'rejected', label: 'Rejected', is_terminal: true, description: 'Rejected' }
        ]),
        transitions: JSON.stringify([
          { from: 'submitted', to: 'under_review', requires_permission: 'review_proposal', requires_approval: false, description: 'Start review' },
          { from: 'under_review', to: 'approved', requires_permission: 'approve_proposal', requires_approval: true, description: 'Approve proposal' },
          { from: 'under_review', to: 'rejected', requires_permission: 'reject_proposal', requires_approval: false, description: 'Reject proposal' },
          { from: 'approved', to: 'merged', requires_permission: 'merge_proposal', requires_approval: false, description: 'Merge to library' }
        ])
      },
      {
        machine_id: 'upgrade_sm',
        machine_name: 'Upgrade State Machine',
        entity_type: 'UpgradeRegistry',
        initial_state: 'initialized',
        states: JSON.stringify([
          { state: 'initialized', label: 'Initialized', is_terminal: false, description: 'Upgrade created' },
          { state: 'in_progress', label: 'In Progress', is_terminal: false, description: 'Work in progress' },
          { state: 'delivery_gate_running', label: 'Delivery Gate Running', is_terminal: false, description: 'Delivery gate executing' },
          { state: 'delivery_gate_passed', label: 'Delivery Gate Passed', is_terminal: false, description: 'Delivery gate checks passed' },
          { state: 'delivery_gate_failed', label: 'Delivery Gate Failed', is_terminal: false, description: 'Delivery gate checks failed' },
          { state: 'completed', label: 'Completed', is_terminal: true, description: 'Upgrade complete' },
          { state: 'archived', label: 'Archived', is_terminal: true, description: 'Upgrade archived' }
        ]),
        transitions: JSON.stringify([
          { from: 'initialized', to: 'in_progress', requires_permission: null, requires_approval: false, description: 'Begin work' },
          { from: 'in_progress', to: 'delivery_gate_running', requires_permission: 'run_delivery_gate', requires_approval: false, description: 'Start delivery gate' },
          { from: 'delivery_gate_running', to: 'delivery_gate_passed', requires_permission: null, requires_approval: false, description: 'Delivery gate passed' },
          { from: 'delivery_gate_running', to: 'delivery_gate_failed', requires_permission: null, requires_approval: false, description: 'Delivery gate failed' },
          { from: 'delivery_gate_passed', to: 'completed', requires_permission: 'complete_upgrade', requires_approval: true, description: 'Complete upgrade' },
          { from: 'initialized', to: 'archived', requires_permission: 'archive_upgrade', requires_approval: false, description: 'Archive' }
        ])
      }
    ];

    for (const sm of stateMachines) {
      const existing = await base44.asServiceRole.entities.StateMachineDefinition.filter({
        machine_id: sm.machine_id
      });
      
      if (existing.length === 0) {
        await base44.asServiceRole.entities.StateMachineDefinition.create(sm);
        results.state_machines.push({ machine_id: sm.machine_id, status: 'created' });
      } else {
        results.state_machines.push({ machine_id: sm.machine_id, status: 'already_exists' });
      }
    }

    // Initialize permissions
    const permissions = [
      { permission_id: 'perm_start_assessment', permission_key: 'start_assessment', action_type: 'edit', entity_type: 'Engagement', requires_role: ['admin', 'analyst', 'compliance_admin'] },
      { permission_id: 'perm_complete_assessment', permission_key: 'complete_assessment', action_type: 'edit', entity_type: 'Engagement', requires_role: ['admin', 'analyst'] },
      { permission_id: 'perm_approve_engagement', permission_key: 'approve_engagement', action_type: 'approve', entity_type: 'Engagement', requires_role: ['admin', 'compliance_admin'] },
      { permission_id: 'perm_finalize_engagement', permission_key: 'finalize_engagement', action_type: 'edit', entity_type: 'Engagement', requires_role: ['admin', 'compliance_admin'] },
      { permission_id: 'perm_archive_engagement', permission_key: 'archive_engagement', action_type: 'delete', entity_type: 'Engagement', requires_role: ['admin'] },
      { permission_id: 'perm_review_proposal', permission_key: 'review_proposal', action_type: 'edit', entity_type: 'RiskChangeProposal', requires_role: ['admin', 'reviewer', 'compliance_admin'] },
      { permission_id: 'perm_approve_proposal', permission_key: 'approve_proposal', action_type: 'approve', entity_type: 'RiskChangeProposal', requires_role: ['admin', 'compliance_admin'] },
      { permission_id: 'perm_reject_proposal', permission_key: 'reject_proposal', action_type: 'reject', entity_type: 'RiskChangeProposal', requires_role: ['admin', 'reviewer', 'compliance_admin'] },
      { permission_id: 'perm_merge_proposal', permission_key: 'merge_proposal', action_type: 'edit', entity_type: 'RiskChangeProposal', requires_role: ['admin', 'compliance_admin'] },
      { permission_id: 'perm_run_delivery_gate', permission_key: 'run_delivery_gate', action_type: 'create', entity_type: 'UpgradeRegistry', requires_role: ['admin'] },
      { permission_id: 'perm_complete_upgrade', permission_key: 'complete_upgrade', action_type: 'approve', entity_type: 'UpgradeRegistry', requires_role: ['admin'] },
      { permission_id: 'perm_archive_upgrade', permission_key: 'archive_upgrade', action_type: 'delete', entity_type: 'UpgradeRegistry', requires_role: ['admin'] },
      { permission_id: 'perm_edit_control', permission_key: 'edit_control', action_type: 'edit', entity_type: 'ControlLibrary', requires_role: ['admin', 'compliance_admin'] },
      { permission_id: 'perm_delete_task', permission_key: 'delete_task', action_type: 'delete', entity_type: 'Task', requires_role: ['admin'] },
      { permission_id: 'perm_publish_verification', permission_key: 'publish_verification', action_type: 'publish', entity_type: 'VerificationReport', requires_role: ['admin'] }
    ];

    for (const perm of permissions) {
      const existing = await base44.asServiceRole.entities.PermissionDefinition.filter({
        permission_key: perm.permission_key
      });

      if (existing.length === 0) {
        await base44.asServiceRole.entities.PermissionDefinition.create(perm);
        results.permissions.push({ permission_key: perm.permission_key, status: 'created' });
      } else {
        results.permissions.push({ permission_key: perm.permission_key, status: 'already_exists' });
      }
    }

    // Initialize governance rules
    const rules = [
      {
        rule_id: 'GR_PROHIBITED_PAGE_PATTERN',
        rule_name: 'Prohibited Page Pattern Check',
        category: 'page_pattern',
        severity: 'error',
        check_function: 'executeGovernanceRule',
        rule_definition: JSON.stringify({
          prohibited_patterns: ['^(Debug|Temp|Test|Internal)[A-Z]', '.*OneOff$', '.*Cleanup$']
        })
      },
      {
        rule_id: 'GR_MISSING_ARTIFACT_CLASSIFICATION',
        rule_name: 'Missing Artifact Classification',
        category: 'artifact',
        severity: 'error',
        check_function: 'executeGovernanceRule',
        applies_to_entity_type: 'PublishedOutput'
      },
      {
        rule_id: 'GR_MISSING_VERIFICATION_EVIDENCE',
        rule_name: 'Missing Verification Evidence',
        category: 'verification',
        severity: 'warn',
        check_function: 'executeGovernanceRule',
        applies_to_entity_type: 'VerificationReport'
      },
      {
        rule_id: 'GR_MISSING_DELIVERY_GATE_EVIDENCE',
        rule_name: 'Missing Delivery Gate Evidence',
        category: 'delivery_gate',
        severity: 'error',
        check_function: 'executeGovernanceRule',
        applies_to_entity_type: 'DeliveryGateRun'
      },
      {
        rule_id: 'GR_EXPIRED_EXCEPTION',
        rule_name: 'Expired Exception Check',
        category: 'exception',
        severity: 'warn',
        check_function: 'executeGovernanceRule',
        applies_to_entity_type: 'ApprovalRequest'
      }
    ];

    for (const rule of rules) {
      const existing = await base44.asServiceRole.entities.GovernanceRule.filter({
        rule_id: rule.rule_id
      });

      if (existing.length === 0) {
        await base44.asServiceRole.entities.GovernanceRule.create(rule);
        results.governance_rules.push({ rule_id: rule.rule_id, status: 'created' });
      } else {
        results.governance_rules.push({ rule_id: rule.rule_id, status: 'already_exists' });
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      initialization_summary: results,
      message: 'Backend infrastructure initialized successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});