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

    // Test 1: Verification reports query isolation
    try {
      const verificationReports = await base44.entities.PublishedOutput.filter({
        classification: 'report',
        subtype: 'verification',
        status: 'published'
      });
      
      const allCorrect = verificationReports.every(r => 
        r.classification === 'report' && 
        r.subtype === 'verification' &&
        r.display_zone === 'reports' &&
        r.is_user_visible === true &&
        r.is_runnable === false
      );
      
      checks.testResults.push({
        name: 'Verification Reports Query Isolation',
        status: allCorrect ? 'pass' : 'fail',
        details: `Found ${verificationReports.length} verification reports, all correct: ${allCorrect}`,
      });
      allCorrect ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'Verification Reports Query Isolation', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 2: No reports in tools/admin (fallback routing test)
    try {
      const toolOutputs = await base44.entities.PublishedOutput.filter({
        classification: 'tool',
        is_runnable: true
      });
      
      // Verify none are verification reports
      const noReportsMisrouted = toolOutputs.every(t => t.subtype !== 'verification');
      
      checks.testResults.push({
        name: 'Fallback Routing Exclusion (No Tools Class)',
        status: noReportsMisrouted ? 'pass' : 'fail',
        details: `${toolOutputs.length} tool outputs found, no verification reports: ${noReportsMisrouted}`,
      });
      noReportsMisrouted ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'Fallback Routing Exclusion', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 3: Canonical naming format
    try {
      const allReports = await base44.entities.PublishedOutput.filter({
        classification: 'report',
        subtype: 'verification'
      });
      
      const canonicalPattern = /^Nightwatch_Verification_v\d+\.\d+\.\d+_NW-UPGRADE-\d+_\d{4}-\d{2}-\d{2}$/;
      const canonicalCount = allReports.filter(r => canonicalPattern.test(r.outputName)).length;
      const ratio = allReports.length > 0 ? (canonicalCount / allReports.length) : 0;
      
      checks.testResults.push({
        name: 'Canonical Naming Format',
        status: ratio > 0.8 ? 'pass' : 'warning',
        details: `${canonicalCount}/${allReports.length} use canonical naming (${(ratio * 100).toFixed(0)}%)`,
      });
      ratio > 0.8 ? checks.passed++ : checks.warnings++;
    } catch (e) {
      checks.testResults.push({ name: 'Canonical Naming Format', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 4: No alternate report pages in PublishedOutput
    try {
      const misplacedOutputs = await base44.entities.PublishedOutput.filter({
        display_zone: 'internal_only',
        subtype: 'verification'
      });
      
      const allInternal = misplacedOutputs.every(o => o.classification === 'internal_record');
      
      checks.testResults.push({
        name: 'No Misrouted Verification Reports',
        status: allInternal ? 'pass' : 'fail',
        details: `${misplacedOutputs.length} internal records, all properly classified: ${allInternal}`,
      });
      allInternal ? checks.passed++ : checks.failed++;
    } catch (e) {
      checks.testResults.push({ name: 'No Misrouted Verification Reports', status: 'fail', details: e.message });
      checks.failed++;
    }

    // Test 5: Audit logging for normalizations
    try {
      const auditLogs = await base44.entities.PublicationAuditLog.filter({
        eventType: 'normalization'
      });
      
      const hasNormLogs = auditLogs.length > 0;
      
      checks.testResults.push({
        name: 'Audit Logging for Normalizations',
        status: hasNormLogs ? 'pass' : 'warning',
        details: `Found ${auditLogs.length} normalization audit entries`,
      });
      hasNormLogs ? checks.passed++ : checks.warnings++;
    } catch (e) {
      checks.testResults.push({ name: 'Audit Logging', status: 'fail', details: e.message });
      checks.failed++;
    }

    checks.summary = `${checks.passed} passed, ${checks.failed} failed, ${checks.warnings} warnings`;
    checks.status = checks.failed === 0 ? 'PASSED' : 'FAILED';

    return Response.json(checks);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});