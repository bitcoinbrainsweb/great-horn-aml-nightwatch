import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * NW-UPGRADE-068 — Mutation Guardrails
 *
 * Advisory pre-mutation validation checks. Callable before performing
 * mutations to verify business rules are satisfied. Returns pass/fail
 * with reasons; does not block mutations directly.
 *
 * Supported checks:
 *   - edit_locked_evidence: Cannot modify EvidenceItem where locked_for_audit === true
 *   - close_finding_without_remediation: Cannot close AuditFinding without verified RemediationAction
 *   - delete_procedure_with_evidence: Cannot delete AuditProcedure that has linked EvidenceItem
 */

interface GuardrailResult {
  check: string;
  allowed: boolean;
  reason: string;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { check, entity_id } = body;

    if (!check || !entity_id) {
      return Response.json({
        error: 'Missing required fields: check, entity_id'
      }, { status: 400 });
    }

    let result: GuardrailResult;

    switch (check) {
      case 'edit_locked_evidence': {
        const evidence = await base44.asServiceRole.entities.EvidenceItem.get(entity_id);
        if (!evidence) {
          result = { check, allowed: false, reason: 'EvidenceItem not found' };
        } else if (evidence.locked_for_audit === true) {
          result = { check, allowed: false, reason: 'Evidence is locked for audit and cannot be edited' };
        } else {
          result = { check, allowed: true, reason: 'Evidence is not locked' };
        }
        break;
      }

      case 'close_finding_without_remediation': {
        const finding = await base44.asServiceRole.entities.AuditFinding.get(entity_id);
        if (!finding) {
          result = { check, allowed: false, reason: 'AuditFinding not found' };
        } else if (finding.lifecycle_status === 'Closed') {
          result = { check, allowed: true, reason: 'Finding is already closed' };
        } else {
          const remediations = await base44.asServiceRole.entities.RemediationAction
            .filter({ observation_id: entity_id }, '-created_date', 50)
            .catch(() => []);
          const allVerified = remediations.length > 0 &&
            remediations.every((r: any) => r.verification_status === 'Verified');
          if (remediations.length === 0) {
            result = { check, allowed: false, reason: 'No remediation actions linked to this finding' };
          } else if (!allVerified) {
            const unverified = remediations.filter((r: any) => r.verification_status !== 'Verified').length;
            result = { check, allowed: false, reason: `${unverified} remediation action(s) not yet verified` };
          } else {
            result = { check, allowed: true, reason: 'All remediation actions are verified' };
          }
        }
        break;
      }

      case 'delete_procedure_with_evidence': {
        const procedure = await base44.asServiceRole.entities.AuditProcedure.get(entity_id);
        if (!procedure) {
          result = { check, allowed: false, reason: 'AuditProcedure not found' };
        } else {
          const linkedEvidence = await base44.asServiceRole.entities.EvidenceItem
            .filter({ audit_procedure_id: entity_id }, '-created_date', 10)
            .catch(() => []);
          const linkedWorkpapers = await base44.asServiceRole.entities.AuditWorkpaper
            .filter({ audit_procedure_id: entity_id }, '-created_date', 10)
            .catch(() => []);
          if (linkedEvidence.length > 0) {
            result = { check, allowed: false, reason: `Procedure has ${linkedEvidence.length} linked evidence item(s)` };
          } else if (linkedWorkpapers.length > 0) {
            result = { check, allowed: false, reason: `Procedure has ${linkedWorkpapers.length} linked workpaper(s)` };
          } else {
            result = { check, allowed: true, reason: 'No linked evidence or workpapers' };
          }
        }
        break;
      }

      default:
        result = { check, allowed: false, reason: `Unknown guardrail check: ${check}` };
    }

    return Response.json({
      success: true,
      result,
      checked_at: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
