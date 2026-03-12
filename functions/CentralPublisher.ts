import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * DEPRECATED: CentralPublisher
 * 
 * Legacy general-purpose artifact publisher. Replaced by specialized canonical writers:
 * - createVerificationArtifact: canonical publisher for verification_record classification
 * - exportArchitectureWithFiles: canonical publisher for system_export classification
 * 
 * NW-UPGRADE-031 REFACTOR: CentralPublisher is retired. All artifact creation must route
 * through classification-specific canonical publishers to ensure consistency and auditability.
 */

Deno.serve(async (req) => {
  console.warn('[CentralPublisher] DEPRECATED: Use classification-specific canonical publishers');
  
  return Response.json({
    error: 'DEPRECATED: CentralPublisher has been retired',
    message: 'CentralPublisher has been deprecated. Route artifact creation through classification-specific canonical publishers: createVerificationArtifact (verification_record) or exportArchitectureWithFiles (system_export).',
    action: 'Refactor to use canonical publisher for your classification'
  }, { status: 410 });
});