import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * CONDITIONAL TRIGGER EVALUATOR
 * Evaluates conditional control requirements based on assessment facts
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
    const controlMappings = JSON.parse(assessmentState.control_mappings || '{}');
    const jurisdiction = assessmentState.jurisdiction;
    
    const triggerResults = {};
    
    // Evaluate conditional controls for each risk
    for (const riskId of selectedRisks) {
      const riskMapping = controlMappings[riskId];
      if (!riskMapping || !riskMapping.conditional || riskMapping.conditional.length === 0) continue;
      
      triggerResults[riskId] = {
        triggered_conditionals: [],
        not_triggered_conditionals: []
      };
      
      for (const conditionalControl of riskMapping.conditional) {
        // Simple trigger evaluation logic
        // In production, this would evaluate complex conditional expressions
        const triggered = evaluateConditionalTrigger(conditionalControl, assessmentState, jurisdiction);
        
        if (triggered) {
          triggerResults[riskId].triggered_conditionals.push({
            control_id: conditionalControl.control_id,
            control_name: conditionalControl.control_name,
            trigger_reason: conditionalControl.conditional_trigger || 'Default trigger'
          });
          
          // Log decision trace
          await base44.entities.DecisionTrace.create({
            assessment_id,
            object_type: 'control',
            object_id: conditionalControl.control_id,
            decision_type: 'conditional_trigger_activated',
            source_type: 'system',
            source_function: 'conditionalTriggerEvaluator',
            rules_triggered: [conditionalControl.conditional_trigger || 'Default'],
            output_snapshot: JSON.stringify({ triggered: true, reason: 'Trigger conditions met' })
          });
        } else {
          triggerResults[riskId].not_triggered_conditionals.push({
            control_id: conditionalControl.control_id,
            control_name: conditionalControl.control_name
          });
        }
      }
    }
    
    // Update assessment state with trigger results
    await base44.entities.AssessmentState.update(assessment_id, {
      conditional_trigger_results: JSON.stringify(triggerResults),
      last_generated_at: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      assessment_id,
      trigger_results: triggerResults,
      total_triggered: Object.values(triggerResults).reduce((sum, r) => sum + r.triggered_conditionals.length, 0)
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

function evaluateConditionalTrigger(conditionalControl, assessmentState, jurisdiction) {
  // Simple evaluation logic
  // Check for triggering factors in assessment state
  
  const trigger = conditionalControl.conditional_trigger || '';
  
  // Example triggers
  if (trigger.includes('high_risk_jurisdiction')) {
    return ['CAN', 'USA', 'EU'].includes(jurisdiction);
  }
  
  if (trigger.includes('private_banking')) {
    const products = JSON.parse(assessmentState.products_services || '[]');
    return products.some(p => p.includes('private') || p.includes('banking'));
  }
  
  if (trigger.includes('pep')) {
    const customerTypes = JSON.parse(assessmentState.customer_types || '[]');
    return customerTypes.some(c => c.includes('PEP') || c.includes('high-net-worth'));
  }
  
  // Default: trigger if condition exists
  return !!trigger;
}