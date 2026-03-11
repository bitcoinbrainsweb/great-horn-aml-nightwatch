import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Generic migration/backfill executor
 * Provides idempotent, trackable migrations with dry-run support
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      migration_id,
      title,
      purpose,
      target_entity_types,
      matching_rules,
      changes,
      dry_run_mode = false
    } = body;

    if (!migration_id || !title || !purpose || !target_entity_types) {
      return Response.json({
        error: 'Missing required fields: migration_id, title, purpose, target_entity_types'
      }, { status: 400 });
    }

    // Check if migration already ran
    const existing = await base44.asServiceRole.entities.MigrationRecord.filter({
      migration_id,
      status: { $in: ['completed', 'running'] }
    });

    if (existing.length > 0 && !dry_run_mode) {
      const prior = existing[0];
      if (prior.status === 'running') {
        return Response.json({
          error: 'Migration already running',
          migration_id
        }, { status: 409 });
      }
      if (prior.status === 'completed' && !prior.can_rerun_safely) {
        return Response.json({
          error: 'Migration already completed and is not idempotent',
          migration_id,
          prior_execution: prior.executed_at
        }, { status: 409 });
      }
    }

    // Create migration record
    const migrationRecord = await base44.asServiceRole.entities.MigrationRecord.create({
      migration_id,
      title,
      purpose,
      status: dry_run_mode ? 'pending' : 'running',
      target_entity_types,
      matching_rules: JSON.stringify(matching_rules || {}),
      dry_run_mode,
      executed_at: new Date().toISOString(),
      executed_by: user.email,
      can_rerun_safely: true
    });

    try {
      let totalBefore = 0;
      let totalAfter = 0;
      const changeSummary = {};

      // Process each target entity type
      for (const entityType of target_entity_types) {
        const Entity = base44.asServiceRole.entities[entityType];
        if (!Entity) {
          throw new Error(`Entity type not found: ${entityType}`);
        }

        // Fetch matching records
        const records = await Entity.filter(matching_rules || {});
        totalBefore += records.length;
        changeSummary[entityType] = { before: records.length, after: 0, details: [] };

        // Apply changes to each record
        if (!dry_run_mode && changes && changes[entityType]) {
          for (const record of records) {
            const changeSet = changes[entityType];
            await Entity.update(record.id, changeSet);
            changeSummary[entityType].details.push({
              id: record.id,
              changes: changeSet
            });
          }
          totalAfter += records.length;
          changeSummary[entityType].after = records.length;
        } else if (dry_run_mode) {
          // Dry-run: just count and preview
          totalAfter = records.length;
          changeSummary[entityType].after = records.length;
          changeSummary[entityType].details = records.slice(0, 5).map(r => ({ id: r.id, preview: true }));
        }
      }

      // Update migration record
      await base44.asServiceRole.entities.MigrationRecord.update(migrationRecord.id, {
        status: dry_run_mode ? 'pending' : 'completed',
        before_count: totalBefore,
        after_count: totalAfter,
        changes_summary: JSON.stringify(changeSummary)
      });

      return Response.json({
        success: true,
        migration_id,
        dry_run_mode,
        before_count: totalBefore,
        after_count: totalAfter,
        changes_summary: changeSummary,
        idempotent: true,
        message: dry_run_mode ? 'Dry-run completed (no changes made)' : 'Migration completed successfully'
      });
    } catch (error) {
      // Mark migration as failed
      await base44.asServiceRole.entities.MigrationRecord.update(migrationRecord.id, {
        status: 'failed',
        error_message: error.message
      });

      return Response.json({
        error: error.message,
        migration_id,
        status: 'failed'
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});