import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const upgrades = [
      { upgradeId: 'NW-UPGRADE-001', upgradeName: 'Core Architecture + Internal Audit', version: 'v1.0', description: 'Initial Nightwatch platform with core AML risk assessment engine and internal audit framework', status: 'completed', implementedAt: '2025-12-15T00:00:00Z' },
      { upgradeId: 'NW-UPGRADE-002', upgradeName: 'Remediation + Retest', version: 'v1.05', description: 'Added remediation workflows and retest capabilities for control effectiveness validation', status: 'completed', implementedAt: '2025-12-20T00:00:00Z' },
      { upgradeId: 'NW-UPGRADE-003', upgradeName: 'Prompt Template + Generation Contract System', version: 'v1.1', description: 'Implemented GenerationContract and PromptTemplate systems for deterministic narrative generation with strict input/output validation', status: 'completed', implementedAt: '2026-01-10T00:00:00Z' },
      { upgradeId: 'NW-UPGRADE-004', upgradeName: 'Deterministic Assessment Engine + Findings Layer', version: 'v1.2', description: 'Deployed deterministic risk analysis with AssessmentFinding entity and DecisionTrace logging for full auditability', status: 'completed', implementedAt: '2026-01-25T00:00:00Z' },
      { upgradeId: 'NW-UPGRADE-005', upgradeName: 'Platform Infrastructure + Observability', version: 'v1.4', description: 'Added library/narrative caching (50-70% LLM reduction), ExecutionMetric tracking, SystemEvent timeline, and auto-generated documentation', status: 'completed', implementedAt: '2026-03-05T00:00:00Z' },
      { upgradeId: 'NW-UPGRADE-006', upgradeName: 'User Access + Activity Monitoring', version: 'v1.45', description: 'Implemented user invitation system, role-based access control, and activity logging for compliance audit trails', status: 'completed', implementedAt: '2026-03-08T00:00:00Z' },
      { upgradeId: 'NW-UPGRADE-007', upgradeName: 'Product UX Rollout + Delivery Gate Framework', version: 'v1.5', description: 'Deployed user-facing operational features (feedback system, progress tracking, event timeline, metrics) and automated Delivery Gate framework for repeatable upgrades', status: 'completed', implementedAt: '2026-03-10T12:00:00Z' },
      { upgradeId: 'NW-UPGRADE-008', upgradeName: 'System Configuration Registry', version: 'v1.7', description: 'Implemented centralized SystemConfig registry, ConfigLoader, admin UI, and upgrade naming scheme for maintainable platform configuration and upgrade tracking', status: 'in_progress', implementedAt: '2026-03-10T18:00:00Z' }
    ];

    let created = 0;
    for (const upgrade of upgrades) {
      try {
        const existing = await base44.asServiceRole.entities.UpgradeRegistry.filter({ upgradeId: upgrade.upgradeId });
        if (existing && existing.length === 0) {
          await base44.asServiceRole.entities.UpgradeRegistry.create(upgrade);
          created++;
        }
      } catch (e) {
        console.error(`Failed to create upgrade ${upgrade.upgradeId}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      message: `Initialized ${created} new upgrade registry entries`,
      totalUpgrades: upgrades.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});