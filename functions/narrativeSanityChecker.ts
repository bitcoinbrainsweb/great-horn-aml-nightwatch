import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { narrative, narrativeChecks } = await req.json();

    if (!narrative || !narrativeChecks) {
      return Response.json({ error: 'Missing narrative or narrativeChecks' }, { status: 400 });
    }

    const results = {};
    const narrativeLower = narrative.toLowerCase();

    // Check: containsKeyConcept
    if (narrativeChecks.containsKeyConcept && Array.isArray(narrativeChecks.containsKeyConcept)) {
      results.containsKeyConcept = {};
      for (const concept of narrativeChecks.containsKeyConcept) {
        const conceptLower = concept.toLowerCase();
        const found = narrativeLower.includes(conceptLower);
        results.containsKeyConcept[concept] = found;
      }
    }

    // Check: mentionsControl
    if (narrativeChecks.mentionsControl && Array.isArray(narrativeChecks.mentionsControl)) {
      results.mentionsControl = {};
      for (const control of narrativeChecks.mentionsControl) {
        const controlLower = control.toLowerCase();
        const found = narrativeLower.includes(controlLower);
        results.mentionsControl[control] = found;
      }
    }

    // Check: mentionsRiskTheme
    if (narrativeChecks.mentionsRiskTheme && Array.isArray(narrativeChecks.mentionsRiskTheme)) {
      results.mentionsRiskTheme = {};
      for (const theme of narrativeChecks.mentionsRiskTheme) {
        const themeLower = theme.toLowerCase();
        const found = narrativeLower.includes(themeLower);
        results.mentionsRiskTheme[theme] = found;
      }
    }

    // Check: mentionsJurisdiction
    if (narrativeChecks.mentionsJurisdiction && Array.isArray(narrativeChecks.mentionsJurisdiction)) {
      results.mentionsJurisdiction = {};
      for (const jurisdiction of narrativeChecks.mentionsJurisdiction) {
        const jurisdictionLower = jurisdiction.toLowerCase();
        const jurisdictionMap = {
          'canada': ['canada', 'fintrac', 'canadian', 'crs'],
          'usa': ['united states', 'usa', 'aml', 'fincen', 'american'],
          'eu': ['european', 'eu ', 'ectad', 'gdpr'],
          'gbr': ['united kingdom', 'uk ', 'fca', 'british']
        };
        const patterns = jurisdictionMap[jurisdictionLower] || [jurisdictionLower];
        const found = patterns.some(p => narrativeLower.includes(p.toLowerCase()));
        results.mentionsJurisdiction[jurisdiction] = found;
      }
    }

    // Check: doesNotOmitMaterialIssue
    if (narrativeChecks.doesNotOmitMaterialIssue && Array.isArray(narrativeChecks.doesNotOmitMaterialIssue)) {
      results.doesNotOmitMaterialIssue = {};
      for (const issue of narrativeChecks.doesNotOmitMaterialIssue) {
        const issueLower = issue.toLowerCase();
        const found = narrativeLower.includes(issueLower);
        results.doesNotOmitMaterialIssue[issue] = found;
      }
    }

    // Calculate overall pass rate
    let totalChecks = 0;
    let passedChecks = 0;
    for (const checkType of Object.values(results)) {
      if (typeof checkType === 'object') {
        for (const value of Object.values(checkType)) {
          totalChecks++;
          if (value === true) passedChecks++;
        }
      }
    }

    const passRate = totalChecks > 0 ? passedChecks / totalChecks : 1;
    let overallStatus = 'passed';
    if (passRate < 0.8) overallStatus = 'failed';
    else if (passRate < 0.95) overallStatus = 'warning';

    return Response.json({
      overallStatus,
      results,
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
      passRate: (passRate * 100).toFixed(1) + '%',
      summary: `${passedChecks}/${totalChecks} narrative sanity checks passed`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});