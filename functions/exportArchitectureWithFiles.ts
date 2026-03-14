import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { ArtifactClassification } from './artifactClassifications.ts';

// NW-UPGRADE-031: Canonical system_export path for architecture exports. Allowed non-canonical writer per NW-UPGRADE-039 allowlist.
// Single approved path for system_export classification (architecture exports)
// Generates complete system architecture snapshot with all files embedded in metadata.file_manifest
// Guaranteed persistence: Files embedded FIRST, then artifact created with file_manifest reference

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Technical Admin access required' }, { status: 403 });
    }

    // STEP 1: Generate all export data in memory
    const entities = [
      { entity_name: "Client", description: "AML client entity for engagement tracking", key_fields: ["legal_name", "client_type", "status"], relationships: { has_many: ["Engagement"] } },
      { entity_name: "Engagement", description: "AML compliance engagement for a client", key_fields: ["client_id", "engagement_type", "status"], relationships: { belongs_to: ["Client"], has_many: ["EngagementRisk", "Report"] } },
      { entity_name: "RiskLibrary", description: "Core and custom AML risk definitions", key_fields: ["risk_name", "risk_category", "lifecycle_state"], relationships: { has_many: ["EngagementRisk", "ControlLibrary"] } },
      { entity_name: "ControlLibrary", description: "Core and custom control definitions", key_fields: ["control_name", "control_category", "lifecycle_state"], relationships: { has_many: ["ControlTest"] } },
      { entity_name: "ControlTest", description: "Control test execution and effectiveness assessment", key_fields: ["control_library_id", "test_cycle_id", "status"], relationships: { belongs_to: ["ControlLibrary", "TestCycle"], has_many: ["Evidence", "Finding"] } },
      { entity_name: "TestCycle", description: "Control testing cycle definition and management", key_fields: ["name", "start_date", "status"], relationships: { has_many: ["ControlTest"] } },
      { entity_name: "Evidence", description: "Audit evidence attached to control tests", key_fields: ["control_test_id", "evidence_type"], relationships: { belongs_to: ["ControlTest"] } },
      { entity_name: "Finding", description: "Control test or audit findings", key_fields: ["title", "source_type", "severity", "status"], relationships: { has_many: ["RemediationAction"] } },
      { entity_name: "RemediationAction", description: "Remediation action tracking for findings", key_fields: ["finding_id", "title", "status"], relationships: { belongs_to: ["Finding"] } },
      { entity_name: "EngagementRisk", description: "Risk assessment and control effectiveness evaluation", key_fields: ["engagement_id", "risk_name", "status"], relationships: { belongs_to: ["Engagement", "RiskLibrary"] } },
      { entity_name: "PublishedOutput", description: "System-published verification records, reports, and artifacts", key_fields: ["outputName", "classification", "status"], relationships: { references: ["UpgradeRegistry"] } },
      { entity_name: "UpgradeRegistry", description: "Product upgrade tracking and lifecycle management", key_fields: ["upgrade_id", "product_version", "status"], relationships: { has_many: ["UpgradeAuditLog", "PublishedOutput"] } },
      { entity_name: "UpgradeAuditLog", description: "Detailed audit trail of upgrade lifecycle events", key_fields: ["upgrade_id", "action", "timestamp"], relationships: { belongs_to: ["UpgradeRegistry"] } },
      { entity_name: "GovernanceRule", description: "Governance and compliance rule definitions", key_fields: ["rule_id", "rule_name", "category"], relationships: {} },
      { entity_name: "PermissionDefinition", description: "Role-based access control permission definitions", key_fields: ["permission_id", "permission_key", "action_type"], relationships: {} },
      { entity_name: "StateMachineDefinition", description: "State machine definitions for entity lifecycle management", key_fields: ["machine_id", "entity_type", "initial_state"], relationships: {} },
      { entity_name: "MigrationRecord", description: "Data migration execution records", key_fields: ["migration_id", "title", "status"], relationships: {} },
      { entity_name: "StateTransitionLog", description: "Audit log of entity state transitions", key_fields: ["entity_type", "entity_id", "prior_state", "new_state"], relationships: {} }
    ];

    const enums = {
      client_type: ["MSB", "DPMS", "RE Agent", "Accountant", "Securities Dealer", "Life Insurance", "Virtual Asset Service Provider", "Financial Entity", "Other"],
      client_status: ["Active", "Inactive", "Prospect"],
      engagement_type: ["Risk Assessment", "Compliance Audit", "Policy Package"],
      engagement_status: ["Not Started", "Intake In Progress", "Risk Analysis", "Draft Report", "Under Review", "Completed", "Archived"],
      risk_category: ["Products", "Delivery Channels", "Clients", "Geography", "Technology", "Sanctions", "Third Parties", "Operational"],
      control_category: ["Governance", "CDD", "EDD", "Sanctions", "Transaction Monitoring", "Reporting", "Technology Security", "Vendor Oversight", "Training", "Operations"],
      testing_method: ["Inquiry", "Observation", "Inspection", "Re-performance"],
      testing_frequency: ["Daily", "Weekly", "Monthly", "Quarterly", "Semi-Annually", "Annually", "Ad-hoc"],
      control_test_status: ["Planned", "In Progress", "Completed"],
      control_effectiveness: ["Effective", "Partially Effective", "Ineffective", "Not Tested"],
      test_cycle_status: ["Draft", "Active", "Complete", "Archived"],
      evidence_type: ["File", "URL", "Text"],
      evidence_review_status: ["Pending", "Reviewed", "Rejected"],
      finding_source_type: ["ControlTest", "Audit", "Manual"],
      finding_severity: ["Low", "Medium", "High", "Critical"],
      finding_status: ["Open", "Under Review", "Resolved", "Closed"],
      remediation_status: ["Planned", "In Progress", "Completed", "Verified"],
      risk_rating: ["Low", "Moderate", "High"],
      engagement_risk_status: ["Draft", "Under Review", "Final"],
      lifecycle_state: ["active", "deprecated", "archived"],
      review_state: ["legacy_unreviewed", "legacy_reviewed", "normalized", "none"],
      published_output_classification: ["tool", "report", "documentation", "help", "dashboard_widget", "internal_record", "verification_record", "audit_record", "delivery_gate_record", "system_export"],
      published_output_status: ["draft", "published", "archived", "failed"],
      published_output_display_zone: ["reports", "docs", "help", "tools", "dashboard", "internal_only"],
      upgrade_status: ["initialized", "in_progress", "delivery_gate_running", "delivery_gate_passed", "delivery_gate_failed", "completed", "archived"],
      delivery_gate_status: ["pending", "running", "passed", "failed", "blocked"],
      upgrade_audit_action: ["initialized", "delivery_gate_started", "delivery_gate_completed", "verification_record_created", "verification_record_updated", "audit_record_created", "marked_complete", "archived", "status_changed"],
      governance_rule_category: ["page_pattern", "naming", "artifact", "verification", "delivery_gate", "exception", "state_transition", "segregation_of_duties", "architecture_guardrail", "destructive_action"],
      governance_rule_severity: ["info", "warn", "error"],
      permission_action_type: ["view", "create", "edit", "delete", "approve", "reject", "publish", "archive", "override"],
      migration_status: ["pending", "running", "completed", "failed", "rolled_back"]
    };

    const functions = [
      { function_name: "calculateRiskCoverage", file_path: "functions/calculateRiskCoverage.js", description: "Deterministic engine calculating risk coverage status based on linked controls and test effectiveness", trigger_type: "manual", entities_accessed: ["RiskLibrary", "ControlLibrary", "ControlTest"], entities_written: [] },
       { function_name: "createVerificationArtifact", file_path: "functions/createVerificationArtifact.js", description: "CANONICAL: Creates verification_record artifacts (sole approved writer)", trigger_type: "internal", entities_accessed: ["UpgradeRegistry"], entities_written: ["PublishedOutput"] },
       { function_name: "exportArchitectureWithFiles", file_path: "functions/exportArchitectureWithFiles.js", description: "CANONICAL: Creates system_export artifacts with embedded file_manifest (sole approved writer)", trigger_type: "manual", entities_accessed: [], entities_written: ["PublishedOutput"] },
       { function_name: "runDeliveryGateChecks", file_path: "functions/runDeliveryGateChecks.js", description: "Executes delivery gate verification checks for upgrades", trigger_type: "internal", entities_accessed: ["UpgradeRegistry", "GovernanceRule"], entities_written: ["UpgradeAuditLog"] }
    ];

    const agents = [
      { agent_name: "task_manager", purpose: "Manage tasks and work items across the platform", trigger_event: "user_request", functions_called: ["bulkUpdateEntities"], entities_accessed: ["Task"], entities_written: ["Task"] }
    ];

    const pages = [
      { page_name: "Dashboard", route: "/Dashboard", visible_in_navigation: true, section: "MAIN", admin_only: false },
      { page_name: "Clients", route: "/Clients", visible_in_navigation: true, section: "WORK", admin_only: false },
      { page_name: "Engagements", route: "/Engagements", visible_in_navigation: true, section: "WORK", admin_only: false },
      { page_name: "ChangeLog", route: "/ChangeLog", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true }
    ];

    const artifactPipeline = {
      canonical_publishers: [
        { classification: "verification_record", canonical_writer: "createVerificationArtifact", description: "Canonical publisher for all verification_record artifacts", trigger: "upgrade_completion", routing: "ChangeLog.Verification" },
        { classification: "system_export", canonical_writer: "exportArchitectureWithFiles", description: "Canonical publisher for all system_export artifacts (architecture snapshots)", trigger: "manual_admin_invocation", routing: "ChangeLog.SystemArtifacts" }
      ],
      deprecated_writers: [
        { function: "generateVerificationArtifact", reason: "Replaced by createVerificationArtifact", status: "DEPRECATED" },
        { function: "publishVerificationRecord", reason: "Replaced by createVerificationArtifact", status: "DEPRECATED" },
        { function: "CentralPublisher", reason: "Replaced by classification-specific canonical publishers", status: "DEPRECATED" }
      ],
      pipeline_flow: "NW-UPGRADE-031: Single canonical writer per classification → Persistent storage → ChangeLog routing"
    };

    const summary = {
      export_date: new Date().toISOString(),
      product_version: "v0.7.0",
      upgrade_id: "NW-UPGRADE-031",
      upgrade_name: "Canonical Artifact Publishing & Code Audit",
      summary_statistics: {
        total_entities: entities.length,
        total_enums: Object.keys(enums).length,
        total_functions: functions.length,
        total_agents: agents.length,
        total_pages: pages.length,
        canonical_artifact_writers: 2,
        deprecated_writers_retired: 3
      },
      system_architecture: {
        description: "Nightwatch AML Compliance Platform - v0.7.0 Complete Architecture (Post-NW-UPGRADE-031 Refactor)",
        canonical_model: "Single canonical writer per classification - verification_record (createVerificationArtifact), system_export (exportArchitectureWithFiles)",
        version_normalization: "All active paths use v0.7.0",
        core_domains: [
          "Client & Engagement Management",
          "Risk Library & Library Management",
          "Control Testing & Evidence",
          "Findings & Remediation",
          "Governance & Compliance",
          "Upgrade & Artifact Management"
        ]
      }
    };

    // STEP 2: Generate canonical file manifest for persistent storage
    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];

    const fileManifest = {
      entities_export: {
        filename: `Nightwatch_Architecture_Entities_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify(entities, null, 2).length / 1024),
        count: entities.length,
        content: JSON.stringify(entities, null, 2)
      },
      enums_export: {
        filename: `Nightwatch_Architecture_Enums_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify(enums, null, 2).length / 1024),
        count: Object.keys(enums).length,
        content: JSON.stringify(enums, null, 2)
      },
      functions_export: {
        filename: `Nightwatch_Architecture_Functions_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify(functions, null, 2).length / 1024),
        count: functions.length,
        content: JSON.stringify(functions, null, 2)
      },
      agents_export: {
        filename: `Nightwatch_Architecture_Agents_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify(agents, null, 2).length / 1024),
        count: agents.length,
        content: JSON.stringify(agents, null, 2)
      },
      pages_export: {
        filename: `Nightwatch_Architecture_Pages_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify(pages, null, 2).length / 1024),
        count: pages.length,
        content: JSON.stringify(pages, null, 2)
      },
      artifact_pipeline_export: {
        filename: `Nightwatch_Architecture_ArtifactPipeline_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify(artifactPipeline, null, 2).length / 1024),
        content: JSON.stringify(artifactPipeline, null, 2)
      },
      scheduled_jobs_export: {
        filename: `Nightwatch_Architecture_ScheduledJobs_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify([{ job_name: "none_currently_configured", schedule: "N/A" }], null, 2).length / 1024),
        content: JSON.stringify([{ job_name: "none_currently_configured", schedule: "N/A", description: "No automated scheduled jobs are currently configured" }], null, 2)
      },
      architecture_summary_export: {
        filename: `Nightwatch_Architecture_Summary_v0.7.0_${dateStr}.json`,
        size_kb: Math.round(JSON.stringify(summary.system_architecture, null, 2).length / 1024),
        content: JSON.stringify(summary.system_architecture, null, 2)
      }
    };

    // STEP 3: Create artifact with file_manifest (canonical system_export publisher)
    const artifactRecord = await base44.asServiceRole.entities.PublishedOutput.create({
      outputName: `Nightwatch_SystemArchitecture_v0.7.0_NW-UPGRADE-031_${now.split('T')[0]}`,
      classification: ArtifactClassification.SYSTEM_EXPORT,
      subtype: 'architecture_export',
      is_runnable: false,
      is_user_visible: false,
      display_zone: 'internal_only',
      source_module: 'exportArchitectureWithFiles',
      source_event_type: 'architecture_export_complete',
      product_version: 'v0.7.0',
      upgrade_id: 'NW-UPGRADE-031',
      status: 'published',
      published_at: now,
      content: JSON.stringify({
        title: 'Nightwatch Architecture Export',
        description: 'Complete system architecture snapshot with all entities, enums, functions, agents, pages, and artifact pipeline definitions. Canonical export from NW-UPGRADE-031 refactor.',
        export_date: now,
        product_version: 'v0.7.0',
        upgrade_id: 'NW-UPGRADE-031',
        total_files: 8,
        canonical_publisher: 'exportArchitectureWithFiles'
      }),
      summary: `NW-UPGRADE-031: v0.7.0 system architecture: ${entities.length} entities, ${Object.keys(enums).length} enums, ${functions.length} functions. Canonical export with 8 downloadable files.`,
      metadata: JSON.stringify({
        export_version: 'v0.7.0',
        export_upgrade_id: 'NW-UPGRADE-031',
        export_timestamp: now,
        canonical_writer: 'exportArchitectureWithFiles',
        total_files: 8,
        file_manifest: fileManifest,
        canonical_shape: 'file_manifest_in_metadata',
        implementation_note: 'NW-UPGRADE-031: Canonical publisher for system_export classification. Embedded file_manifest guarantees persistence.'
      })
    });

    return Response.json({
      status: 'success',
      canonical_writer: 'exportArchitectureWithFiles',
      classification: 'system_export',
      artifact: {
        id: artifactRecord.id,
        title: artifactRecord.outputName,
        classification: artifactRecord.classification,
        product_version: artifactRecord.product_version,
        upgrade_id: artifactRecord.upgrade_id
      },
      files_embedded: 8,
      file_manifest_keys: Object.keys(fileManifest),
      message: 'NW-UPGRADE-031: Canonical system_export artifact created with all 8 files embedded in metadata.file_manifest. Visible in ChangeLog → System Artifacts tab.'
    });

  } catch (error) {
    console.error('[exportArchitectureWithFiles] Error:', error);
    return Response.json({
      error: 'Export failed',
      details: error.message
    }, { status: 500 });
  }
});