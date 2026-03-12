import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// NW-UPGRADE-031E: Canonical Architecture Export Writer
// This is the ONLY export path. It calls architectureExporter and validates the entire output.
// No broken legacy paths. No temporary state. No incomplete records.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Call the underlying architectureExporter
    const exporterResponse = await base44.functions.invoke('architectureExporter', {});
    const exportData = exporterResponse.data;

    // Validate the artifact was created
    if (!exportData.artifact_created) {
      return Response.json({
        error: 'Artifact creation failed',
        details: exportData.artifact_error,
        message: 'Export completed but artifact was not persisted'
      }, { status: 206 });
    }

    // Verify artifact exists and is published
    const artifact = await base44.asServiceRole.entities.PublishedOutput.filter({
      id: exportData.artifact_id
    });

    if (!artifact || artifact.length === 0) {
      return Response.json({
        error: 'Artifact verification failed',
        message: 'Artifact was created but cannot be retrieved'
      }, { status: 500 });
    }

    const publishedArtifact = artifact[0];

    // Validate artifact shape
    const validations = {
      title_correct: publishedArtifact.outputName === 'Nightwatch Architecture Export',
      classification_correct: publishedArtifact.classification === 'verification_record',
      status_correct: publishedArtifact.status === 'published',
      version_correct: publishedArtifact.product_version === 'v0.7.0',
      has_files: publishedArtifact.metadata ? JSON.parse(publishedArtifact.metadata).file_manifest ? true : false : false,
      file_count: publishedArtifact.metadata ? Object.keys(JSON.parse(publishedArtifact.metadata).file_manifest || {}).length : 0
    };

    // Check visibility in ChangeLog query
    const changelogArtifacts = await base44.entities.PublishedOutput.filter({
      status: 'published',
      classification: 'verification_record'
    });
    const inChangeLog = changelogArtifacts.some(a => a.id === publishedArtifact.id);
    validations.in_changelog = inChangeLog;

    // All validations must pass
    const allValid = Object.values(validations).every(v => v === true || typeof v === 'number' && v > 0);

    if (!allValid) {
      return Response.json({
        error: 'Artifact validation failed',
        validations: validations,
        artifact: {
          id: publishedArtifact.id,
          outputName: publishedArtifact.outputName,
          classification: publishedArtifact.classification,
          status: publishedArtifact.status,
          product_version: publishedArtifact.product_version
        }
      }, { status: 206 });
    }

    // Success: return complete verification
    return Response.json({
      status: 'success',
      artifact: {
        id: publishedArtifact.id,
        title: publishedArtifact.outputName,
        classification: publishedArtifact.classification,
        product_version: publishedArtifact.product_version,
        published_at: publishedArtifact.published_at,
        upgrade_id: publishedArtifact.upgrade_id
      },
      files: validations.file_count,
      validation: validations,
      message: 'Architecture export successfully created, published, and verified in ChangeLog',
      next_step: 'View in ChangeLog to download attached files'
    });

  } catch (error) {
    console.error('[exportArchitectureCanonical] Error:', error);
    return Response.json({
      error: 'Export failed',
      details: error.message
    }, { status: 500 });
  }
});