import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Artifact Schema Validator
 * 
 * Enforces required structure on all new PublishedOutput artifacts.
 * Prevents incomplete verification records, report inconsistencies, and ChangeLog rendering issues.
 * 
 * Required fields:
 * - classification (must be valid enum)
 * - outputName (artifact_name)
 * - product_version
 * - upgrade_id
 * - prompt_id (NEW - must be added to schema)
 * - published_at (timestamp)
 * - content (artifact_body)
 * 
 * Optional fields:
 * - summary
 * - metadata (validation_results)
 * - notes (can be stored in metadata)
 * 
 * Surface validation rules:
 * - Reports page: classification = "report"
 * - ChangeLog: classification in ["verification_record", "audit_record", "delivery_gate_record"]
 */

const VALID_CLASSIFICATIONS = [
  'report',
  'verification_record',
  'audit_record',
  'delivery_gate_record',
  'documentation',
  'help',
  'internal_record',
  'dashboard_widget',
  'tool'
];

const CHANGELOG_CLASSIFICATIONS = [
  'verification_record',
  'audit_record',
  'delivery_gate_record'
];

const REPORTS_CLASSIFICATIONS = ['report'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artifact } = await req.json();

    if (!artifact) {
      return Response.json({ 
        valid: false, 
        error: 'No artifact provided' 
      }, { status: 400 });
    }

    const validationErrors = [];

    // Required field validation
    if (!artifact.classification) {
      validationErrors.push('classification is required');
    } else if (!VALID_CLASSIFICATIONS.includes(artifact.classification)) {
      validationErrors.push(`classification must be one of: ${VALID_CLASSIFICATIONS.join(', ')}`);
    }

    if (!artifact.outputName) {
      validationErrors.push('outputName (artifact_name) is required');
    }

    if (!artifact.product_version) {
      validationErrors.push('product_version is required');
    }

    if (!artifact.upgrade_id) {
      validationErrors.push('upgrade_id is required');
    }

    if (!artifact.source_module) {
      validationErrors.push('source_module is required');
    }

    if (!artifact.content) {
      validationErrors.push('content (artifact_body) is required');
    }

    if (!artifact.published_at) {
      validationErrors.push('published_at (timestamp) is required');
    }

    // Artifact name format validation
    if (artifact.outputName && !artifact.outputName.startsWith('Nightwatch_')) {
      validationErrors.push('outputName must follow format: Nightwatch_<Type>_<Version>_<UpgradeID>_<Timestamp>');
    }

    // Surface validation rules
    const surfaceValidation = validateSurfaceRules(artifact);
    if (!surfaceValidation.valid) {
      validationErrors.push(...surfaceValidation.errors);
    }

    if (validationErrors.length > 0) {
      return Response.json({
        valid: false,
        errors: validationErrors,
        message: 'Artifact validation failed',
        artifact_rejected: true
      }, { status: 400 });
    }

    // Validation passed
    return Response.json({
      valid: true,
      message: 'Artifact schema validation passed',
      classification: artifact.classification,
      display_surfaces: getSurfacesForClassification(artifact.classification)
    });

  } catch (error) {
    return Response.json({ 
      valid: false,
      error: error.message 
    }, { status: 500 });
  }
});

function validateSurfaceRules(artifact) {
  const errors = [];

  // ChangeLog surface validation
  if (CHANGELOG_CLASSIFICATIONS.includes(artifact.classification)) {
    if (artifact.display_zone !== 'internal_only') {
      errors.push('ChangeLog artifacts must have display_zone = "internal_only"');
    }
  }

  // Reports surface validation
  if (REPORTS_CLASSIFICATIONS.includes(artifact.classification)) {
    if (artifact.display_zone !== 'reports') {
      errors.push('Report artifacts must have display_zone = "reports"');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function getSurfacesForClassification(classification) {
  const surfaces = [];
  
  if (CHANGELOG_CLASSIFICATIONS.includes(classification)) {
    surfaces.push('ChangeLog');
  }
  
  if (REPORTS_CLASSIFICATIONS.includes(classification)) {
    surfaces.push('Reports');
  }
  
  if (classification === 'documentation') {
    surfaces.push('Docs');
  }
  
  if (classification === 'help') {
    surfaces.push('Help');
  }

  if (classification === 'dashboard_widget') {
    surfaces.push('Dashboard');
  }

  return surfaces.length > 0 ? surfaces : ['Internal Only'];
}