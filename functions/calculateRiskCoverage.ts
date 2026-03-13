import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { resolveCoverageStatus } from './riskCoverageContract.ts';

/**
 * Deterministic coverage evaluation for a risk.
 * Uses shared coverage contract (riskCoverageContract) for canonical status.
 * 
 * Returns: { coverage_status, details }
 * coverage_status: COVERED | PARTIALLY_COVERED | INEFFECTIVE | NOT_TESTED | UNCONTROLLED
 */
async function evaluateCoverage(base44, riskId, linkedControlIds) {
  // No controls linked = UNCONTROLLED
  if (!linkedControlIds || linkedControlIds.length === 0) {
    return {
      coverage_status: resolveCoverageStatus(0, 0, 0),
      details: {
        total_controls: 0,
        tested_controls: 0,
        effective_controls: 0
      }
    };
  }

  try {
    // Fetch all control tests
    const allTests = await base44.entities.ControlTest.list('-created_date', 1000);
    
    const controlStatuses = [];
    let testedCount = 0;
    let effectiveCount = 0;

    for (const controlId of linkedControlIds) {
      // Get latest test for this control (most recent by created_date)
      const testsForControl = allTests.filter(t => t.control_library_id === controlId);
      
      if (testsForControl.length === 0) {
        // No tests for this control
        controlStatuses.push({ control_id: controlId, tested: false, effective: null });
      } else {
        // Use most recent test
        const latestTest = testsForControl[0];
        testedCount++;
        
        const isEffective = latestTest.effectiveness_rating === 'Effective';
        if (isEffective) {
          effectiveCount++;
        }
        
        controlStatuses.push({
          control_id: controlId,
          tested: true,
          effective: isEffective,
          status: latestTest.effectiveness_rating || 'Not Tested'
        });
      }
    }

    const coverage_status = resolveCoverageStatus(
      linkedControlIds.length,
      testedCount,
      effectiveCount
    );

    return {
      coverage_status,
      details: {
        total_controls: linkedControlIds.length,
        tested_controls: testedCount,
        effective_controls: effectiveCount,
        control_statuses: controlStatuses
      }
    };
  } catch (error) {
    console.error('Coverage evaluation error:', error);
    return {
      coverage_status: 'NOT_TESTED',
      details: { error: error.message }
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { risk_id, linked_control_ids } = await req.json();

    if (!risk_id || !linked_control_ids) {
      return Response.json({ error: 'Missing risk_id or linked_control_ids' }, { status: 400 });
    }

    const result = await evaluateCoverage(base44, risk_id, linked_control_ids);

    return Response.json({
      success: true,
      risk_id,
      ...result
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});