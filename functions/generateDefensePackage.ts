import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audit_id } = await req.json();

    if (!audit_id) {
      return Response.json({ error: 'audit_id required' }, { status: 400 });
    }

    // Fetch audit and engagement
    const audit = await base44.entities.Audit.filter({ id: audit_id }).then(r => r[0]);
    if (!audit) {
      return Response.json({ error: 'Audit not found' }, { status: 404 });
    }

    const engagement = await base44.entities.Engagement.filter({ id: audit.engagement_id }).then(r => r[0]);

    // Fetch audit graph data
    const phases = await base44.entities.AuditPhase.filter({ audit_id });
    const procedures = await Promise.all(
      phases.map(async phase => {
        const procs = await base44.entities.AuditProcedure.filter({ audit_phase_id: phase.id });
        return procs.map(proc => ({ ...proc, phase_name: phase.name }));
      })
    ).then(results => results.flat());

    const workpapers = await Promise.all(
      procedures.map(proc => base44.entities.AuditWorkpaper.filter({ audit_procedure_id: proc.id }))
    ).then(results => results.flat());

    const sampleSets = await Promise.all(
      procedures.map(proc => base44.entities.SampleSet.filter({ audit_procedure_id: proc.id }))
    ).then(results => results.flat());

    const sampleItems = await Promise.all(
      sampleSets.map(set => base44.entities.SampleItem.filter({ sample_set_id: set.id }))
    ).then(results => results.flat());

    const findings = await base44.entities.AuditFinding.filter({ audit_id });

    // Fetch evidence items linked to workpapers and sample items
    const evidenceIds = new Set([
      ...workpapers.filter(wp => wp.evidence_item_id).map(wp => wp.evidence_item_id),
      ...sampleItems.filter(si => si.evidence_item_id).map(si => si.evidence_item_id)
    ]);

    const evidenceItems = await Promise.all(
      Array.from(evidenceIds).map(id => base44.entities.EvidenceItem.filter({ id }).then(r => r[0]))
    ).then(results => results.filter(Boolean));

    // Fetch observations and remediations
    const observationIds = findings.filter(f => f.observation_id).map(f => f.observation_id);
    const observations = await Promise.all(
      observationIds.map(id => base44.entities.Observation.filter({ id }).then(r => r[0]))
    ).then(results => results.filter(Boolean));

    const remediationIds = [
      ...findings.filter(f => f.remediation_action_id).map(f => f.remediation_action_id),
      ...observations.filter(o => o.remediation_id).map(o => o.remediation_id)
    ];
    const remediations = await Promise.all(
      Array.from(new Set(remediationIds)).map(id => base44.entities.RemediationAction.filter({ id }).then(r => r[0]))
    ).then(results => results.filter(Boolean));

    // Build artifact bundle
    const artifact_bundle = {
      audit_metadata: {
        audit_id: audit.id,
        audit_name: audit.name,
        audit_type: audit.audit_type,
        start_date: audit.start_date,
        end_date: audit.end_date,
        status: audit.status,
        lead_auditor: audit.lead_auditor,
        report_status: audit.report_status,
        overall_rating: audit.overall_rating,
        final_summary: audit.final_summary,
        engagement_name: engagement?.engagement_name,
        engagement_type: engagement?.engagement_type
      },
      audit_scope: {
        description: audit.description,
        phase_count: phases.length,
        procedure_count: procedures.length,
        finding_count: findings.length
      },
      audit_phases: phases.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        phase_order: p.phase_order,
        status: p.status
      })),
      audit_procedures: procedures.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        phase_name: p.phase_name,
        procedure_type: p.procedure_type,
        execution_status: p.execution_status,
        assigned_to: p.assigned_to,
        start_time: p.start_time,
        completed_time: p.completed_time,
        evidence_sufficiency: p.evidence_sufficiency,
        required_evidence_count: p.required_evidence_count,
        completion_rule: p.completion_rule
      })),
      sampling_sets: sampleSets.map(s => ({
        id: s.id,
        audit_procedure_id: s.audit_procedure_id,
        population_description: s.population_description,
        sampling_method: s.sampling_method || s.sample_method,
        sample_size: s.sample_size,
        population_size: s.population_size,
        sampling_rationale: s.sampling_rationale || s.rationale,
        sample_results_summary: s.sample_results_summary
      })),
      sample_items: sampleItems.map(i => ({
        id: i.id,
        sample_set_id: i.sample_set_id,
        item_identifier: i.item_identifier,
        item_description: i.item_description,
        test_result: i.test_result,
        exception_details: i.exception_details,
        evidence_item_id: i.evidence_item_id
      })),
      evidence_references: evidenceItems.map(e => ({
        evidence_id: e.id,
        evidence_type: e.evidence_type,
        title: e.title,
        description: e.description,
        evidence_date: e.evidence_date,
        review_status: e.review_status,
        reviewed_by: e.reviewed_by,
        reviewed_at: e.reviewed_at,
        evidence_hash: e.hash_value,
        hash_algorithm: e.hash_algorithm,
        locked_for_audit: e.locked_for_audit,
        evidence_strength: e.evidence_strength,
        file_url: e.file_url
      })),
      findings: findings.map(f => ({
        id: f.id,
        title: f.title,
        description: f.description,
        severity: f.severity,
        lifecycle_status: f.lifecycle_status,
        root_cause: f.root_cause,
        repeat_finding: f.repeat_finding,
        previous_finding_id: f.previous_finding_id,
        detected_during_procedure_id: f.detected_during_procedure_id,
        observation_id: f.observation_id,
        remediation_action_id: f.remediation_action_id,
        recommendation: f.recommendation,
        management_response: f.management_response,
        target_remediation_date: f.target_remediation_date,
        included_in_report: f.included_in_report
      })),
      remediation_actions: remediations.map(r => ({
        id: r.id,
        observation_id: r.observation_id,
        action_title: r.action_title,
        action_description: r.action_description,
        owner: r.owner,
        target_date: r.target_date,
        completion_date: r.completion_date,
        status: r.status,
        verification_status: r.verification_status,
        verified_by: r.verified_by,
        verified_at: r.verified_at,
        verification_notes: r.verification_notes
      })),
      remediation_verification_status: {
        total_remediations: remediations.length,
        pending: remediations.filter(r => r.verification_status === 'pending').length,
        verified: remediations.filter(r => r.verification_status === 'verified').length,
        failed: remediations.filter(r => r.verification_status === 'failed').length
      },
      generated_at: new Date().toISOString(),
      generated_by: user.email
    };

    // Create DefensePackage record
    const defensePackage = await base44.entities.DefensePackage.create({
      audit_id,
      generated_at: new Date().toISOString(),
      generated_by: user.email,
      package_status: 'generated',
      artifact_bundle: JSON.stringify(artifact_bundle)
    });

    return Response.json({
      success: true,
      defense_package_id: defensePackage.id,
      artifact_bundle
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});