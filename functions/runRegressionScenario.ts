import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenarioId } = await req.json();

    if (!scenarioId) {
      return Response.json({ error: 'Missing scenarioId' }, { status: 400 });
    }

    // Load scenario
    const scenarios = await base44.entities.TestScenario.filter({ scenarioId });
    if (!scenarios || scenarios.length === 0) {
      return Response.json({ error: 'Scenario not found' }, { status: 404 });
    }
    const scenario = scenarios[0];

    const runId = `TAR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startedAt = new Date().toISOString();

    // Parse input profile
    let inputProfile = {};
    try {
      inputProfile = JSON.parse(scenario.inputAssessmentProfile || '{}');
    } catch (e) {
      inputProfile = {};
    }

    // Simulate assessment execution (deterministic outputs)
    const actualFindings = (inputProfile.risks || []).map((r, i) => `FINDING-${i + 1}`);
    const actualGapCount = (inputProfile.gaps || []).length;
    const actualControlConfidence = inputProfile.controlConfidence || {};
    const actualResidualRisk = inputProfile.residualRisk || 'medium';
    const actualRecommendationSignals = inputProfile.recommendations || [];

    // Run narrative sanity checks
    const narrativeChecks = JSON.parse(scenario.expectedNarrativeChecks || '{}');
    const mockNarrative = `Risk assessment identified ${actualGapCount} control gaps. ` +
      (scenario.jurisdiction ? `Jurisdiction: ${scenario.jurisdiction}. ` : '') +
      'Monitoring controls recommended. Training requirements identified. ' +
      'Policy updates required for transaction monitoring.';

    const narrativeCheckReq = new Request('http://internal/narrativeSanityChecker', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        narrative: mockNarrative,
        narrativeChecks
      })
    });
    const narrativeResult = await base44.functions.invoke('narrativeSanityChecker', {
      narrative: mockNarrative,
      narrativeChecks
    });

    // Run assertions
    const assertionReq = new Request('http://internal/scenarioAssertionEvaluator', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actualResults: {
          actualFindings,
          actualControlConfidence,
          actualResidualRisk,
          actualGapCount,
          actualRecommendationSignals
        },
        expectedResults: {
          expectedFindings: scenario.expectedFindings,
          expectedControlConfidence: scenario.expectedControlConfidence,
          expectedResidualRisk: scenario.expectedResidualRisk,
          expectedGapCount: scenario.expectedGapCount,
          expectedRecommendationSignals: scenario.expectedRecommendationSignals
        }
      })
    });
    const assertionResult = await base44.functions.invoke('scenarioAssertionEvaluator', {
      actualResults: {
        actualFindings,
        actualControlConfidence,
        actualResidualRisk,
        actualGapCount,
        actualRecommendationSignals
      },
      expectedResults: {
        expectedFindings: scenario.expectedFindings,
        expectedControlConfidence: scenario.expectedControlConfidence,
        expectedResidualRisk: scenario.expectedResidualRisk,
        expectedGapCount: scenario.expectedGapCount,
        expectedRecommendationSignals: scenario.expectedRecommendationSignals
      }
    });

    const deviations = assertionResult.data?.deviations || [];

    // Check baseline match
    const baselines = await base44.entities.ScenarioBaseline.filter({ scenarioId, active: true });
    let baselineMatchStatus = 'baseline_missing';
    if (baselines && baselines.length > 0) {
      const baseline = baselines[0];
      const gapDiff = Math.abs(actualGapCount - baseline.approvedGapCount);
      baselineMatchStatus = gapDiff <= 1 ? 'matched' : 'deviated';
    }

    const completedAt = new Date().toISOString();
    const status = deviations.length === 0 ? 'passed' : (deviations.some(d => d.severity === 'high') ? 'failed' : 'warning');

    // Store test run
    const testRun = await base44.entities.TestAssessmentRun.create({
      runId,
      scenarioId: scenario.id,
      scenarioName: scenario.scenarioName,
      engineVersion: 'v0.10.0',
      productVersion: 'v0.10.0',
      startedAt,
      completedAt,
      status,
      actualFindings: JSON.stringify(actualFindings),
      actualControlConfidence: JSON.stringify(actualControlConfidence),
      actualResidualRisk,
      actualGapCount,
      actualRecommendationSignals: JSON.stringify(actualRecommendationSignals),
      actualNarrativeCheckResults: JSON.stringify(narrativeResult),
      deviations: JSON.stringify(deviations),
      baselineMatchStatus,
      summary: `${status.toUpperCase()}: ${deviations.length} deviations detected`
    });

    return Response.json({
      runId,
      status,
      scenarioId: scenario.id,
      scenarioName: scenario.scenarioName,
      baselineMatchStatus,
      deviations,
      narrativeResults: narrativeResult,
      summary: `Scenario ${scenario.scenarioName} executed with status ${status}`
    });
  } catch (error) {
    console.error('Error in runRegressionScenario:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});