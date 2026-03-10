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
      passed: 0,
      failed: 0,
    };

    // Check 1: Reports appear on Reports page, not in AdminTools
    try {
      const reports = await base44.entities.OutputRegistryItem.filter({
        outputClass: 'report',
      });
      const allCorrect = reports.every(r => r.visibleInReports && !r.visibleInAdminTools);
      results.checks.push({
        name: 'Reports visible in Reports only, not AdminTools',
        status: allCorrect ? 'pass' : 'fail',
        details: `Found ${reports.length} reports`,
      });
      allCorrect ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'Report classification', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 2: Documentation not in AdminTools
    try {
      const docs = await base44.entities.OutputRegistryItem.filter({
        outputClass: 'documentation',
      });
      const allCorrect = docs.every(d => !d.visibleInAdminTools);
      results.checks.push({
        name: 'Documentation not in AdminTools',
        status: allCorrect ? 'pass' : 'fail',
        details: `Found ${docs.length} docs`,
      });
      allCorrect ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'Documentation classification', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 3: AdminTools only contain tool items
    try {
      const tools = await base44.entities.OutputRegistryItem.filter({
        visibleInAdminTools: true,
      });
      const allTools = tools.every(t => t.outputClass === 'tool');
      results.checks.push({
        name: 'AdminTools contains only tool items',
        status: allTools ? 'pass' : 'fail',
        details: `Found ${tools.length} items in AdminTools`,
      });
      allTools ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'AdminTools filtering', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 4: No misclassified items
    try {
      const misclassified = await base44.entities.OutputRegistryItem.filter({
        status: 'misclassified',
      });
      results.checks.push({
        name: 'No misclassified items',
        status: misclassified.length === 0 ? 'pass' : 'warning',
        details: `Found ${misclassified.length} misclassified items`,
      });
      misclassified.length === 0 ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'Misclassification check', status: 'fail', details: e.message });
      results.failed++;
    }

    // Check 5: Generated reports are published
    try {
      const generated = await base44.entities.OutputRegistryItem.filter({
        sourceType: 'DeliveryGateRun',
      });
      const allPublished = generated.every(g => g.status === 'published');
      results.checks.push({
        name: 'Generated reports are published',
        status: allPublished ? 'pass' : 'warning',
        details: `Found ${generated.length} generated items`,
      });
      allPublished ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({ name: 'Publication check', status: 'fail', details: e.message });
      results.failed++;
    }

    results.summary = `${results.passed} passed, ${results.failed} failed`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});