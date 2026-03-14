import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NW-UPGRADE-068 — Orphan Object Detection
 *
 * Read-only, admin-only check that detects orphaned records in the compliance
 * and audit graphs. Reports counts without deleting or modifying records.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const checks: Array<{ name: string; orphan_count: number; details: string }> = [];

    // 1. SampleItem without valid SampleSet
    try {
      const sampleItems = await base44.asServiceRole.entities.SampleItem.list('-created_date', 200);
      const sampleSets = await base44.asServiceRole.entities.SampleSet.list('-created_date', 200);
      const sampleSetIds = new Set(sampleSets.map((s: any) => s.id));
      const orphanedItems = sampleItems.filter((item: any) =>
        !item.sample_set_id || !sampleSetIds.has(item.sample_set_id)
      );
      checks.push({
        name: 'sample_item_without_sample_set',
        orphan_count: orphanedItems.length,
        details: `${sampleItems.length} total SampleItems, ${orphanedItems.length} without valid SampleSet`
      });
    } catch (e) {
      checks.push({ name: 'sample_item_without_sample_set', orphan_count: -1, details: `Check failed: ${e.message}` });
    }

    // 2. RemediationAction without valid Observation
    try {
      const remediations = await base44.asServiceRole.entities.RemediationAction.list('-created_date', 200);
      const observations = await base44.asServiceRole.entities.Observation.list('-created_date', 500);
      const observationIds = new Set(observations.map((o: any) => o.id));
      const orphanedRemediations = remediations.filter((r: any) =>
        !r.observation_id || !observationIds.has(r.observation_id)
      );
      checks.push({
        name: 'remediation_without_observation',
        orphan_count: orphanedRemediations.length,
        details: `${remediations.length} total RemediationActions, ${orphanedRemediations.length} without valid Observation`
      });
    } catch (e) {
      checks.push({ name: 'remediation_without_observation', orphan_count: -1, details: `Check failed: ${e.message}` });
    }

    // 3. AuditWorkpaper without valid AuditProcedure
    try {
      const workpapers = await base44.asServiceRole.entities.AuditWorkpaper.list('-created_date', 200);
      const procedures = await base44.asServiceRole.entities.AuditProcedure.list('-created_date', 500);
      const procedureIds = new Set(procedures.map((p: any) => p.id));
      const orphanedWorkpapers = workpapers.filter((w: any) =>
        !w.audit_procedure_id || !procedureIds.has(w.audit_procedure_id)
      );
      checks.push({
        name: 'workpaper_without_procedure',
        orphan_count: orphanedWorkpapers.length,
        details: `${workpapers.length} total AuditWorkpapers, ${orphanedWorkpapers.length} without valid AuditProcedure`
      });
    } catch (e) {
      checks.push({ name: 'workpaper_without_procedure', orphan_count: -1, details: `Check failed: ${e.message}` });
    }

    // 4. AuditPhase without valid Audit
    try {
      const phases = await base44.asServiceRole.entities.AuditPhase.list('-created_date', 200);
      const audits = await base44.asServiceRole.entities.Audit.list('-created_date', 200);
      const auditIds = new Set(audits.map((a: any) => a.id));
      const orphanedPhases = phases.filter((p: any) =>
        !p.audit_id || !auditIds.has(p.audit_id)
      );
      checks.push({
        name: 'phase_without_audit',
        orphan_count: orphanedPhases.length,
        details: `${phases.length} total AuditPhases, ${orphanedPhases.length} without valid Audit`
      });
    } catch (e) {
      checks.push({ name: 'phase_without_audit', orphan_count: -1, details: `Check failed: ${e.message}` });
    }

    // 5. AuditFinding without valid Audit
    try {
      const findings = await base44.asServiceRole.entities.AuditFinding.list('-created_date', 200);
      const audits = await base44.asServiceRole.entities.Audit.list('-created_date', 200);
      const auditIds = new Set(audits.map((a: any) => a.id));
      const orphanedFindings = findings.filter((f: any) =>
        !f.audit_id || !auditIds.has(f.audit_id)
      );
      checks.push({
        name: 'finding_without_audit',
        orphan_count: orphanedFindings.length,
        details: `${findings.length} total AuditFindings, ${orphanedFindings.length} without valid Audit`
      });
    } catch (e) {
      checks.push({ name: 'finding_without_audit', orphan_count: -1, details: `Check failed: ${e.message}` });
    }

    // 6. EvidenceItem without engagement linkage
    try {
      const evidence = await base44.asServiceRole.entities.EvidenceItem.list('-created_date', 200);
      const engagements = await base44.asServiceRole.entities.Engagement.list('-created_date', 500);
      const engagementIds = new Set(engagements.map((e: any) => e.id));
      const orphanedEvidence = evidence.filter((item: any) =>
        !item.engagement_id || !engagementIds.has(item.engagement_id)
      );
      checks.push({
        name: 'evidence_without_engagement',
        orphan_count: orphanedEvidence.length,
        details: `${evidence.length} total EvidenceItems, ${orphanedEvidence.length} without valid Engagement`
      });
    } catch (e) {
      checks.push({ name: 'evidence_without_engagement', orphan_count: -1, details: `Check failed: ${e.message}` });
    }

    const totalOrphans = checks.reduce((sum, c) => sum + Math.max(0, c.orphan_count), 0);
    const failedChecks = checks.filter(c => c.orphan_count === -1).length;

    return Response.json({
      success: true,
      total_orphans_detected: totalOrphans,
      checks_run: checks.length,
      checks_failed: failedChecks,
      checks,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
