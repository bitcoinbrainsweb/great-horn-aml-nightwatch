import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { actualResults, expectedResults, baselineResults } = await req.json();

    if (!actualResults || !expectedResults) {
      return Response.json({ error: 'Missing actualResults or expectedResults' }, { status: 400 });
    }

    const deviations = [];
    const passed = [];

    // Assertion 1: Expected findings present
    if (expectedResults.expectedFindings && Array.isArray(expectedResults.expectedFindings)) {
      const actualFindingKeys = (actualResults.actualFindings || []).map(f => f.toLowerCase());
      const expectedFindingKeys = expectedResults.expectedFindings.map(f => f.toLowerCase());
      
      for (const expectedKey of expectedFindingKeys) {
        if (!actualFindingKeys.includes(expectedKey)) {
          deviations.push({
            field: 'findings',
            assertion: 'expected_finding_present',
            expected: expectedKey,
            actual: 'missing',
            severity: 'high'
          });
        } else {
          passed.push('finding_' + expectedKey);
        }
      }
    }

    // Assertion 2: Residual risk level
    if (expectedResults.expectedResidualRisk) {
      const riskLevels = ['low', 'medium', 'high', 'critical'];
      const expectedIdx = riskLevels.indexOf(expectedResults.expectedResidualRisk.toLowerCase());
      const actualIdx = riskLevels.indexOf((actualResults.actualResidualRisk || '').toLowerCase());
      
      if (Math.abs(expectedIdx - actualIdx) > 1) {
        deviations.push({
          field: 'residualRisk',
          assertion: 'risk_level_within_threshold',
          expected: expectedResults.expectedResidualRisk,
          actual: actualResults.actualResidualRisk || 'unknown',
          severity: 'high'
        });
      } else {
        passed.push('residual_risk_acceptable');
      }
    }

    // Assertion 3: Control confidence threshold
    if (expectedResults.expectedControlConfidence && actualResults.actualControlConfidence) {
      const expectedConf = expectedResults.expectedControlConfidence;
      const actualConf = actualResults.actualControlConfidence;
      
      for (const [controlType, expectedRange] of Object.entries(expectedConf)) {
        const actualScore = actualConf[controlType];
        if (actualScore !== undefined) {
          const minExpected = typeof expectedRange === 'object' ? expectedRange.min : expectedRange - 10;
          const maxExpected = typeof expectedRange === 'object' ? expectedRange.max : expectedRange + 10;
          
          if (actualScore < minExpected || actualScore > maxExpected) {
            deviations.push({
              field: `confidence_${controlType}`,
              assertion: 'confidence_within_range',
              expected: `${minExpected}-${maxExpected}`,
              actual: actualScore,
              severity: 'medium'
            });
          } else {
            passed.push(`confidence_${controlType}_acceptable`);
          }
        }
      }
    }

    // Assertion 4: Gap count
    if (expectedResults.expectedGapCount !== undefined) {
      const expectedGaps = expectedResults.expectedGapCount;
      const actualGaps = actualResults.actualGapCount || 0;
      const tolerance = Math.max(1, Math.floor(expectedGaps * 0.1)); // 10% tolerance
      
      if (Math.abs(actualGaps - expectedGaps) > tolerance) {
        deviations.push({
          field: 'gapCount',
          assertion: 'gap_count_within_tolerance',
          expected: expectedGaps,
          actual: actualGaps,
          severity: 'medium'
        });
      } else {
        passed.push('gap_count_acceptable');
      }
    }

    // Assertion 5: Recommendation signals
    if (expectedResults.expectedRecommendationSignals && Array.isArray(expectedResults.expectedRecommendationSignals)) {
      const actualSignals = (actualResults.actualRecommendationSignals || []).map(s => s.toLowerCase());
      const expectedSignals = expectedResults.expectedRecommendationSignals.map(s => s.toLowerCase());
      
      const matchedCount = expectedSignals.filter(sig => actualSignals.some(as => as.includes(sig) || sig.includes(as))).length;
      const matchRatio = matchedCount / expectedSignals.length;
      
      if (matchRatio < 0.7) {
        deviations.push({
          field: 'recommendationSignals',
          assertion: 'signal_coverage_threshold',
          expected: expectedSignals,
          actual: actualSignals,
          severity: 'low',
          matchRatio: matchRatio
        });
      } else {
        passed.push('recommendation_signals_acceptable');
      }
    }

    // Determine overall status
    let status = 'passed';
    if (deviations.some(d => d.severity === 'high')) {
      status = 'failed';
    } else if (deviations.length > 0) {
      status = 'warning';
    }

    return Response.json({
      status,
      passed,
      deviations,
      deviationCount: deviations.length,
      passedCount: passed.length,
      summary: `${passed.length} assertions passed, ${deviations.length} deviations detected`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});