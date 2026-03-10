import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function generateHash(inputs) {
  const str = JSON.stringify(inputs);
  return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str))).slice(0, 16);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { assessmentId, riskId, gaps = [], jurisdiction = '' } = payload;

    if (!assessmentId || !riskId) {
      return Response.json({ error: 'Missing assessmentId or riskId' }, { status: 400 });
    }

    const recommendations = [];

    // For each gap, determine remediation
    for (const gap of gaps) {
      // Load control library
      const controls = await base44.asServiceRole.entities.ControlLibrary.list();
      
      // Match control type to remediation recommendations
      let remediationPriority = 'Medium';
      if (gap.gapType === 'Major') remediationPriority = 'High';
      if (gap.gapType === 'Moderate') remediationPriority = 'Medium';

      recommendations.push({
        gapId: gap.controlId,
        remediationControl: gap.controlName,
        remediationPriority,
        jurisdictionRelevance: jurisdiction || 'Global',
        estimatedEffort: 'Medium',
        expectedEffectivenessImprovement: remediationPriority === 'High' ? 2 : 1
      });
    }

    const inputs = { riskId, gaps, jurisdiction };
    const inputHash = generateHash(inputs);

    const findingId = `FIND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await base44.asServiceRole.entities.AssessmentFinding.create({
      findingId,
      assessmentId,
      riskId,
      findingType: 'recommendation_candidate',
      inputs: JSON.stringify(inputs),
      rulesApplied: ['gap_to_recommendation_mapping'],
      calculationSteps: JSON.stringify([
        { step: 'gap_analysis', gapCount: gaps.length },
        { step: 'priority_assignment', priorities: recommendations.map(r => ({ gap: r.gapId, priority: r.remediationPriority })) }
      ]),
      result: JSON.stringify({ recommendations, totalRecommendations: recommendations.length }),
      inputHash,
      status: 'computed',
      computedAt: new Date().toISOString()
    });

    return Response.json({
      success: true,
      recommendations,
      totalRecommendations: recommendations.length,
      highPriorityCount: recommendations.filter(r => r.remediationPriority === 'High').length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});