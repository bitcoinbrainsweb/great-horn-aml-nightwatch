import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { testRunId, scenarioId, notes } = await req.json();

    if (!testRunId || !scenarioId) {
      return Response.json({ error: 'Missing testRunId or scenarioId' }, { status: 400 });
    }

    // Load test run
    const testRuns = await base44.entities.TestAssessmentRun.filter({ runId: testRunId });
    if (!testRuns || testRuns.length === 0) {
      return Response.json({ error: 'Test run not found' }, { status: 404 });
    }
    const testRun = testRuns[0];

    // Deactivate prior active baselines for this scenario
    const priorBaselines = await base44.entities.ScenarioBaseline.filter({ scenarioId });
    for (const baseline of priorBaselines) {
      if (baseline.active) {
        await base44.entities.ScenarioBaseline.update(baseline.id, { active: false });
      }
    }

    // Create new baseline
    const baselineId = `SB-${Date.now()}`;
    const newBaseline = await base44.entities.ScenarioBaseline.create({
      baselineId,
      scenarioId: testRun.scenarioId,
      baselineVersionLabel: `v0.10.0-baseline-${new Date().toLocaleDateString()}`,
      engineVersion: testRun.engineVersion,
      productVersion: testRun.productVersion,
      approvedAt: new Date().toISOString(),
      approvedBy: user.email,
      approvedFindings: testRun.actualFindings ? JSON.parse(testRun.actualFindings) : [],
      approvedControlConfidence: testRun.actualControlConfidence ? JSON.parse(testRun.actualControlConfidence) : {},
      approvedResidualRisk: testRun.actualResidualRisk,
      approvedGapCount: testRun.actualGapCount,
      approvedRecommendationSignals: testRun.actualRecommendationSignals ? JSON.parse(testRun.actualRecommendationSignals) : [],
      approvedNarrativeChecks: testRun.actualNarrativeCheckResults || '{}',
      notes: notes || 'Baseline approved via regression testing framework',
      active: true
    });

    return Response.json({
      success: true,
      baselineId: newBaseline.id,
      message: `Baseline approved for scenario ${scenarioId}`,
      priorBaselinesDeactivated: priorBaselines.length,
      approvedBy: user.email
    });
  } catch (error) {
    console.error('Error in approveScenarioBaseline:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});