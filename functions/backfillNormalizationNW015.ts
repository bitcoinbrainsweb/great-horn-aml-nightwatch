import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Historical upgrade metadata
const HISTORICAL_UPGRADES = [
  {
    upgrade_id: 'NW-UPGRADE-001',
    product_version: 'v0.1.0',
    title: 'Initial Platform Launch',
    description: 'Foundation platform with core client and engagement workflows'
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
  },
  {
    upgrade_id: 'NW-UPGRADE-014',
    product_version: 'v0.6.0',
    title: 'Change Control Architecture Redesign',
    description: 'Elimination of manual publication pages and implementation of deterministic backend lifecycle logic'
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    let created = 0;
    let skipped = 0;

    for (const upgrade of HISTORICAL_UPGRADES) {
      // Check if verification record already exists
      const existing = await base44.asServiceRole.entities.PublishedOutput.filter({
        upgrade_id: upgrade.upgrade_id,
        classification: 'verification_record'
      });

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Create verification record for historical upgrade
      const recordName = `Nightwatch_VerificationRecord_${upgrade.product_version}_${upgrade.upgrade_id}_${today}`;

      const content = {
        title: upgrade.title,
        description: upgrade.description,
        upgrade_id: upgrade.upgrade_id,
        product_version: upgrade.product_version,
        delivery_gate_results: {},
        change_summary: {}
      };

      await base44.asServiceRole.entities.PublishedOutput.create({
        outputName: recordName,
        classification: 'verification_record',
        subtype: 'upgrade_verification',
        is_runnable: false,
        is_user_visible: false,
        display_zone: 'internal_only',
        source_module: 'backfillNormalizationNW015',
        source_event_type: 'historical_backfill',
        product_version: upgrade.product_version,
        upgrade_id: upgrade.upgrade_id,
        report_type: 'verification',
        status: 'published',
        published_at: now,
        content: JSON.stringify(content),
        summary: upgrade.title,
        metadata: JSON.stringify({
          lifecycle_generated: false,
          historical_backfill: true,
          backfill_date: now
        })
      });

      created++;
    }

    return Response.json({
      success: true,
      historical_upgrades_backfilled: created,
      already_existing: skipped,
      total_processed: HISTORICAL_UPGRADES.length,
      message: `Backfill complete: ${created} historical verification records created`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});