import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * PARALLEL RISK PROCESSOR
 * Process multiple risks in parallel chunks for performance
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessment_id, task, chunk_size = 5 } = await req.json();
    
    const assessmentState = await base44.entities.AssessmentState.get(assessment_id);
    if (!assessmentState) {
      return Response.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const selectedRisks = JSON.parse(assessmentState.selected_risks || '[]');
    const totalRisks = selectedRisks.length;
    
    // Create processing job
    const jobId = `JOB${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    await base44.entities.ProcessingJob.create({
      job_id: jobId,
      assessment_id,
      job_type: task,
      status: 'running',
      progress_percent: 0,
      total_steps: Math.ceil(totalRisks / chunk_size),
      started_at: new Date().toISOString()
    });

    const results = {};
    const processedRisks = [];
    
    // Process in chunks
    for (let i = 0; i < selectedRisks.length; i += chunk_size) {
      const chunk = selectedRisks.slice(i, i + chunk_size);
      const chunkIndex = Math.floor(i / chunk_size);
      const progressPercent = Math.round(((chunkIndex + 1) / Math.ceil(totalRisks / chunk_size)) * 100);
      
      // Update job progress
      await base44.entities.ProcessingJob.update(jobId, {
        progress_percent: progressPercent,
        current_step: `Processing chunk ${chunkIndex + 1} of ${Math.ceil(totalRisks / chunk_size)} (${chunk.length} risks)`
      });

      // Process chunk in parallel
      const chunkResults = await Promise.all(chunk.map(riskId => processRisk(base44, assessment_id, riskId, task)));
      
      for (let j = 0; j < chunk.length; j++) {
        results[chunk[j]] = chunkResults[j];
        processedRisks.push(chunk[j]);
      }
    }

    // Mark job complete
    await base44.entities.ProcessingJob.update(jobId, {
      status: 'completed',
      progress_percent: 100,
      current_step: `Completed processing all ${selectedRisks.length} risks`,
      completed_at: new Date().toISOString(),
      result_summary: JSON.stringify({ risks_processed: processedRisks.length, task })
    });

    return Response.json({
      success: true,
      job_id: jobId,
      assessment_id,
      risks_processed: processedRisks.length,
      results
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

async function processRisk(base44, assessmentId, riskId, task) {
  try {
    // Route to appropriate task
    switch (task) {
      case 'regenerate_risks':
        return await base44.functions.invoke('promptController', {
          task: 'generateRiskNarrative',
          assessment_id: assessmentId,
          options: { risk_id: riskId }
        });
      case 'score_controls':
        return await base44.functions.invoke('controlScoringEngine', {
          assessment_id: assessmentId,
          risk_id: riskId
        });
      default:
        return { success: false, error: 'Unknown task' };
    }
  } catch (error) {
    return { success: false, error: error.message, risk_id: riskId };
  }
}