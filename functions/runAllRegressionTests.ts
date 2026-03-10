import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suiteId = `RTS-${Date.now()}`;
    const startedAt = new Date().toISOString();

    // Load all active scenarios
    const scenarios = await base44.entities.TestScenario.filter({ active: true });

    if (!scenarios || scenarios.length === 0) {
      return Response.json({
        suiteId,
        status: 'error',
        message: 'No active scenarios found',
        totalScenarios: 0
      });
    }

    let passedCount = 0;
    let failedCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    const runResults = [];
    const newDeviations = [];

    // Execute each scenario
    for (const scenario of scenarios) {
      try {
        const scenarioResult = await base44.functions.invoke('runRegressionScenario', {
          scenarioId: scenario.id
        });

        runResults.push(scenarioResult);

        if (scenarioResult.status === 'passed') {
          passedCount++;
        } else if (scenarioResult.status === 'failed') {
          failedCount++;
          if (scenarioResult.deviations) {
            newDeviations.push({
              scenario: scenario.scenarioName,
              deviations: scenarioResult.deviations
            });
          }
        } else if (scenarioResult.status === 'warning') {
          warningCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
        runResults.push({
          scenario: scenario.scenarioName,
          status: 'error',
          error: e.message
        });
      }
    }

    // Determine release readiness
    let releaseReadiness = 'ready';
    if (failedCount > 0) {
      releaseReadiness = 'blocked';
    } else if (warningCount > 0 || errorCount > 0) {
      releaseReadiness = 'caution';
    }

    const regressionDetected = failedCount > 0 || (newDeviations.length > 0 && failedCount > 0);

    const completedAt = new Date().toISOString();

    const summary = `Test Suite ${suiteId}: ${passedCount} passed, ${failedCount} failed, ${warningCount} warnings, ${errorCount} errors. Release readiness: ${releaseReadiness}`;

    // Store test suite
    const testSuite = await base44.entities.RegressionTestSuite.create({
      suiteId,
      suiteName: `Full Regression Suite ${new Date().toLocaleDateString()}`,
      description: `Automated regression test suite executed against all active scenarios`,
      engineVersion: 'v0.10.0',
      productVersion: 'v0.10.0',
      totalScenarios: scenarios.length,
      passedCount,
      failedCount,
      warningCount,
      errorCount,
      startedAt,
      completedAt,
      releaseReadiness,
      regressionDetected,
      newDeviations: JSON.stringify(newDeviations),
      summary
    });

    return Response.json({
      suiteId,
      releaseReadiness,
      totalScenarios: scenarios.length,
      passedCount,
      failedCount,
      warningCount,
      errorCount,
      regressionDetected,
      newDeviations,
      summary,
      runResults: runResults.slice(0, 5) // Return first 5 for brevity
    });
  } catch (error) {
    console.error('Error in runAllRegressionTests:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});