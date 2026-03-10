import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const configs = [
      // SCORING
      { configId: 'SC-001', configKey: 'residual_risk_mode', configValue: 'Balanced', configType: 'string', defaultValue: 'Balanced', category: 'scoring', description: 'Residual risk calculation mode: Balanced, Conservative, or Aggressive', editable: true },
      { configId: 'SC-002', configKey: 'baseline_gap_severity', configValue: 'major', configType: 'string', defaultValue: 'major', category: 'scoring', description: 'Severity level for baseline control gaps', editable: true },
      { configId: 'SC-003', configKey: 'enhanced_gap_severity', configValue: 'critical', configType: 'string', defaultValue: 'critical', category: 'scoring', description: 'Severity level for enhanced control gaps', editable: true },
      { configId: 'SC-004', configKey: 'conditional_gap_severity', configValue: 'major', configType: 'string', defaultValue: 'major', category: 'scoring', description: 'Severity level for conditional control gaps', editable: true },
      { configId: 'SC-005', configKey: 'compensating_control_reduction_enabled', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'scoring', description: 'Enable residual risk reduction for compensating controls', editable: true },

      // PERFORMANCE
      { configId: 'PE-001', configKey: 'library_cache_enabled', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'performance', description: 'Enable library caching to reduce load times', editable: true },
      { configId: 'PE-002', configKey: 'library_cache_ttl_minutes', configValue: '240', configType: 'number', defaultValue: '240', category: 'performance', description: 'Library cache TTL in minutes', editable: true },
      { configId: 'PE-003', configKey: 'narrative_cache_enabled', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'performance', description: 'Enable narrative caching to reduce LLM calls', editable: true },
      { configId: 'PE-004', configKey: 'narrative_cache_ttl_minutes', configValue: '480', configType: 'number', defaultValue: '480', category: 'performance', description: 'Narrative cache TTL in minutes', editable: true },
      { configId: 'PE-005', configKey: 'max_parallel_risk_workers', configValue: '4', configType: 'number', defaultValue: '4', category: 'performance', description: 'Maximum parallel risk processor workers', editable: true },

      // GENERATION
      { configId: 'GE-001', configKey: 'strict_contract_mode', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'generation', description: 'Enforce strict GenerationContract validation', editable: false },
      { configId: 'GE-002', configKey: 'prompt_payload_guardrail_enabled', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'generation', description: 'Reject forbidden fields in prompt payloads', editable: false },
      { configId: 'GE-003', configKey: 'default_llm_model', configValue: 'gpt-4o-mini', configType: 'string', defaultValue: 'gpt-4o-mini', category: 'generation', description: 'Default LLM model for narrative generation', editable: true },
      { configId: 'GE-004', configKey: 'max_prompt_tokens', configValue: '10240', configType: 'number', defaultValue: '10240', category: 'generation', description: 'Maximum payload size in tokens', editable: false },

      // SECURITY
      { configId: 'SE-001', configKey: 'session_idle_timeout_minutes', configValue: '60', configType: 'number', defaultValue: '60', category: 'security', description: 'Session idle timeout in minutes', editable: true },
      { configId: 'SE-002', configKey: 'failed_login_alert_threshold', configValue: '5', configType: 'number', defaultValue: '5', category: 'security', description: 'Number of failed logins before alert', editable: true },
      { configId: 'SE-003', configKey: 'track_user_activity_enabled', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'security', description: 'Enable user activity tracking', editable: false },

      // UI
      { configId: 'UI-001', configKey: 'show_execution_metrics_dashboard', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'ui', description: 'Show execution metrics dashboard in admin', editable: true },
      { configId: 'UI-002', configKey: 'show_explain_this_page', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'ui', description: 'Show "Explain This Page" button', editable: true },
      { configId: 'UI-003', configKey: 'show_system_event_timeline', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'ui', description: 'Show system event timeline in admin', editable: true },
      { configId: 'UI-004', configKey: 'show_feedback_button_globally', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'ui', description: 'Show feedback button on all pages', editable: true },

      // AUDIT
      { configId: 'AU-001', configKey: 'decision_trace_required', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'audit', description: 'Require decision traces for all findings', editable: false },
      { configId: 'AU-002', configKey: 'assessment_change_log_required', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'audit', description: 'Require change logs for assessments', editable: false },
      { configId: 'AU-003', configKey: 'verification_required_for_major_upgrades', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'audit', description: 'Require verification report for major upgrades', editable: true },
      { configId: 'AU-004', configKey: 'internal_audit_required_for_major_upgrades', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'audit', description: 'Require internal audit for major upgrades', editable: true },

      // DELIVERY_GATE
      { configId: 'DG-001', configKey: 'delivery_gate_enabled', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'delivery_gate', description: 'Enable delivery gate framework for upgrades', editable: false },
      { configId: 'DG-002', configKey: 'delivery_gate_requires_implementation_summary', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'delivery_gate', description: 'Require implementation summary in gate', editable: true },
      { configId: 'DG-003', configKey: 'delivery_gate_requires_verification_report', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'delivery_gate', description: 'Require verification report in gate', editable: true },
      { configId: 'DG-004', configKey: 'delivery_gate_requires_internal_audit', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'delivery_gate', description: 'Require internal audit in gate', editable: true },
      { configId: 'DG-005', configKey: 'delivery_gate_requires_documentation_update_summary', configValue: 'true', configType: 'boolean', defaultValue: 'true', category: 'delivery_gate', description: 'Require documentation update summary in gate', editable: true }
    ];

    let created = 0;
    for (const config of configs) {
      try {
        await base44.asServiceRole.entities.SystemConfig.create({
          ...config,
          updatedAt: new Date().toISOString(),
          updatedBy: user.email || 'system'
        });
        created++;
      } catch (e) {
        console.error(`Failed to create config ${config.configId}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      message: `Initialized ${created}/${configs.length} system configs`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});