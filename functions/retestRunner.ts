import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * RETEST RUNNER
 * Run structured post-remediation retest with verification and audit
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

    const retestJobId = `RETEST${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Step 1: Run conditional trigger evaluation
    await base44.entities.ProcessingJob.create({
      job_id: retestJobId,
      assessment_id,
      job_type: 'full_retest',
      status: 'running',
      progress_percent: 0,
      current_step: 'Evaluating conditional triggers',
      total_steps: 4,
      started_at: new Date().toISOString()
    });

    await base44.functions.invoke('conditionalTriggerEvaluator', { assessment_id });
    
    await base44.entities.ProcessingJob.update(retestJobId, {
      progress_percent: 25,
      current_step: 'Analyzing control gaps'
    });

    // Step 2: Run gap analysis with conditional logic
    await base44.functions.invoke('controlGapAnalysis', { assessment_id });

    await base44.entities.ProcessingJob.update(retestJobId, {
      progress_percent: 50,
      current_step: 'Running verification checks'
    });

    // Step 3: Run verification
    const verificationResult = await base44.functions.invoke('verificationRunner', { assessment_id });

    await base44.entities.ProcessingJob.update(retestJobId, {
      progress_percent: 75,
      current_step: 'Running comprehensive system audit'
    });

    // Step 4: Run fresh system audit
    const auditResult = await base44.functions.invoke('systemAudit', { assessment_id });

    // Mark job complete
    await base44.entities.ProcessingJob.update(retestJobId, {
      status: 'completed',
      progress_percent: 100,
      current_step: 'Retest complete',
      completed_at: new Date().toISOString(),
      result_summary: JSON.stringify({
        verification_status: verificationResult.data?.overall_status,
        audit_assessment: auditResult.data?.final_assessment,
        all_checks_passed: verificationResult.data?.failed_checks?.length === 0
      })
    });

    return Response.json({
      success: true,
      retest_job_id: retestJobId,
      assessment_id,
      verification_result: verificationResult.data,
      audit_result: auditResult.data,
      retest_complete: true
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});