import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { ArtifactClassification, ALLOWED_ARTIFACT_CLASSIFICATIONS } from './artifactClassifications.ts';

/**
 * NW-UPGRADE-034 — Artifact Classification Repair
 *
 * Repairs classification drift for existing PublishedOutput records so that:
 * - verification artifacts use classification = verification_record
 * - system exports use classification = system_export
 * - diagnostics artifacts use classification = diagnostic_record
 *
 * This function does not create new artifacts directly; it only updates existing
 * records and, at the end, can optionally rely on the canonical verification
 * writer to summarize the repair.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Technical Admin access required' }, { status: 403 });
    }

    const now = new Date().toISOString();

    const allRecords = await base44.asServiceRole.entities.PublishedOutput.filter({});

    let updated = 0;
    const updates: Array<{ id: string; from: string; to: string }> = [];

    for (const record of allRecords) {
      const current = record.classification || '';
      let target: string | null = null;

      // If already one of the canonical classifications we care about, leave as-is
      if (ALLOWED_ARTIFACT_CLASSIFICATIONS.includes(current as any)) {
        continue;
      }

      // Architecture exports previously misclassified as verification_record or other types
      const isArchitectureExport =
        (record.subtype === 'architecture_export' ||
          (record.outputName || '').includes('Architecture') ||
          (record.source_module || '').toLowerCase().includes('architecture')) &&
        record.display_zone === 'internal_only';

      if (isArchitectureExport) {
        target = ArtifactClassification.SYSTEM_EXPORT;
      }

      // Diagnostics artifacts previously written as verification_record or report
      const isDiagnostic =
        record.subtype === 'diagnostic_test' ||
        (record.source_module || '') === 'ChangeLog' ||
        (record.source_module || '') === 'ArtifactDiagnostics';

      if (isDiagnostic) {
        target = ArtifactClassification.DIAGNOSTIC_RECORD;
      }

      // Only apply a change when we have a clear canonical mapping
      if (target && target !== current) {
        await base44.asServiceRole.entities.PublishedOutput.update(record.id, {
          classification: target
        });
        updated++;
        updates.push({ id: record.id, from: current || '(empty)', to: target });
      }
    }

    // Compute simple diagnostics for caller
    const published = allRecords.filter((r: any) => r.status === 'published');
    const byClassification: Record<string, number> = {};
    published.forEach((r: any) => {
      const cls = r.classification || 'unclassified';
      byClassification[cls] = (byClassification[cls] || 0) + 1;
    });

    const responseBody = {
      success: true,
      upgrade_id: 'NW-UPGRADE-034',
      updated_records: updated,
      total_records: allRecords.length,
      published_records: published.length,
      published_by_classification: byClassification,
      updates: updates.slice(0, 100), // cap for response size
      message: `NW-UPGRADE-034: classification repair completed; ${updated} records updated`
    };

    return Response.json(responseBody);
  } catch (error) {
    console.error('[NW-UPGRADE-034] Artifact classification repair failed:', error);
    return Response.json(
      {
        error: error.message,
        stack: error.stack,
        success: false
      },
      { status: 500 }
    );
  }
});

