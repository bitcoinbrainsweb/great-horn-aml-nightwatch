/**
 * Shared ChangeLog Query Logic
 * 
 * Used by both ChangeLog page and Artifact Diagnostics to ensure consistency.
 */

import { base44 } from '@/api/base44Client';

/**
 * Retrieves all ChangeLog-visible artifacts using the canonical query path.
 * 
 * @returns {Promise<Array>} Array of PublishedOutput records matching ChangeLog criteria
 */
export async function getChangeLogArtifacts() {
  // Step 1: Query PublishedOutput with status filter
  const allRecords = await base44.entities.PublishedOutput.filter({
    status: 'published'
  });

  // Step 2: Filter by allowed classifications (in-memory)
  const changelogArtifacts = allRecords.filter(r => 
    ['verification_record', 'audit_record', 'delivery_gate_record'].includes(r.classification)
  );

  // Step 3: Sort by publication date (descending)
  return changelogArtifacts.sort((a, b) => 
    new Date(b.published_at || b.created_date) - new Date(a.published_at || a.created_date)
  );
}

/**
 * Query configuration for diagnostic display
 */
export const CHANGELOG_QUERY_CONFIG = {
  entity: 'PublishedOutput',
  statusFilter: 'published',
  classificationFilter: ['verification_record', 'audit_record', 'delivery_gate_record'],
  sortField: 'published_at',
  sortOrder: 'descending'
};