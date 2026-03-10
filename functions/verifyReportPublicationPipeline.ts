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

    // Check 1: GeneratedReport entity exists
    try {
      const reports = await base44.entities.GeneratedReport.list();
      results.checks.push({
        name: 'GeneratedReport entity exists and accessible',
        status: 'pass',
        details: `Found ${reports.length} reports`,
      });
      results.passed++;
    } catch (e) {
      results.checks.push({
        name: 'GeneratedReport entity',
        status: 'fail',
        details: e.message,
      });
      results.failed++;
    }

    // Check 2: Published reports visible on Reports page
    try {
      const published = await base44.entities.GeneratedReport.filter({
        visibleOnReportsPage: true,
        status: 'published',
      });
      results.checks.push({
        name: 'Published reports visible on Reports page',
        status: published.length > 0 ? 'pass' : 'warning',
        details: `Found ${published.length} published reports`,
      });
      results.passed++;
    } catch (e) {
      results.checks.push({
        name: 'Published reports visibility',
        status: 'fail',
        details: e.message,
      });
      results.failed++;
    }

    // Check 3: Reports have required metadata
    try {
      const allReports = await base44.entities.GeneratedReport.list();
      const hasMetadata = allReports.every(r => r.upgradeId && r.productVersion && r.reportType);
      results.checks.push({
        name: 'Reports have required metadata (upgradeId, productVersion, reportType)',
        status: hasMetadata ? 'pass' : 'fail',
        details: `Checked ${allReports.length} reports`,
      });
      hasMetadata ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({
        name: 'Report metadata',
        status: 'fail',
        details: e.message,
      });
      results.failed++;
    }

    // Check 4: No duplicate published reports
    try {
      const published = await base44.entities.GeneratedReport.filter({ status: 'published' });
      const grouped = {};
      for (const r of published) {
        const key = `${r.upgradeId}-${r.productVersion}-${r.reportType}`;
        grouped[key] = (grouped[key] || 0) + 1;
      }
      const hasDups = Object.values(grouped).some(count => count > 1);
      results.checks.push({
        name: 'No duplicate published reports',
        status: !hasDups ? 'pass' : 'warning',
        details: hasDups ? 'Some duplicates found' : 'No duplicates',
      });
      !hasDups ? results.passed++ : results.failed++;
    } catch (e) {
      results.checks.push({
        name: 'Duplicate detection',
        status: 'fail',
        details: e.message,
      });
      results.failed++;
    }

    // Check 5: Failed reports have error messages
    try {
      const failed = await base44.entities.GeneratedReport.filter({ status: 'failed' });
      const hasErrors = failed.every(r => r.publicationError);
      results.checks.push({
        name: 'Failed reports have error messages',
        status: hasErrors ? 'pass' : 'warning',
        details: `Found ${failed.length} failed reports`,
      });
      results.passed++;
    } catch (e) {
      results.checks.push({
        name: 'Failed report errors',
        status: 'fail',
        details: e.message,
      });
      results.failed++;
    }

    results.summary = `${results.passed} passed, ${results.failed} failed`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});