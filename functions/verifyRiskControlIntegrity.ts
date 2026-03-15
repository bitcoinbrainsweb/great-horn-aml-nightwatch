import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { nwAuthMiddleware, requireAuth } from './auth-nw-middleware.ts';

/**
 * NW-UPGRADE-039 — Risk/control data health check
 * NW-UPGRADE-076D-PHASE1: Protected by Nightwatch auth middleware (read-only health route).
 *
 * Read-only integrity report. No writes, no runtime enforcement, no UI.
 * Admin/super_admin only. Use for audit and data health visibility.
 */

type CheckResult = { name: string; passed: boolean; details?: unknown };
type IntegrityResult = {
  success: boolean;
  checks: CheckResult[];
  warnings: string[];
  violations: string[];
};

Deno.serve(async (req) => {
  try {
    const auth = await nwAuthMiddleware(req);
    const err = requireAuth(auth);
    if (err) return err;
    const user = auth.authenticated_user as { role?: string };
    if (!user || !['admin', 'super_admin'].includes(user.role ?? '')) {
      return Response.json(
        { success: false, checks: [], warnings: [], violations: ['Forbidden: Technical Admin access required'] },
        { status: 403 }
      );
    }

    const base44 = createClientFromRequest(req);

    const checks: CheckResult[] = [];
    const warnings: string[] = [];
    const violations: string[] = [];

    let risks: { id: string }[] = [];
    let controlIds: Set<string> = new Set();
    let mappingCount = 0;
    let mappingsToMissingControls = 0;
    let risksWithoutMappings = 0;
    let controlTestsBrokenRefs = 0;

    try {
      risks = await base44.asServiceRole.entities.RiskLibrary.list('-created_date', 2000);
    } catch (e) {
      warnings.push('RiskLibrary list unavailable: ' + (e as Error).message);
    }

    try {
      const controls = await base44.asServiceRole.entities.ControlLibrary.list('-created_date', 5000);
      controlIds = new Set(controls.map((c: { id: string }) => c.id));
    } catch (e) {
      warnings.push('ControlLibrary list unavailable: ' + (e as Error).message);
    }

    for (const risk of risks) {
      let count = 0;
      try {
        const mappings = await base44.asServiceRole.entities.RiskControlMapping.filter({ risk_id: risk.id });
        count = mappings.length;
        mappingCount += count;
        if (count === 0) risksWithoutMappings++;
        for (const m of mappings) {
          const cid = m.control_id;
          if (cid && !controlIds.has(cid)) {
            mappingsToMissingControls++;
            violations.push(`RiskControlMapping references missing control: risk_id=${risk.id}, control_id=${cid}`);
          }
        }
      } catch {
        const linked = (risk as { linked_control_ids?: string[] }).linked_control_ids;
        if (Array.isArray(linked) && linked.length > 0) {
          count = linked.length;
          mappingCount += count;
        } else {
          risksWithoutMappings++;
        }
      }
    }

    try {
      const tests = await base44.asServiceRole.entities.ControlTest.list('-created_date', 2000);
      for (const t of tests) {
        const cid = t.control_library_id;
        if (cid && !controlIds.has(cid)) {
          controlTestsBrokenRefs++;
          violations.push(`ControlTest references missing control: test id=${t.id}, control_library_id=${cid}`);
        }
      }
    } catch (e) {
      warnings.push('ControlTest list unavailable: ' + (e as Error).message);
    }

    checks.push({
      name: 'risks_without_mappings',
      passed: risksWithoutMappings === 0,
      details: { total_risks: risks.length, risks_without_mappings: risksWithoutMappings }
    });
    checks.push({
      name: 'mappings_reference_valid_controls',
      passed: mappingsToMissingControls === 0,
      details: { total_mappings_checked: mappingCount, mappings_to_missing_controls: mappingsToMissingControls }
    });
    checks.push({
      name: 'control_tests_reference_valid_controls',
      passed: controlTestsBrokenRefs === 0,
      details: { control_tests_broken_refs: controlTestsBrokenRefs }
    });

    if (risksWithoutMappings > 0) {
      warnings.push(`${risksWithoutMappings} risk(s) have no mappings (may be intentional).`);
    }

    const success = violations.length === 0 && checks.every(c => c.passed);

    const result: IntegrityResult = {
      success,
      checks,
      warnings,
      violations
    };
    return Response.json(result);
  } catch (error) {
    console.error('[verifyRiskControlIntegrity]', error);
    return Response.json(
      {
        success: false,
        checks: [],
        warnings: [],
        violations: ['verifyRiskControlIntegrity failed: ' + (error as Error).message]
      },
      { status: 500 }
    );
  }
});
