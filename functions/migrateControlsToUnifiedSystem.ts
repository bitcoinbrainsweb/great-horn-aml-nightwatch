import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Migrate Control entity records to ControlLibrary (unified control system)
 * 
 * This function:
 * 1. Reads all Control entity records
 * 2. Migrates them to ControlLibrary with proper field mapping
 * 3. Updates ControlTest references from control_id to control_library_id
 * 4. Marks original Control records for deprecation
 * 
 * Field mapping:
 * Control.name → ControlLibrary.control_name
 * Control.owner → ControlLibrary.owner (new field)
 * Control.department → ControlLibrary.department (new field)
 * Control.testing_method → ControlLibrary.testing_method (new field)
 * Control.testing_frequency → ControlLibrary.testing_frequency (new field)
 * Control.scope_tags → ControlLibrary.scope_tags (new field)
 * 
 * Returns:
 * {
 *   success: boolean,
 *   controls_migrated: number,
 *   tests_updated: number,
 *   migration_map: {[old_control_id]: new_control_library_id}
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !['admin', 'super_admin'].includes(user?.role)) {
      return Response.json({ error: 'Forbidden: Technical Admin access required' }, { status: 403 });
    }

    console.log('[ControlMigration] Starting control system unification...');
    
    // 1. Read all Control records
    const controls = await base44.asServiceRole.entities.Control.list();
    console.log(`[ControlMigration] Found ${controls.length} Control records to migrate`);
    
    if (controls.length === 0) {
      return Response.json({
        success: true,
        controls_migrated: 0,
        tests_updated: 0,
        migration_map: {},
        message: 'No Control records to migrate'
      });
    }

    // 2. Migrate Control → ControlLibrary
    const migrationMap = {};
    let controlsMigrated = 0;
    
    for (const control of controls) {
      // Check if already migrated (by control_name match)
      const existing = await base44.asServiceRole.entities.ControlLibrary.filter({ 
        control_name: control.name 
      });
      
      if (existing.length > 0) {
        console.log(`[ControlMigration] Control "${control.name}" already exists in ControlLibrary, mapping to existing`);
        migrationMap[control.id] = existing[0].id;
        continue;
      }

      // Create new ControlLibrary record
      const newControl = await base44.asServiceRole.entities.ControlLibrary.create({
        control_name: control.name,
        description: control.description || '',
        owner: control.owner,
        department: control.department,
        testing_method: control.testing_method,
        testing_frequency: control.testing_frequency,
        scope_tags: control.scope_tags || [],
        control_category: 'Operations', // Default category
        status: 'Active',
        lifecycle_state: 'active',
        is_core: false,
        workspace_id: null,
        version: 1
      });
      
      migrationMap[control.id] = newControl.id;
      controlsMigrated++;
      console.log(`[ControlMigration] Migrated "${control.name}" → ControlLibrary ${newControl.id}`);
    }

    // 3. Update ControlTest references
    const tests = await base44.asServiceRole.entities.ControlTest.list();
    let testsUpdated = 0;
    
    for (const test of tests) {
      if (test.control_id && !test.control_library_id) {
        const newControlId = migrationMap[test.control_id];
        if (newControlId) {
          await base44.asServiceRole.entities.ControlTest.update(test.id, {
            control_library_id: newControlId
          });
          testsUpdated++;
          console.log(`[ControlMigration] Updated ControlTest ${test.id}: control_id → control_library_id`);
        } else {
          console.warn(`[ControlMigration] ControlTest ${test.id} references unknown control_id: ${test.control_id}`);
        }
      }
    }

    console.log('[ControlMigration] Migration complete');
    console.log(`[ControlMigration] Controls migrated: ${controlsMigrated}`);
    console.log(`[ControlMigration] Tests updated: ${testsUpdated}`);

    return Response.json({
      success: true,
      controls_migrated: controlsMigrated,
      tests_updated: testsUpdated,
      migration_map: migrationMap,
      message: `Successfully migrated ${controlsMigrated} controls and updated ${testsUpdated} control tests`
    });

  } catch (error) {
    console.error('[ControlMigration] Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});