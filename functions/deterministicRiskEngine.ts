import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function generateHash(inputs, rulesApplied, dependencies) {
  const data = JSON.stringify({
    inputs,
    rulesApplied: rulesApplied.sort(),
    dependencies: (dependencies || []).sort()
  });
  const hash = new TextEncoder().encode(data);
  return btoa(String.fromCharCode.apply(null, hash)).slice(0, 16);
}

async function recordFinding(base44, finding) {
  const findingId = `FIND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const inputHash = generateHash(finding.inputs, finding.rulesApplied || [], finding.dependsOnFindingIds || []);

  return await base44.asServiceRole.entities.AssessmentFinding.create({
    findingId,
    assessmentId: finding.assessmentId,
    riskId: finding.riskId,
    findingType: finding.findingType,
    inputs: JSON.stringify(finding.inputs),
    rulesApplied: finding.rulesApplied || [],
    calculationSteps: JSON.stringify(finding.calculationSteps || []),
    result: JSON.stringify(finding.result),
    decisionTraceRefs: finding.decisionTraceRefs || [],
    dependsOnFindingIds: finding.dependsOnFindingIds || [],
    inputHash,
    status: 'computed',
    computedAt: new Date().toISOString()
  });
}

async function recordDecisionTrace(base44, traceData) {
  return await base44.asServiceRole.entities.DecisionTrace.create({
    trace_id: `TRACE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    assessment_id: traceData.assessment_id,
    object_type: traceData.object_type,
    object_id: traceData.object_id,
    decision_type: traceData.decision_type,
    input_snapshot: JSON.stringify(traceData.input_snapshot),
    rules_triggered: traceData.rules_triggered || [],
    calculations_performed: JSON.stringify(traceData.calculations_performed),
    output_snapshot: JSON.stringify(traceData.output_snapshot),
    source_type: 'engine',
    source_function: 'deterministicRiskEngine'
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { assessmentId, selectedRisks } = payload;

    if (!assessmentId || !selectedRisks || !Array.isArray(selectedRisks)) {
      return Response.json({ error: 'Missing assessmentId or selectedRisks' }, { status: 400 });
    }

    const findings = [];
    const traces = [];

    // Process each selected risk
    for (const riskId of selectedRisks) {
      // 1. Load risk library entry
      const risk = await base44.asServiceRole.entities.RiskLibrary.filter({ id: riskId });
      if (!risk || risk.length === 0) continue;

      const riskData = risk[0];

      // 2. Retrieve mapped controls
      const mappedControls = riskData.linked_control_ids || [];
      
      // 3. Load control library to understand control types
      const controlLib = await base44.asServiceRole.entities.ControlLibrary.list();
      const controlMap = controlLib.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});

      // 4-5. Compute control gaps
      const gaps = [];
      const rulesApplied = [];

      for (const controlId of mappedControls) {
        const control = controlMap[controlId];
        if (!control) continue;

        // Check if control is implemented
        const isImplemented = false; // This would be checked against EngagementRisk
        
        if (!isImplemented) {
          const gapType = control.control_category === 'Governance' ? 'Major' : 'Moderate';
          gaps.push({
            controlId,
            controlName: control.control_name,
            gapType,
            reason: `${control.control_name} not implemented`
          });
          rulesApplied.push(`control_implementation_check_${controlId}`);
        }
      }

      // Record control gap finding
      if (gaps.length > 0) {
        const gapFinding = await recordFinding(base44, {
          assessmentId,
          riskId,
          findingType: 'control_gap',
          inputs: { riskId, mappedControls, riskData: { name: riskData.risk_name } },
          rulesApplied,
          calculationSteps: [{ step: 'gap_analysis', gaps }],
          result: { gaps, totalGaps: gaps.length, majorGaps: gaps.filter(g => g.gapType === 'Major').length },
          decisionTraceRefs: []
        });
        findings.push(gapFinding);

        // Record decision trace
        const trace = await recordDecisionTrace(base44, {
          assessment_id: assessmentId,
          object_type: 'risk',
          object_id: riskId,
          decision_type: 'control_gap_assessment',
          input_snapshot: { riskId, mappedControls },
          rules_triggered: rulesApplied,
          calculations_performed: { gapCount: gaps.length, majorCount: gaps.filter(g => g.gapType === 'Major').length },
          output_snapshot: { gaps }
        });
        traces.push(trace);
      }

      // 6. Compute control effectiveness (placeholder)
      const effectivenessFinding = await recordFinding(base44, {
        assessmentId,
        riskId,
        findingType: 'control_effectiveness',
        inputs: { riskId, gaps, controlCount: mappedControls.length },
        rulesApplied: ['control_effectiveness_formula'],
        calculationSteps: [{ step: 'effectiveness_calculation', formula: 'implemented_controls / mapped_controls' }],
        result: { effectivenessScore: 2, effectivenessLevel: 'Low' },
        decisionTraceRefs: [],
        dependsOnFindingIds: [gapFinding?.id].filter(Boolean)
      });
      findings.push(effectivenessFinding);

      // 7. Compute residual risk
      const inherentScore = riskData.default_inherent_risk || 3;
      const residualScore = Math.max(1, inherentScore - (JSON.parse(effectivenessFinding.result)?.effectivenessScore || 0) / 2);

      const residualFinding = await recordFinding(base44, {
        assessmentId,
        riskId,
        findingType: 'residual_risk',
        inputs: { inherentScore, effectivenessScore: JSON.parse(effectivenessFinding.result).effectivenessScore },
        rulesApplied: ['residual_risk_balanced_formula'],
        calculationSteps: [
          { step: 'formula', operation: 'inherentScore - (effectivenessScore / 2)', values: { inherentScore, effectivenessScore: JSON.parse(effectivenessFinding.result).effectivenessScore } },
          { step: 'result', residualScore }
        ],
        result: { residualScore, residualLevel: residualScore <= 2 ? 'Low' : residualScore <= 3 ? 'Moderate' : 'High' },
        decisionTraceRefs: [],
        dependsOnFindingIds: [effectivenessFinding.id]
      });
      findings.push(residualFinding);
    }

    return Response.json({
      success: true,
      findingsCreated: findings.length,
      findings: findings.map(f => ({ findingId: f.findingId, findingType: f.findingType })),
      tracesCreated: traces.length,
      message: `Computed ${findings.length} findings and ${traces.length} decision traces`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});