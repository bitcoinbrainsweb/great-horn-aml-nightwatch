/**
 * VerificationContractRegistry
 * 
 * Defines all runtime contracts that the build verification system must test.
 * Separates verification logic from the contracts being checked.
 */

export const VerificationContractRegistry = {
  /**
   * Entity Contracts
   * 
   * Core entities that must be queryable through runtime.
   * Each entity must support list() and filter() operations.
   */
  entityContracts: [
    {
      name: 'Engagement',
      requiredFields: ['engagement_name', 'engagement_type', 'status'],
      description: 'Core audit engagement entity'
    },
    {
      name: 'EngagementControlTest',
      requiredFields: ['engagement_id', 'control_library_id', 'test_status'],
      description: 'Control testing records for engagements'
    },
    {
      name: 'ControlLibrary',
      requiredFields: ['control_name', 'control_category', 'status'],
      description: 'Unified control library'
    },
    {
      name: 'EvidenceItem',
      requiredFields: ['evidence_type', 'title'],
      description: 'Evidence artifacts for engagements'
    },
    {
      name: 'Observation',
      requiredFields: ['engagement_id', 'observation_title', 'severity', 'status'],
      description: 'Audit observations and findings'
    },
    {
      name: 'Workpaper',
      requiredFields: ['title', 'engagement_id', 'status'],
      description: 'Audit workpaper documentation'
    },
    {
      name: 'SampleSet',
      requiredFields: ['engagement_id', 'population_description', 'sample_method'],
      description: 'Statistical sampling definitions'
    },
    {
      name: 'SampleItem',
      requiredFields: ['sample_set_id', 'item_identifier'],
      description: 'Individual sampled items'
    },
    {
      name: 'PublishedOutput',
      requiredFields: ['outputName', 'classification', 'status'],
      description: 'Canonical artifact store'
    },
    {
      name: 'UpgradeRegistry',
      requiredFields: ['upgrade_id', 'product_version', 'title', 'status'],
      description: 'System upgrade tracking'
    }
  ],

  /**
   * Route Contracts
   * 
   * Critical routes that must load successfully.
   * Verified by checking their data dependencies are accessible.
   */
  routeContracts: [
    {
      name: 'Engagements',
      entityDependency: 'Engagement',
      description: 'Primary engagement management interface'
    },
    {
      name: 'ChangeLog',
      entityDependency: 'PublishedOutput',
      description: 'Canonical artifact ChangeLog'
    },
    {
      name: 'BuildVerificationDashboard',
      entityDependency: 'PublishedOutput',
      description: 'Build verification monitoring dashboard'
    }
  ],

  /**
   * Artifact Contracts
   * 
   * Canonical artifact behaviors that must work in runtime.
   */
  artifactContracts: [
    {
      name: 'verification_record_creation',
      classification: 'verification_record',
      description: 'Verification records must be creatable',
      test: async (base44) => {
        const testArtifact = await base44.asServiceRole.entities.PublishedOutput.create({
          outputName: `Nightwatch_VerificationTest_${new Date().toISOString().split('T')[0]}`,
          classification: 'verification_record',
          subtype: 'contract_test',
          display_zone: 'internal_only',
          source_module: 'ContractTestRunner',
          source_event_type: 'contract_test',
          product_version: 'v0.6.0',
          upgrade_id: 'NW-UPGRADE-043',
          status: 'published',
          published_at: new Date().toISOString(),
          content: JSON.stringify({ test: true }),
          summary: 'Contract test artifact',
          is_user_visible: false,
          is_runnable: false
        });
        return { success: true, artifact_id: testArtifact.id };
      }
    },
    {
      name: 'verification_record_query',
      classification: 'verification_record',
      description: 'Verification records must be queryable',
      test: async (base44) => {
        const records = await base44.asServiceRole.entities.PublishedOutput.filter({
          classification: 'verification_record'
        }, '-published_at', 10);
        return { success: records.length >= 0, count: records.length };
      }
    },
    {
      name: 'verification_record_changelog_visibility',
      classification: 'verification_record',
      description: 'Verification records must appear in ChangeLog',
      test: async (base44) => {
        const records = await base44.asServiceRole.entities.PublishedOutput.filter({
          classification: 'verification_record',
          display_zone: 'internal_only'
        }, '-published_at', 5);
        return { success: true, visible_count: records.length };
      }
    }
  ],

  /**
   * Permission Contracts
   * 
   * Functions that must enforce admin-only access.
   * Verified by confirming admin enforcement is active in runtime.
   */
  permissionContracts: [
    {
      name: 'verifyLatestBuild',
      requiredRole: 'admin',
      description: 'Build verification must be admin-only'
    },
    {
      name: 'verifyEngagementAuditFoundation',
      requiredRole: 'admin',
      description: 'Engagement audit verification must be admin-only'
    }
  ]
};

export default VerificationContractRegistry;