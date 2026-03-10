import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const checks = {
      timestamp: new Date().toISOString(),
      passed: 0,
      failed: 0,
      warnings: 0,
      testResults: [],
    };

    // Test 1: Classification isolation
    try {
      const reports = await base44.entities.PublishedOutput.filter({ classification: 'report' });
      const allCorrect = reports.every(r => r.display_zone === 'reports' && r.is_user_visible);
      checks.testResults.push({
        name: 'Classification Isolation: Reports',
        status: allCorrect ? 'pass' : 'fail',
        details: `Found ${reports.length} reports, all correct: ${allCorrect}`,
      });
      allCorrect ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'Classification Isolation: Reports', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 2: Documentation isolation
    try {
      const docs = await base44.entities.PublishedOutput.filter({ classification: 'documentation' });
      const allCorrect = docs.every(d => d.display_zone === 'docs' && d.is_user_visible);
      checks.testResults.push({
        name: 'Classification Isolation: Documentation',
        status: allCorrect ? 'pass' : 'fail',
        details: `Found ${docs.length} docs, all correct: ${allCorrect}`,
      });
      allCorrect ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'Classification Isolation: Documentation', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 3: Tools isolation
    try {
      const tools = await base44.entities.PublishedOutput.filter({ classification: 'tool' });
      const allCorrect = tools.every(t => t.display_zone === 'tools' && t.is_runnable);
      checks.testResults.push({
        name: 'Classification Isolation: Tools',
        status: allCorrect ? 'pass' : 'fail',
        details: `Found ${tools.length} tools, all correct: ${allCorrect}`,
      });
      allCorrect ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'Classification Isolation: Tools', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 4: Internal Tools exclusion
    try {
      const internalOnly = await base44.entities.PublishedOutput.filter({ display_zone: 'internal_only' });
      const notVisible = internalOnly.every(i => !i.is_user_visible);
      checks.testResults.push({
        name: 'Internal Tools Exclusion',
        status: notVisible ? 'pass' : 'fail',
        details: `Found ${internalOnly.length} internal records, all hidden: ${notVisible}`,
      });
      notVisible ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'Internal Tools Exclusion', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 5: Safe default for unclassified
    try {
      const unclassified = await base44.entities.PublishedOutput.filter({ classification: 'internal_record' });
      const allSafe = unclassified.every(u => !u.is_runnable && !u.is_user_visible);
      checks.testResults.push({
        name: 'Safe Default: internal_record',
        status: allSafe ? 'pass' : 'fail',
        details: `Found ${unclassified.length} internal records, all safe: ${allSafe}`,
      });
      allSafe ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'Safe Default: internal_record', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 6: Audit logging exists
    try {
      const auditLogs = await base44.entities.PublicationAuditLog.list();
      const hasLogs = auditLogs.length > 0;
      checks.testResults.push({
        name: 'Audit Logging',
        status: hasLogs ? 'pass' : 'warning',
        details: `Found ${auditLogs.length} audit log entries`,
      });
      hasLogs ? checks.passed++ : checks.warnings++;
    } catch (e) {
      checks.testResults.push({ name: 'Audit Logging', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 7: Canonical naming in use
    try {
      const all = await base44.entities.PublishedOutput.list();
      const canonical = all.filter(o => /^Nightwatch_.*_v\d+\.\d+\.\d+_NW-UPGRADE-\d+_\d{4}-\d{2}-\d{2}$/.test(o.outputName)).length;
      const ratio = all.length > 0 ? (canonical / all.length) : 0;
      checks.testResults.push({
        name: 'Canonical Naming Format',
        status: ratio > 0.8 ? 'pass' : 'warning',
        details: `${canonical}/${all.length} outputs use canonical naming (${(ratio * 100).toFixed(0)}%)`,
      });
      ratio > 0.8 ? checks.passed++ : checks.warnings++;
    } catch (e) {
      checks.testResults.push({ name: 'Canonical Naming Format', status: 'fail', details: e.message });
      checks.failed++;
    }

    checks.summary = `${checks.passed} passed, ${checks.failed} failed, ${checks.warnings} warnings`;
    checks.status = checks.failed === 0 ? 'PASSED' : 'FAILED';

    return Response.json(checks);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});