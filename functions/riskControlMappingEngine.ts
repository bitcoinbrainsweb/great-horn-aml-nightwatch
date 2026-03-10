import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NIGHTWATCH RISK-CONTROL MAPPING ENGINE
 * 
 * Maps selected risks to baseline, enhanced, conditional, and compensating controls.
 * Uses RiskControlMapping entity for structured mappings.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessment_id } = await req.json();
    
    const assessmentState = await base44.entities.AssessmentState.get(assessment_id);
    if (!assessmentState) {
      return Response.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const selectedRisks = JSON.parse(assessmentState.selected_risks || '[]');
    const jurisdiction = assessmentState.jurisdiction;
    
    // Build control mappings for each selected risk
    const controlMappings = {};
    
    for (const riskId of selectedRisks) {
      // Get all mappings for this risk
      const mappings = await base44.entities.RiskControlMapping.filter({ 
        risk_id: riskId,
        active: true 
      });
      
      // Classify by type
      const baseline = [];
      const enhanced = [];
      const conditional = [];
      const compensating = [];
      
      for (const mapping of mappings) {
        const control = await base44.entities.NightwatchControlLibrary.filter({ 
          control_id: mapping.control_id 
        });
        
        if (control.length === 0) continue;
        
        const controlData = {
          control_id: mapping.control_id,
          control_name: control[0].control_name,
          mapping_type: mapping.mapping_type,
          required: mapping.required_flag,
          relevance_score: mapping.relevance_score
        };
        
        switch (mapping.mapping_type) {
          case 'Baseline':
            baseline.push(controlData);
            break;
          case 'Enhanced':
            enhanced.push(controlData);
            break;
          case 'Conditional':
            conditional.push(controlData);
            break;
          case 'Compensating':
            compensating.push(controlData);
            break;
        }
      }
      
      controlMappings[riskId] = {
        baseline,
        enhanced,
        conditional,
        compensating,
        total_controls: baseline.length + enhanced.length + conditional.length + compensating.length
      };
    }
    
    // Update assessment state
    await base44.entities.AssessmentState.update(assessment_id, {
      control_mappings: JSON.stringify(controlMappings),
      last_generated_at: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      assessment_id,
      control_mappings,
      total_risks_mapped: selectedRisks.length
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});