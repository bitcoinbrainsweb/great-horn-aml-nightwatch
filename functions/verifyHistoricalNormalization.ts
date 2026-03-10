import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: '',
      passed: 0,
      failed: 0,
    };

    // Check 1: ProductVersion records exist for v0.1.0 through v0.5.0
    try {
      const versions = await base44.entities.ProductVersion.list();
      const requiredVersions = ['v0.1.0', 'v0.2.0', 'v0.3.0', 'v0.4.0', 'v0.5.0'];
      const hasAll = requiredVersions.every(v => versions.some(pv => pv.versionNumber === v));
      results.checks.push({
        name: 'ProductVersion records for v0.1.0-v0.5.0',
        status: hasAll ? 'pass' : 'fail',
        details: `Found ${versions.length} versions, required ${requiredVersions.length}`,
      });
      hasAll ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'ProductVersion records', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 2: UpgradeVersionMapping populated correctly
    try {
      const mappings = await base44.entities.UpgradeVersionMapping.list();
      const expectedCount = 10;
      results.checks.push({
        name: 'UpgradeVersionMapping populated',
        status: mappings.length >= expectedCount ? 'pass' : 'fail',
        details: `Found ${mappings.length} mappings (expected >= ${expectedCount})`,
      });
      mappings.length >= expectedCount ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'UpgradeVersionMapping', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 3: PromptHistoryRecord backfilled
    try {
      const prompts = await base44.entities.PromptHistoryRecord.list();
      const expectedCount = 5;
      results.checks.push({
        name: 'PromptHistoryRecord backfilled',
        status: prompts.length >= expectedCount ? 'pass' : 'fail',
        details: `Found ${prompts.length} records (expected >= ${expectedCount})`,
      });
      prompts.length >= expectedCount ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'PromptHistoryRecord', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 4: v0.5.0 marked as active baseline
    try {
      const v050 = await base44.entities.ProductVersion.filter({ versionNumber: 'v0.5.0' });
      const isActive = v050.length > 0 && v050[0].status === 'active';
      results.checks.push({
        name: 'v0.5.0 marked as active baseline',
        status: isActive ? 'pass' : 'fail',
        details: isActive ? 'v0.5.0 is active' : 'v0.5.0 status incorrect',
      });
      isActive ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'v0.5.0 active baseline', status: 'fail', details: e.message });
      results.failed++;
    }

    results.summary = `${results.passed} passed, ${results.failed} failed`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});