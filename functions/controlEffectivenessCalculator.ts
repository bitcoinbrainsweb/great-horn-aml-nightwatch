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
    const { assessmentId, riskId, implementedControls = [], controlGaps = [], compensatingControls = [] } = payload;

    if (!assessmentId || !riskId) {
      return Response.json({ error: 'Missing assessmentId or riskId' }, { status: 400 });
    }

    // Load the risk to get mapped controls
    const risks = await base44.asServiceRole.entities.RiskLibrary.filter({ id: riskId });
    if (!risks || risks.length === 0) {
      return Response.json({ error: 'Risk not found' }, { status: 404 });
    }

    const totalMappedControls = risks[0].linked_control_ids?.length || 0;
    const implementedCount = implementedControls.length;
    const gapCount = controlGaps.length;
    const compensatingCount = compensatingControls.length;

    // Calculate effectiveness
    // Formula: (implemented + compensating*0.5) / total
    const effectivenessFraction = (implementedCount + compensatingCount * 0.5) / Math.max(1, totalMappedControls);
    const effectivenessScore = Math.round(effectivenessFraction * 5); // Scale to 1-5

    const effectivenessLevel = effectivenessScore <= 1 ? 'None' :
                               effectivenessScore <= 2 ? 'Low' :
                               effectivenessScore <= 3 ? 'Moderate' :
                               effectivenessScore <= 4 ? 'High' : 'Very High';

    const inputs = { riskId, implementedControls, controlGaps, compensatingControls, totalMappedControls };
    const inputHash = generateHash(inputs);

    // Store as finding
    const findingId = `FIND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await base44.asServiceRole.entities.AssessmentFinding.create({
      findingId,
      assessmentId,
      riskId,
      findingType: 'control_effectiveness',
      inputs: JSON.stringify(inputs),
      rulesApplied: ['effectiveness_fraction_formula'],
      calculationSteps: JSON.stringify([
        { step: 'count_controls', implementedCount, compensatingCount, totalMappedControls },
        { step: 'calculate_fraction', fraction: effectivenessFraction },
        { step: 'scale_to_1_5', score: effectivenessScore }
      ]),
      result: JSON.stringify({ effectivenessScore, effectivenessLevel, implementedCount, gapCount, compensatingCount }),
      inputHash,
      status: 'computed',
      computedAt: new Date().toISOString()
    });

    return Response.json({
      success: true,
      effectivenessScore,
      effectivenessLevel,
      breakdown: {
        implementedCount,
        gapCount,
        compensatingCount,
        totalMappedControls
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});