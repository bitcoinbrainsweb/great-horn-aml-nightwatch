import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NIGHTWATCH CONTROL GAP ANALYSIS
 * 
 * Identifies control gaps based on:
 * - Missing baseline controls = Major Gap
 * - Missing enhanced controls = Moderate Gap
 * - Missing triggered conditional controls = Major Gap
 * - Compensating controls may reduce severity
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

    const controlMappings = JSON.parse(assessmentState.control_mappings || '{}');
    const selectedControls = JSON.parse(assessmentState.selected_controls || '[]');
    const controlImplementations = JSON.parse(assessmentState.control_implementations || '{}');
    
    const gaps = [];
    
    for (const [riskId, mapping] of Object.entries(controlMappings)) {
      // Check baseline controls
      for (const baselineControl of mapping.baseline) {
        const implemented = selectedControls.includes(baselineControl.control_id);
        const hasCompensating = mapping.compensating.some(c => 
          c.compensates_for === baselineControl.control_id && 
          selectedControls.includes(c.control_id)
        );
        
        if (!implemented && !hasCompensating) {
          gaps.push({
            gap_level: 'Major',
            gap_type: 'Missing Baseline Control',
            risk_id: riskId,
            control_id: baselineControl.control_id,
            control_name: baselineControl.control_name,
            description: `Baseline control "${baselineControl.control_name}" is not implemented for risk ${riskId}.`,
            recommended_controls: [baselineControl.control_id],
            severity_score: 8
          });
        } else if (!implemented && hasCompensating) {
          gaps.push({
            gap_level: 'Moderate',
            gap_type: 'Baseline Control Compensated',
            risk_id: riskId,
            control_id: baselineControl.control_id,
            control_name: baselineControl.control_name,
            description: `Baseline control "${baselineControl.control_name}" is compensated but not directly implemented.`,
            recommended_controls: [baselineControl.control_id],
            severity_score: 5
          });
        }
      }
      
      // Check enhanced controls
      for (const enhancedControl of mapping.enhanced) {
        const implemented = selectedControls.includes(enhancedControl.control_id);
        
        if (!implemented) {
          gaps.push({
            gap_level: 'Moderate',
            gap_type: 'Missing Enhanced Control',
            risk_id: riskId,
            control_id: enhancedControl.control_id,
            control_name: enhancedControl.control_name,
            description: `Enhanced control "${enhancedControl.control_name}" is recommended but not implemented.`,
            recommended_controls: [enhancedControl.control_id],
            severity_score: 4
          });
        }
      }
      
      // Check conditional controls (simplified - would need trigger evaluation logic)
      for (const conditionalControl of mapping.conditional) {
        const implemented = selectedControls.includes(conditionalControl.control_id);
        
        if (!implemented) {
          gaps.push({
            gap_level: 'Minor',
            gap_type: 'Conditional Control Not Evaluated',
            risk_id: riskId,
            control_id: conditionalControl.control_id,
            control_name: conditionalControl.control_name,
            description: `Conditional control "${conditionalControl.control_name}" may be required based on specific conditions.`,
            recommended_controls: [conditionalControl.control_id],
            severity_score: 3
          });
        }
      }
    }
    
    // Sort gaps by severity
    gaps.sort((a, b) => b.severity_score - a.severity_score);
    
    // Calculate gap summary
    const gapSummary = {
      total_gaps: gaps.length,
      major_gaps: gaps.filter(g => g.gap_level === 'Major').length,
      moderate_gaps: gaps.filter(g => g.gap_level === 'Moderate').length,
      minor_gaps: gaps.filter(g => g.gap_level === 'Minor').length,
      critical_gaps: gaps.filter(g => g.gap_level === 'Critical').length
    };
    
    // Update assessment state
    await base44.entities.AssessmentState.update(assessment_id, {
      identified_gaps: JSON.stringify(gaps),
      gap_summary: JSON.stringify(gapSummary),
      last_generated_at: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      assessment_id,
      gaps,
      gap_summary
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});