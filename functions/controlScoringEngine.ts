import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NIGHTWATCH CONTROL SCORING ENGINE
 * 
 * Calculates control effectiveness and residual risk scores.
 * Configurable via ScoringConfig entity.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessment_id, risk_id } = await req.json();
    
    const assessmentState = await base44.entities.AssessmentState.get(assessment_id);
    if (!assessmentState) {
      return Response.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Load scoring configuration
    const scoringConfigs = await base44.entities.NightwatchScoringConfig.filter({ active: true });
    const config = scoringConfigs.find(c => c.is_default) || scoringConfigs[0];
    
    if (!config) {
      return Response.json({ error: 'No active scoring configuration found' }, { status: 404 });
    }

    const controlWeights = JSON.parse(config.control_weights || '{"Baseline": 1.0, "Enhanced": 0.75, "Conditional": 1.0, "Compensating": 0.5}');
    const gapPenalties = JSON.parse(config.gap_penalties || '{"MissingBaseline": -1.0, "MissingEnhanced": -0.5, "MissingConditional": -1.0}');
    const levelThresholds = JSON.parse(config.risk_level_thresholds || '{"Low": [1.0, 1.9], "Medium": [2.0, 2.9], "High": [3.0, 3.9], "Critical": [4.0, 5.0]}');
    
    // Get risk-specific data
    const inherentRiskScores = JSON.parse(assessmentState.inherent_risk_scores || '{}');
    const inherentScore = inherentRiskScores[risk_id] || 3; // Default to moderate
    
    const controlMappings = JSON.parse(assessmentState.control_mappings || '{}');
    const riskMapping = controlMappings[risk_id] || { baseline: [], enhanced: [], conditional: [], compensating: [] };
    
    const selectedControls = JSON.parse(assessmentState.selected_controls || '[]');
    const controlImplementations = JSON.parse(assessmentState.control_implementations || '{}');
    
    // Calculate control effectiveness score
    let totalWeight = 0;
    let weightedEffectiveness = 0;
    let penalties = 0;
    
    // Process baseline controls
    for (const control of riskMapping.baseline) {
      const implemented = selectedControls.includes(control.control_id);
      const strength = controlImplementations[control.control_id]?.implementation_strength || 0;
      
      if (implemented && strength > 0) {
        totalWeight += controlWeights.Baseline;
        weightedEffectiveness += strength * controlWeights.Baseline;
      } else {
        penalties += gapPenalties.MissingBaseline;
      }
    }
    
    // Process enhanced controls
    for (const control of riskMapping.enhanced) {
      const implemented = selectedControls.includes(control.control_id);
      const strength = controlImplementations[control.control_id]?.implementation_strength || 0;
      
      if (implemented && strength > 0) {
        totalWeight += controlWeights.Enhanced;
        weightedEffectiveness += strength * controlWeights.Enhanced;
      } else {
        penalties += gapPenalties.MissingEnhanced;
      }
    }
    
    // Calculate raw control effectiveness
    const rawControlEffectiveness = totalWeight > 0 ? weightedEffectiveness / totalWeight : 0;
    
    // Apply penalties and floor/ceiling
    const controlEffectivenessScore = Math.max(1, Math.min(5, rawControlEffectiveness + penalties));
    
    // Calculate residual risk using formula from config
    // Default: InherentRiskScore - (ControlEffectivenessScore / 2)
    const residualRiskScore = Math.max(1, Math.min(5, 
      inherentScore - (controlEffectivenessScore / 2)
    ));
    
    // Map to risk level
    let residualRiskLevel = 'Medium';
    for (const [level, [min, max]] of Object.entries(levelThresholds)) {
      if (residualRiskScore >= min && residualRiskScore <= max) {
        residualRiskLevel = level;
        break;
      }
    }
    
    // Store results in assessment state
    const residualRiskScores = JSON.parse(assessmentState.residual_risk_scores || '{}');
    const residualRiskLevels = JSON.parse(assessmentState.residual_risk_levels || '{}');
    const controlEffectivenessScores = JSON.parse(assessmentState.control_effectiveness_scores || '{}');
    
    residualRiskScores[risk_id] = residualRiskScore;
    residualRiskLevels[risk_id] = residualRiskLevel;
    controlEffectivenessScores[risk_id] = controlEffectivenessScore;
    
    await base44.entities.AssessmentState.update(assessment_id, {
      residual_risk_scores: JSON.stringify(residualRiskScores),
      residual_risk_levels: JSON.stringify(residualRiskLevels),
      control_effectiveness_scores: JSON.stringify(controlEffectivenessScores),
      last_generated_at: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      risk_id,
      inherent_risk_score: inherentScore,
      control_effectiveness_score: controlEffectivenessScore,
      residual_risk_score: residualRiskScore,
      residual_risk_level: residualRiskLevel,
      calculation_details: {
        total_weight: totalWeight,
        weighted_effectiveness: weightedEffectiveness,
        penalties_applied: penalties,
        raw_control_effectiveness: rawControlEffectiveness
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});