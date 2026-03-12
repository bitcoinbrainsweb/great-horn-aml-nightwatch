import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * DEPRECATED: publishVerificationRecord
 * 
 * Legacy verification artifact writer. Replaced by canonical createVerificationArtifact.
 * This function is retained for backward compatibility with legacy upgrade workflows.
 * 
 * NW-UPGRADE-031 REFACTOR: All new verification artifacts must use createVerificationArtifact
 * as the sole canonical publisher for verification_record classification.
 */

Deno.serve(async (req) => {
  console.warn('[publishVerificationRecord] DEPRECATED: Use createVerificationArtifact (canonical writer)');
  
  return Response.json({
    error: 'DEPRECATED: publishVerificationRecord has been retired',
    message: 'publishVerificationRecord has been deprecated and removed from active use. Please use createVerificationArtifact (canonical publisher for verification_record classification).',
    action: 'Route verification artifact creation through createVerificationArtifact'
  }, { status: 410 });
});