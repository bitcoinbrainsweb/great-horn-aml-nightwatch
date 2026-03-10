import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { controlId, assessmentId } = payload;

    if (!controlId || !assessmentId) {
      return Response.json({ error: 'controlId and assessmentId required' }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all evidence for this control
    const evidence = await base44.asServiceRole.entities.ControlEvidence.filter({
      controlId,
      assessmentId
    });

    // Fetch all tests for this control
    const tests = await base44.asServiceRole.entities.ControlTest.filter({
      controlId,
      assessmentId
    });

    // Calculate evidence completeness
    const evidenceMetrics = calculateEvidenceMetrics(evidence || []);
    
    // Calculate testing impact
    const testingMetrics = calculateTestingMetrics(tests || []);

    // Determine overall sufficiency
    const evidenceSufficiency = determineEvidenceSufficiency(evidenceMetrics, testingMetrics);

    // Calculate combined confidence
    const combinedConfidence = calculateCombinedConfidence(evidenceMetrics, testingMetrics);

    // Generate summary
    const summary = generateSummary(evidenceMetrics, testingMetrics, evidenceSufficiency);

    // Create assessment record
    const assessmentRecord = {
      assessmentRecordId: `CEA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      controlId,
      assessmentId,
      evidenceSufficiency,
      evidenceCompletenessScore: evidenceMetrics.completenessScore,
      stalenessImpact: evidenceMetrics.stalenessImpact,
      testingImpact: testingMetrics.overallTestingImpact,
      combinedControlConfidence: combinedConfidence,
      summary,
      calculatedAt: new Date().toISOString(),
      linkedEvidenceIds: (evidence || []).map(e => e.id),
      linkedTestIds: (tests || []).map(t => t.id),
      linkedFindingIds: []
    };

    // Create DecisionTrace for audit trail
    const decisionTrace = {
      traceId: assessmentRecord.assessmentRecordId,
      entityType: 'ControlEvidenceAssessment',
      entityId: assessmentRecord.assessmentRecordId,
      ruleApplied: 'ControlEvidenceEvaluator',
      inputs: {
        evidenceCount: (evidence || []).length,
        approvedEvidenceCount: (evidence || []).filter(e => e.reviewStatus === 'approved').length,
        staleEvidenceCount: (evidence || []).filter(e => e.staleFlag).length,
        testCount: (tests || []).length,
        effectiveTestCount: (tests || []).filter(t => t.testResult === 'effective').length
      },
      calculation: {
        evidenceCompletenessScore: evidenceMetrics.completenessScore,
        stalenessImpact: evidenceMetrics.stalenessImpact,
        testingImpact: testingMetrics.overallTestingImpact,
        combinedConfidence
      },
      result: evidenceSufficiency,
      timestamp: new Date().toISOString(),
      executionTime: 'computed'
    };

    // Save assessment and trace
    const savedAssessment = await base44.asServiceRole.entities.ControlEvidenceAssessment.create(assessmentRecord);
    await base44.asServiceRole.entities.DecisionTrace.create(decisionTrace);

    return Response.json({
      success: true,
      assessmentId: savedAssessment.id,
      assessmentRecord: savedAssessment,
      decisionTrace
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateEvidenceMetrics(evidence) {
  if (!evidence || evidence.length === 0) {
    return {
      completenessScore: 0,
      stalenessImpact: 100,
      approvedCount: 0,
      rejectedCount: 0,
      staleCount: 0
    };
  }

  const approved = evidence.filter(e => e.reviewStatus === 'approved').length;
  const rejected = evidence.filter(e => e.reviewStatus === 'rejected').length;
  const stale = evidence.filter(e => e.staleFlag).length;
  const expired = evidence.filter(e => e.reviewStatus === 'expired').length;

  // Completeness: percentage of approved evidence relative to total
  const completenessScore = Math.round((approved / evidence.length) * 100);

  // Staleness impact: if many pieces are stale/expired, increase impact
  const stalenessRatio = (stale + expired) / evidence.length;
  const stalenessImpact = Math.round(stalenessRatio * 100);

  return {
    completenessScore,
    stalenessImpact,
    approvedCount: approved,
    rejectedCount: rejected,
    staleCount: stale,
    expiredCount: expired,
    totalCount: evidence.length
  };
}

function calculateTestingMetrics(tests) {
  if (!tests || tests.length === 0) {
    return {
      overallTestingImpact: 50, // No testing is a moderate concern
      effectiveTests: 0,
      ineffectiveTests: 0,
      overdueCounts: 0
    };
  }

  const effective = tests.filter(t => t.testResult === 'effective').length;
  const partiallyEffective = tests.filter(t => t.testResult === 'partially_effective').length;
  const ineffective = tests.filter(t => t.testResult === 'ineffective').length;
  
  // Check for overdue tests (next review date in past)
  const today = new Date();
  const overdue = tests.filter(t => {
    if (t.nextReviewDate) {
      return new Date(t.nextReviewDate) < today;
    }
    return false;
  }).length;

  // Impact calculation: effective tests boost confidence, ineffective/overdue reduce it
  const effectiveRatio = effective / tests.length;
  const ineffectiveRatio = (ineffective + overdue) / tests.length;
  
  // 0-100 scale where 100 = strong positive testing impact, 0 = strong negative
  const overallTestingImpact = Math.round((effectiveRatio * 100) - (ineffectiveRatio * 50));

  return {
    overallTestingImpact: Math.max(0, Math.min(100, overallTestingImpact)),
    effectiveTests: effective,
    partiallyEffectiveTests: partiallyEffective,
    ineffectiveTests: ineffective,
    overdueTests: overdue,
    totalTests: tests.length
  };
}

function determineEvidenceSufficiency(evidenceMetrics, testingMetrics) {
  // If no evidence at all
  if (evidenceMetrics.totalCount === 0) {
    return 'missing';
  }

  // If stale/expired evidence dominates
  if (evidenceMetrics.stalenessImpact > 75) {
    return 'stale';
  }

  // If approval rate is low
  if (evidenceMetrics.completenessScore < 40) {
    return 'partial';
  }

  // If we have sufficient approved evidence and decent testing
  if (evidenceMetrics.completenessScore >= 75 && testingMetrics.overallTestingImpact >= 50) {
    return 'sufficient';
  }

  return 'partial';
}

function calculateCombinedConfidence(evidenceMetrics, testingMetrics) {
  // Confidence is a weighted combination of evidence and testing
  // Evidence: 60% weight
  // Testing: 40% weight

  const evidenceConfidence = evidenceMetrics.completenessScore - (evidenceMetrics.stalenessImpact * 0.3);
  const testConfidence = testingMetrics.overallTestingImpact;

  const combined = (evidenceConfidence * 0.6) + (testConfidence * 0.4);
  
  return Math.max(0, Math.min(100, Math.round(combined)));
}

function generateSummary(evidenceMetrics, testingMetrics, sufficiency) {
  let summary = '';

  if (sufficiency === 'missing') {
    summary = `No evidence has been submitted for this control. Evidence submission is required.`;
  } else if (sufficiency === 'stale') {
    summary = `${evidenceMetrics.staleCount + evidenceMetrics.expiredCount} pieces of evidence are stale or expired. Fresh evidence submission is critical.`;
  } else if (sufficiency === 'partial') {
    summary = `Evidence is partially sufficient (${evidenceMetrics.completenessScore}% approved). ${
      evidenceMetrics.rejectedCount > 0 ? `${evidenceMetrics.rejectedCount} evidence items were rejected and need resubmission. ` : ''
    }Additional evidence or clarifications are needed.`;
  } else {
    summary = `Evidence is sufficient (${evidenceMetrics.completenessScore}% approved). `;
    if (testingMetrics.totalTests === 0) {
      summary += `However, no control testing has been performed. Testing is recommended.`;
    } else if (testingMetrics.overallTestingImpact >= 75) {
      summary += `Testing confirms control effectiveness.`;
    } else if (testingMetrics.overdueTests > 0) {
      summary += `${testingMetrics.overdueTests} testing activities are overdue for revalidation.`;
    }
  }

  return summary;
}