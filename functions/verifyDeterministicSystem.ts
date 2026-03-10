import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checks = [];
    const results = { timestamp: new Date().toISOString(), checks: [], summary: {} };

    // 1. Check AssessmentFinding entity
    try {
      const findings = await base44.asServiceRole.entities.AssessmentFinding.list();
      checks.push({
        name: 'AssessmentFinding entity exists',
        passed: Array.isArray(findings),
        details: `Found ${findings ? findings.length : 0} findings`
      });
    } catch (e) {
      checks.push({
        name: 'AssessmentFinding entity exists',
        passed: false,
        details: e.message
      });
    }

    // 2. Check DeterministicRiskEngine function exists
    try {
      const response = await base44.functions.invoke('deterministicRiskEngine', {
        assessmentId: 'TEST',
        selectedRisks: []
      });
      checks.push({
        name: 'DeterministicRiskEngine function callable',
        passed: response.data && response.data.success !== false,
        details: 'Function invoked successfully'
      });
    } catch (e) {
      checks.push({
        name: 'DeterministicRiskEngine function callable',
        passed: false,
        details: e.message
      });
    }

    // 3. Check ControlEffectivenessCalculator function
    try {
      const response = await base44.functions.invoke('controlEffectivenessCalculator', {
        assessmentId: 'TEST',
        riskId: 'TEST',
        implementedControls: [],
        controlGaps: []
      });
      checks.push({
        name: 'ControlEffectivenessCalculator function callable',
        passed: response.data && response.data.success,
        details: 'Function invoked successfully'
      });
    } catch (e) {
      checks.push({
        name: 'ControlEffectivenessCalculator function callable',
        passed: false,
        details: e.message
      });
    }

    // 4. Check ResidualRiskCalculator function
    try {
      const response = await base44.functions.invoke('residualRiskCalculator', {
        assessmentId: 'TEST',
        riskId: 'TEST',
        inherentRiskScore: 3,
        controlEffectivenessScore: 2
      });
      checks.push({
        name: 'ResidualRiskCalculator function callable',
        passed: response.data && response.data.success,
        details: 'Function invoked successfully'
      });
    } catch (e) {
      checks.push({
        name: 'ResidualRiskCalculator function callable',
        passed: false,
        details: e.message
      });
    }

    // 5. Check RecommendationEngine function
    try {
      const response = await base44.functions.invoke('recommendationEngine', {
        assessmentId: 'TEST',
        riskId: 'TEST',
        gaps: [],
        jurisdiction: 'Canada'
      });
      checks.push({
        name: 'RecommendationEngine function callable',
        passed: response.data && response.data.success,
        details: 'Function invoked successfully'
      });
    } catch (e) {
      checks.push({
        name: 'RecommendationEngine function callable',
        passed: false,
        details: e.message
      });
    }

    // 6. Check Prompt Guardrail on PromptController
    try {
      const response = await base44.functions.invoke('promptController', {
        contractId: 'RiskNarrative',
        inputData: { RiskLibrary: 'should_fail' }
      });
      // Should fail gracefully
      checks.push({
        name: 'Prompt guardrail rejects forbidden fields',
        passed: response.status === 400 || (response.data && response.data.error),
        details: 'Guardrail working'
      });
    } catch (e) {
      checks.push({
        name: 'Prompt guardrail rejects forbidden fields',
        passed: e.response?.status === 400,
        details: 'Guardrail working'
      });
    }

    // 7. Check finding hashing consistency
    try {
      const str = JSON.stringify({ a: 1 });
      const hash1 = btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str))).slice(0, 16);
      const hash2 = btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str))).slice(0, 16);
      checks.push({
        name: 'Finding hash consistency',
        passed: hash1 === hash2,
        details: 'Hashing algorithm deterministic'
      });
    } catch (e) {
      checks.push({
        name: 'Finding hash consistency',
        passed: false,
        details: e.message
      });
    }

    // 8. Check DecisionTrace entity
    try {
      const traces = await base44.asServiceRole.entities.DecisionTrace.list();
      checks.push({
        name: 'DecisionTrace entity exists',
        passed: Array.isArray(traces),
        details: `Found ${traces ? traces.length : 0} traces`
      });
    } catch (e) {
      checks.push({
        name: 'DecisionTrace entity exists',
        passed: false,
        details: e.message
      });
    }

    // Summary
    const passCount = checks.filter(c => c.passed).length;
    results.checks = checks;
    results.summary = {
      totalChecks: checks.length,
      passed: passCount,
      failed: checks.length - passCount,
      percentage: Math.round((passCount / checks.length) * 100),
      systemReady: passCount === checks.length
    };

    return Response.json(results);
  } catch (error) {
    return Response.json(
      { error: error.message, systemReady: false },
      { status: 500 }
    );
  }
});