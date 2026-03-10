import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NIGHTWATCH PROMPT CONTROLLER
 * 
 * Central router for all Nightwatch generation workflows.
 * Enforces minimal prompt discipline and partial regeneration.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task, assessment_id, options } = await req.json();

    if (!task || !assessment_id) {
      return Response.json({ 
        error: 'Missing required fields: task, assessment_id' 
      }, { status: 400 });
    }

    // Load assessment state
    const assessmentState = await base44.entities.AssessmentState.get(assessment_id);
    if (!assessmentState) {
      return Response.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Route to appropriate handler
    let result;
    switch (task) {
      case 'generateRiskNarrative':
        result = await generateRiskNarrative(base44, assessmentState, options);
        break;
      case 'generateControlAnalysis':
        result = await generateControlAnalysis(base44, assessmentState, options);
        break;
      case 'generateResidualRisk':
        result = await generateResidualRisk(base44, assessmentState, options);
        break;
      case 'assembleReport':
        result = await assembleReport(base44, assessmentState, options);
        break;
      case 'verifyAssessment':
        result = await base44.functions.invoke('verificationRunner', { assessment_id });
        break;
      case 'runSystemAudit':
        result = await base44.functions.invoke('systemAudit', { assessment_id });
        break;
      case 'mapRiskControls':
        result = await base44.functions.invoke('riskControlMappingEngine', { assessment_id });
        break;
      case 'analyzeControlGaps':
        result = await base44.functions.invoke('controlGapAnalysis', { assessment_id });
        break;
      case 'scoreControls':
        result = await base44.functions.invoke('controlScoringEngine', { assessment_id });
        break;
      default:
        return Response.json({ error: `Unknown task: ${task}` }, { status: 400 });
    }

    // Check if verification is required for this task
    const promptReg = await base44.entities.PromptRegistry.filter({ prompt_key: task });
    if (promptReg.length > 0 && promptReg[0].verification_required) {
      await base44.functions.invoke('verificationRunner', { assessment_id });
    }

    return Response.json({
      success: true,
      task,
      assessment_id,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

async function generateRiskNarrative(base44, assessmentState, options) {
  const { risk_id } = options;
  
  // Load only required libraries
  const risk = await base44.entities.NightwatchRiskLibrary.filter({ risk_id });
  const jurisdiction = await base44.entities.NightwatchJurisdictionRule.filter({ 
    jurisdiction_code: assessmentState.jurisdiction 
  });
  
  // Build minimal prompt
  const prompt = `Generate a professional AML risk narrative for:

Risk: ${risk[0]?.risk_name}
Description: ${risk[0]?.risk_description}
Client Context: ${assessmentState.client_name}
Jurisdiction: ${jurisdiction[0]?.jurisdiction_name}

Use the Context-Observations-Implication-Mitigation-Conclusion framework.`;

  const response = await base44.integrations.Core.InvokeLLM({ prompt });
  
  // Update assessment state
  const narratives = JSON.parse(assessmentState.narratives || '{}');
  narratives[risk_id] = response;
  await base44.entities.AssessmentState.update(assessmentState.id, { 
    narratives: JSON.stringify(narratives),
    last_generated_at: new Date().toISOString()
  });

  return { risk_id, narrative: response };
}

async function generateControlAnalysis(base44, assessmentState, options) {
  const { control_id } = options;
  
  const control = await base44.entities.NightwatchControlLibrary.filter({ control_id });
  
  const prompt = `Analyze control effectiveness for:

Control: ${control[0]?.control_name}
Description: ${control[0]?.control_description}
Type: ${control[0]?.control_type}
Expected Evidence: ${control[0]?.expected_evidence}

Provide analysis of design adequacy, operational effectiveness, and implementation considerations.`;

  const response = await base44.integrations.Core.InvokeLLM({ prompt });
  
  const controlAnalysis = JSON.parse(assessmentState.control_analysis || '{}');
  controlAnalysis[control_id] = response;
  await base44.entities.AssessmentState.update(assessmentState.id, { 
    control_analysis: JSON.stringify(controlAnalysis),
    last_generated_at: new Date().toISOString()
  });

  return { control_id, analysis: response };
}

async function generateResidualRisk(base44, assessmentState, options) {
  const { risk_id } = options;
  
  const scoringResult = await base44.functions.invoke('controlScoringEngine', { 
    assessment_id: assessmentState.id,
    risk_id 
  });
  
  const prompt = `Explain residual risk assessment:

Risk ID: ${risk_id}
Inherent Risk Score: ${scoringResult.data.inherent_risk_score}
Control Effectiveness: ${scoringResult.data.control_effectiveness_score}
Residual Risk Score: ${scoringResult.data.residual_risk_score}
Residual Risk Level: ${scoringResult.data.residual_risk_level}

Provide professional justification for this residual risk rating.`;

  const response = await base44.integrations.Core.InvokeLLM({ prompt });
  
  const residualNarratives = JSON.parse(assessmentState.residual_narratives || '{}');
  residualNarratives[risk_id] = response;
  await base44.entities.AssessmentState.update(assessmentState.id, { 
    residual_narratives: JSON.stringify(residualNarratives),
    last_generated_at: new Date().toISOString()
  });

  return { risk_id, residual_narrative: response };
}

async function assembleReport(base44, assessmentState, options) {
  // Assemble report from existing sections without regeneration
  const narratives = JSON.parse(assessmentState.narratives || '{}');
  const controlAnalysis = JSON.parse(assessmentState.control_analysis || '{}');
  const residualNarratives = JSON.parse(assessmentState.residual_narratives || '{}');
  const gaps = JSON.parse(assessmentState.identified_gaps || '[]');
  
  const reportSections = {
    executive_summary: `AML Risk Assessment for ${assessmentState.client_name}`,
    risk_narratives: narratives,
    control_analysis: controlAnalysis,
    residual_risk_analysis: residualNarratives,
    control_gaps: gaps,
    recommendations: JSON.parse(assessmentState.recommendations || '[]'),
    assembled_at: new Date().toISOString()
  };
  
  await base44.entities.AssessmentState.update(assessmentState.id, {
    report_sections: JSON.stringify(reportSections),
    report_status: 'Draft'
  });
  
  return { report_sections: reportSections };
}