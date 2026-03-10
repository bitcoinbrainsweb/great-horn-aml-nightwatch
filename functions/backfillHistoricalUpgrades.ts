import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const historicalUpgrades = [
      {
        upgrade_id: 'NW-UPGRADE-001',
        product_version: 'v0.1.0',
        title: 'Initial Architecture',
        description: 'Core system initialization and foundational entity definitions'
      },
      {
        upgrade_id: 'NW-UPGRADE-002',
        product_version: 'v0.2.0',
        title: 'Risk Library Implementation',
        description: 'Risk taxonomy and control mapping infrastructure'
      },
      {
        upgrade_id: 'NW-UPGRADE-003',
        product_version: 'v0.3.0',
        title: 'Assessment Engine',
        description: 'Core assessment state management and scoring'
      },
      {
        upgrade_id: 'NW-UPGRADE-004',
        product_version: 'v0.4.0',
        title: 'Narrative Generation System',
        description: 'LLM-based narrative and recommendation generation'
      },
      {
        upgrade_id: 'NW-UPGRADE-005',
        product_version: 'v0.4.5',
        title: 'Evidence Management',
        description: 'Control evidence tracking and evaluation'
      },
      {
        upgrade_id: 'NW-UPGRADE-010',
        product_version: 'v0.5.0',
        title: 'Output Registry and Publication',
        description: 'Artifact classification and publication framework'
      },
      {
        upgrade_id: 'NW-UPGRADE-010B',
        product_version: 'v0.5.0',
        title: 'Output Classification Normalization',
        description: 'Normalization of output artifact classifications'
      },
      {
        upgrade_id: 'NW-UPGRADE-011',
        product_version: 'v0.5.2',
        title: 'Report Publication Pipeline',
        description: 'Generated report persistence and delivery'
      },
      {
        upgrade_id: 'NW-UPGRADE-011A',
        product_version: 'v0.5.2',
        title: 'Historical Versioning Normalization',
        description: 'Legacy version tracking normalization'
      },
      {
        upgrade_id: 'NW-UPGRADE-012',
        product_version: 'v0.5.5',
        title: 'Regression Testing Framework',
        description: 'Scenario-based regression testing and baseline approval'
      },
      {
        upgrade_id: 'NW-UPGRADE-013',
        product_version: 'v0.6.0',
        title: 'Artifact Classification and Page Cleanup',
        description: 'Removal of misclassified artifact pages and verification record isolation'
      }
    ];

    const now = new Date().toISOString();
    const results = [];

    for (const upgrade of historicalUpgrades) {
      try {
        const existing = await base44.asServiceRole.entities.UpgradeRegistry.filter({
          upgrade_id: upgrade.upgrade_id
        });

        if (existing.length === 0) {
          const created = await base44.asServiceRole.entities.UpgradeRegistry.create({
            upgrade_id: upgrade.upgrade_id,
            product_version: upgrade.product_version,
            title: upgrade.title,
            description: upgrade.description,
            status: 'completed',
            delivery_gate_status: 'passed',
            started_at: now,
            completed_at: now,
            triggered_by: 'backfill_system',
            tags: ['historical', 'backfilled']
          });

          results.push({
            upgrade_id: upgrade.upgrade_id,
            status: 'created',
            registry_id: created.id
          });
        } else {
          results.push({
            upgrade_id: upgrade.upgrade_id,
            status: 'already_exists',
            registry_id: existing[0].id
          });
        }
      } catch (err) {
        results.push({
          upgrade_id: upgrade.upgrade_id,
          status: 'error',
          error: err.message
        });
      }
    }

    return Response.json({
      success: true,
      total: historicalUpgrades.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});