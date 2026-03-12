import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all evidence records
    const allEvidence = await base44.entities.Evidence.list('-created_date', 1000);

    const results = {
      total_records: allEvidence.length,
      hashes_created: 0,
      review_status_added: 0,
      metadata_standardized: 0,
      failed: 0,
      records: []
    };

    for (const evidence of allEvidence) {
      try {
        const updateData = {};
        
        // If no file_hash, compute one
        if (!evidence.file_hash && evidence.evidence_type === 'File') {
          const encoder = new TextEncoder();
          const input = (evidence.file_reference || evidence.id) + (evidence.upload_timestamp || '');
          const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input));
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          updateData.file_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          updateData.hash_algorithm = 'SHA-256';
          results.hashes_created++;
        }

        // Add review_status if missing
        if (!evidence.review_status) {
          updateData.review_status = 'Pending';
          results.review_status_added++;
        }

        // Standardize uploaded_at field
        if (!evidence.uploaded_at && evidence.upload_timestamp) {
          updateData.uploaded_at = evidence.upload_timestamp;
          results.metadata_standardized++;
        }

        // Add evidence_id if missing
        if (!evidence.evidence_id) {
          updateData.evidence_id = `EV-${evidence.id.substring(0, 8).toUpperCase()}`;
        }

        // Apply updates if any
        if (Object.keys(updateData).length > 0) {
          await base44.entities.Evidence.update(evidence.id, updateData);
          results.records.push({
            id: evidence.id,
            updates_applied: Object.keys(updateData)
          });
        }
      } catch (error) {
        results.failed++;
        console.error(`Error migrating evidence ${evidence.id}:`, error.message);
      }
    }

    return Response.json({
      success: true,
      message: 'Evidence integrity migration completed',
      results: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});