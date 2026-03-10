import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NIGHTWATCH CONTROL GAP ANALYSIS
 * 
 * Identifies control gaps based on:
 * - Missing baseline controls = Major Gap
 * - Missing enhanced controls = Moderate Gap
 * - Missing triggered conditional controls = Major Gap
 * - Compensating controls may reduce severity
 * 
 * Now integrates conditional trigger evaluation and decision tracing
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
    const conditionalTriggerResults = JSON.parse(assessmentState.conditional_trigger_results || '{}');
    
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
          const gap = {
            gap_level: 'Major',
            gap_type: 'Missing Baseline Control',
            risk_id: riskId,
            control_id: baselineControl.control_id,
            control_name: baselineControl.control_name,
            description: `Baseline control "${baselineControl.control_name}" is not implemented for risk ${riskId}.`,
            recommended_controls: [baselineControl.control_id],
            severity_score: 8
          };
          gaps.push(gap);
          
          // Log decision trace
          await base44.entities.DecisionTrace.create({
            assessment_id,
            object_type: 'gap',
            object_id: `${riskId}-${baselineControl.control_id}`,
            decision_type: 'gap_severity',
            source_type: 'engine',
            source_function: 'controlGapAnalysis',
            rules_triggered: ['missing_baseline_control', 'no_compensating_control'],
            output_snapshot: JSON.stringify(gap)
          });
        }
      }
      
      // Check enhanced controls
      for (const enhancedControl of mapping.enhanced) {
        const implemented = selectedControls.includes(enhancedControl.control_id);
        
        if (!implemented) {
          const gap = {
            gap_level: 'Moderate',
            gap_type: 'Missing Enhanced Control',
            risk_id: riskId,
            control_id: enhancedControl.control_id,
            control_name: enhancedControl.control_name,
            description: `Enhanced control "${enhancedControl.control_name}" is recommended but not implemented.`,
            recommended_controls: [enhancedControl.control_id],
            severity_score: 4
          };
          gaps.push(gap);
        }
      }
      
      // Check triggered conditional controls
      const triggeredConditionals = conditionalTriggerResults[riskId]?.triggered_conditionals || [];
      for (const triggered of triggeredConditionals) {
        const implemented = selectedControls.includes(triggered.control_id);
        
        if (!implemented) {
          const gap = {
            gap_level: 'Major',
            gap_type: 'Missing Triggered Conditional Control',
            risk_id: riskId,
            control_id: triggered.control_id,
            control_name: triggered.control_name,
            description: `Triggered conditional control "${triggered.control_name}" is required but not implemented.`,
            trigger_reason: triggered.trigger_reason,
            recommended_controls: [triggered.control_id],
            severity_score: 8
          };
          gaps.push(gap);
          
          // Log decision trace
          await base44.entities.DecisionTrace.create({
            assessment_id,
            object_type: 'gap',
            object_id: `${riskId}-${triggered.control_id}`,
            decision_type: 'gap_severity',
            source_type: 'engine',
            source_function: 'controlGapAnalysis',
            rules_triggered: ['conditional_control_triggered', 'not_implemented'],
            output_snapshot: JSON.stringify(gap)
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