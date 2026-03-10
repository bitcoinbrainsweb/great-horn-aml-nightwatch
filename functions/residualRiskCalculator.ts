import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import crypto from 'crypto';

function generateHash(inputs) {
  return crypto.createHash('sha256').update(JSON.stringify(inputs)).digest('hex').slice(0, 16);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { assessmentId, riskId, inherentRiskScore, controlEffectivenessScore } = payload;

    if (!assessmentId || !riskId || inherentRiskScore === undefined || controlEffectivenessScore === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load scoring config (default to Balanced)
    const configs = await base44.asServiceRole.entities.NightwatchScoringConfig.filter({ is_default: true });
    const config = configs && configs.length > 0 ? configs[0] : null;

    // Apply Balanced formula: InherentRisk - (ControlEffectiveness / 2)
    const residualRiskScore = Math.max(1, inherentRiskScore - (controlEffectivenessScore / 2));

    // Determine risk level
    const thresholds = config && config.risk_level_thresholds 
      ? JSON.parse(config.risk_level_thresholds)
      : { low: 2, moderate: 3, high: 4, critical: 5 };

    let residualRiskLevel = 'Not Rated';
    if (residualRiskScore <= thresholds.low) residualRiskLevel = 'Low';
    else if (residualRiskScore <= thresholds.moderate) residualRiskLevel = 'Moderate';
    else if (residualRiskScore <= thresholds.high) residualRiskLevel = 'High';
    else residualRiskLevel = 'Critical';

    const inputs = { riskId, inherentRiskScore, controlEffectivenessScore };
    const inputHash = generateHash(inputs);

    const findingId = `FIND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await base44.asServiceRole.entities.AssessmentFinding.create({
      findingId,
      assessmentId,
      riskId,
      findingType: 'residual_risk',
      inputs: JSON.stringify(inputs),
      rulesApplied: ['balanced_residual_formula'],
      calculationSteps: JSON.stringify([
        { step: 'formula', operation: 'inherentRisk - (controlEffectiveness / 2)', values: { inherentRiskScore, controlEffectivenessScore } },
        { step: 'result', residualScore: residualRiskScore }
      ]),
      result: JSON.stringify({ residualRiskScore, residualRiskLevel }),
      inputHash,
      status: 'computed',
      computedAt: new Date().toISOString()
    });

    return Response.json({
      success: true,
      residualRiskScore,
      residualRiskLevel,
      formula: 'InherentRisk - (ControlEffectiveness / 2)',
      calculation: `${inherentRiskScore} - (${controlEffectivenessScore} / 2) = ${residualRiskScore}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});