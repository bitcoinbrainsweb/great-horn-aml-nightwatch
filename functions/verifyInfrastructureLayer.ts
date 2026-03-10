import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checks = [];

    // 1. Check entities exist
    const entities = ['LibraryCache', 'NarrativeCache', 'ExecutionMetric', 'SystemEvent', 'HelpDoc', 'PageHelp'];
    
    for (const entity of entities) {
      try {
        const results = await base44.asServiceRole.entities[entity].list();
        checks.push({
          name: `${entity} entity exists`,
          passed: true,
          details: `Found ${results ? results.length : 0} records`
        });
      } catch (e) {
        checks.push({
          name: `${entity} entity exists`,
          passed: false,
          details: e.message
        });
      }
    }

    // 2. Check functions
    const functions = [
      'libraryCachingLayer',
      'narrativeCachingLayer',
      'executionMetricsRecorder',
      'systemEventLogger',
      'documentationGenerator',
      'pageExplanationGenerator'
    ];

    for (const func of functions) {
      try {
        let response;
        if (func === 'libraryCachingLayer') {
          response = await base44.functions.invoke(func, { libraryType: 'RiskLibrary' });
        } else if (func === 'narrativeCachingLayer') {
          response = await base44.functions.invoke(func, { contractId: 'RiskNarrative', inputData: {}, operation: 'check' });
        } else if (func === 'executionMetricsRecorder') {
          response = await base44.functions.invoke(func, { assessmentId: 'TEST', generationType: 'riskNarrative' });
        } else if (func === 'systemEventLogger') {
          response = await base44.functions.invoke(func, { eventType: 'assessment_created' });
        } else if (func === 'documentationGenerator') {
          response = await base44.functions.invoke(func, {});
        } else if (func === 'pageExplanationGenerator') {
          response = await base44.functions.invoke(func, { pageName: 'Dashboard' });
        }

        checks.push({
          name: `${func} function callable`,
          passed: response.data && response.data.success !== false,
          details: 'Function invoked successfully'
        });
      } catch (e) {
        checks.push({
          name: `${func} function callable`,
          passed: false,
          details: e.message
        });
      }
    }

    // Summary
    const passed = checks.filter(c => c.passed).length;
    const total = checks.length;

    return Response.json({
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        totalChecks: total,
        passed,
        failed: total - passed,
        percentage: Math.round((passed / total) * 100),
        systemReady: passed === total
      }
    });
  } catch (error) {
    return Response.json(
      { error: error.message, systemReady: false },
      { status: 500 }
    );
  }
});