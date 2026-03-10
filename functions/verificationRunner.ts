import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NIGHTWATCH VERIFICATION RUNNER
 * 
 * Runs structured verification checks on assessment state and generates VerificationReport.
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

    const checksRun = [];
    const passedChecks = [];
    const failedChecks = [];
    const warnings = [];
    const logicalErrors = [];
    const missingData = [];
    const recommendedFixes = [];
    
    // CHECK 1: All risks mapped to controls
    checksRun.push('Risk-Control Mapping Completeness');
    const selectedRisks = JSON.parse(assessmentState.selected_risks || '[]');
    const controlMappings = JSON.parse(assessmentState.control_mappings || '{}');
    
    let unmappedRisks = 0;
    for (const riskId of selectedRisks) {
      if (!controlMappings[riskId] || controlMappings[riskId].total_controls === 0) {
        unmappedRisks++;
        logicalErrors.push(`Risk ${riskId} has no control mappings`);
        recommendedFixes.push(`Run risk-control mapping engine for risk ${riskId}`);
      }
    }
    
    if (unmappedRisks === 0) {
      passedChecks.push('Risk-Control Mapping Completeness');
    } else {
      failedChecks.push('Risk-Control Mapping Completeness');
    }
    
    // CHECK 2: Required baseline controls implemented or flagged
    checksRun.push('Baseline Control Coverage');
    const selectedControls = JSON.parse(assessmentState.selected_controls || '[]');
    const gaps = JSON.parse(assessmentState.identified_gaps || '[]');
    const majorGaps = gaps.filter(g => g.gap_level === 'Major' && g.gap_type === 'Missing Baseline Control');
    
    if (majorGaps.length === 0) {
      passedChecks.push('Baseline Control Coverage');
    } else {
      failedChecks.push('Baseline Control Coverage');
      for (const gap of majorGaps) {
        logicalErrors.push(`Missing baseline control: ${gap.control_name} for risk ${gap.risk_id}`);
        recommendedFixes.push(`Implement or justify absence of control ${gap.control_id}`);
      }
    }
    
    // CHECK 3: Residual risk scores consistent
    checksRun.push('Residual Risk Score Consistency');
    const inherentRiskScores = JSON.parse(assessmentState.inherent_risk_scores || '{}');
    const controlEffectivenessScores = JSON.parse(assessmentState.control_effectiveness_scores || '{}');
    const residualRiskScores = JSON.parse(assessmentState.residual_risk_scores || '{}');
    
    let scoreInconsistencies = 0;
    for (const riskId of selectedRisks) {
      const inherent = inherentRiskScores[riskId];
      const controlEff = controlEffectivenessScores[riskId];
      const residual = residualRiskScores[riskId];
      
      if (inherent && controlEff && residual) {
        const expectedResidual = inherent - (controlEff / 2);
        const difference = Math.abs(residual - expectedResidual);
        
        if (difference > 0.5) {
          scoreInconsistencies++;
          logicalErrors.push(`Risk ${riskId}: Residual score ${residual} differs from calculated ${expectedResidual.toFixed(2)} by ${difference.toFixed(2)}`);
          recommendedFixes.push(`Recalculate residual risk for ${riskId}`);
        }
      }
    }
    
    if (scoreInconsistencies === 0) {
      passedChecks.push('Residual Risk Score Consistency');
    } else {
      failedChecks.push('Residual Risk Score Consistency');
    }
    
    // CHECK 4: Narratives generated for all risks
    checksRun.push('Risk Narrative Completeness');
    const narratives = JSON.parse(assessmentState.narratives || '{}');
    
    let missingNarratives = 0;
    for (const riskId of selectedRisks) {
      if (!narratives[riskId]) {
        missingNarratives++;
        missingData.push(`Missing narrative for risk ${riskId}`);
        recommendedFixes.push(`Generate narrative for risk ${riskId}`);
      }
    }
    
    if (missingNarratives === 0) {
      passedChecks.push('Risk Narrative Completeness');
    } else if (missingNarratives / selectedRisks.length < 0.2) {
      passedChecks.push('Risk Narrative Completeness');
      warnings.push(`${missingNarratives} risks missing narratives (less than 20%)`);
    } else {
      failedChecks.push('Risk Narrative Completeness');
    }
    
    // CHECK 5: Required data fields present
    checksRun.push('Required Data Fields');
    if (!assessmentState.client_name) {
      missingData.push('Missing client_name');
      failedChecks.push('Required Data Fields');
    } else if (!assessmentState.jurisdiction) {
      missingData.push('Missing jurisdiction');
      failedChecks.push('Required Data Fields');
    } else {
      passedChecks.push('Required Data Fields');
    }
    
    // Determine overall status
    let overallStatus = 'Pass';
    if (failedChecks.length > 0) {
      overallStatus = 'Fail';
    } else if (warnings.length > 0) {
      overallStatus = 'Warn';
    }
    
    // Generate report ID
    const reportId = `V${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Create verification report
    const verificationReport = await base44.entities.VerificationReport.create({
      assessment_id,
      verification_run_at: new Date().toISOString(),
      checks_run: checksRun,
      passed_checks: passedChecks,
      failed_checks: failedChecks,
      warnings,
      logical_errors: JSON.stringify(logicalErrors),
      missing_data: JSON.stringify(missingData),
      recommended_fixes: JSON.stringify(recommendedFixes),
      overall_status: overallStatus,
      report_id: reportId
    });
    
    // Update assessment state
    await base44.entities.AssessmentState.update(assessment_id, {
      verification_status: overallStatus,
      last_verification_date: new Date().toISOString()
    });
    
    return Response.json({
      success: true,
      report_id: reportId,
      overall_status: overallStatus,
      summary: {
        total_checks: checksRun.length,
        passed: passedChecks.length,
        failed: failedChecks.length,
        warnings: warnings.length
      },
      checks_run: checksRun,
      passed_checks: passedChecks,
      failed_checks: failedChecks,
      warnings,
      logical_errors: logicalErrors,
      missing_data: missingData,
      recommended_fixes: recommendedFixes
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});