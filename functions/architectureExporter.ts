import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// NW-UPGRADE-031A: Architecture Export for External Code Audit
// Provides complete system architecture snapshot including entities, enums, functions, pages, and artifact pipeline

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Admin-only access: Technical Admin role required for external audit exports
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required for architecture export' }, { status: 403 });
    }

    const exportFormat = new URL(req.url).searchParams.get('format') || 'full';

    // PHASE 1: Entity Model Export
    const entities = [
      {
        entity_name: "Client",
        description: "AML client entity for engagement tracking",
        key_fields: ["legal_name", "client_type", "status"],
        relationships: { has_many: ["Engagement"] }
      },
      {
        entity_name: "Engagement",
        description: "AML compliance engagement for a client",
        key_fields: ["client_id", "engagement_type", "status"],
        relationships: { belongs_to: ["Client"], has_many: ["EngagementRisk", "Report"] }
      },
      {
        entity_name: "RiskLibrary",
        description: "Core and custom AML risk definitions",
        key_fields: ["risk_name", "risk_category", "lifecycle_state"],
        relationships: { has_many: ["EngagementRisk", "ControlLibrary"] }
      },
      {
        entity_name: "ControlLibrary",
        description: "Core and custom control definitions",
        key_fields: ["control_name", "control_category", "lifecycle_state"],
        relationships: { has_many: ["ControlTest"] }
      },
      {
        entity_name: "ControlTest",
        description: "Control test execution and effectiveness assessment",
        key_fields: ["control_library_id", "test_cycle_id", "status"],
        relationships: { belongs_to: ["ControlLibrary", "TestCycle"], has_many: ["Evidence", "Finding"] }
      },
      {
        entity_name: "TestCycle",
        description: "Control testing cycle definition and management",
        key_fields: ["name", "start_date", "status"],
        relationships: { has_many: ["ControlTest"] }
      },
      {
        entity_name: "Evidence",
        description: "Audit evidence attached to control tests",
        key_fields: ["control_test_id", "evidence_type"],
        relationships: { belongs_to: ["ControlTest"] }
      },
      {
        entity_name: "Finding",
        description: "Control test or audit findings",
        key_fields: ["title", "source_type", "severity", "status"],
        relationships: { has_many: ["RemediationAction"] }
      },
      {
        entity_name: "RemediationAction",
        description: "Remediation action tracking for findings",
        key_fields: ["finding_id", "title", "status"],
        relationships: { belongs_to: ["Finding"] }
      },
      {
        entity_name: "EngagementRisk",
        description: "Risk assessment and control effectiveness evaluation",
        key_fields: ["engagement_id", "risk_name", "status"],
        relationships: { belongs_to: ["Engagement", "RiskLibrary"] }
      },
      {
        entity_name: "PublishedOutput",
        description: "System-published verification records, reports, and artifacts",
        key_fields: ["outputName", "classification", "status"],
        relationships: { references: ["UpgradeRegistry"] }
      },
      {
        entity_name: "UpgradeRegistry",
        description: "Product upgrade tracking and lifecycle management",
        key_fields: ["upgrade_id", "product_version", "status"],
        relationships: { has_many: ["UpgradeAuditLog", "PublishedOutput"] }
      },
      {
        entity_name: "UpgradeAuditLog",
        description: "Detailed audit trail of upgrade lifecycle events",
        key_fields: ["upgrade_id", "action", "timestamp"],
        relationships: { belongs_to: ["UpgradeRegistry"] }
      },
      {
        entity_name: "GovernanceRule",
        description: "Governance and compliance rule definitions",
        key_fields: ["rule_id", "rule_name", "category"],
        relationships: {}
      },
      {
        entity_name: "PermissionDefinition",
        description: "Role-based access control permission definitions",
        key_fields: ["permission_id", "permission_key", "action_type"],
        relationships: {}
      },
      {
        entity_name: "StateMachineDefinition",
        description: "State machine definitions for entity lifecycle management",
        key_fields: ["machine_id", "entity_type", "initial_state"],
        relationships: {}
      },
      {
        entity_name: "MigrationRecord",
        description: "Data migration execution records",
        key_fields: ["migration_id", "title", "status"],
        relationships: {}
      },
      {
        entity_name: "StateTransitionLog",
        description: "Audit log of entity state transitions",
        key_fields: ["entity_type", "entity_id", "prior_state", "new_state"],
        relationships: {}
      }
    ];

    // PHASE 2: Enum Definition Export
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
      published_output_classification: ["tool", "report", "documentation", "help", "dashboard_widget", "internal_record", "verification_record", "audit_record", "delivery_gate_record"],
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

    // PHASE 3: Backend Function Registry Export
    const functions = [
      {
        function_name: "calculateRiskCoverage",
        file_path: "functions/calculateRiskCoverage.js",
        description: "Deterministic engine calculating risk coverage status based on linked controls and test effectiveness",
        trigger_type: "manual",
        entities_accessed: ["RiskLibrary", "ControlLibrary", "ControlTest"],
        entities_written: []
      },
      {
        function_name: "createVerificationArtifact",
        file_path: "functions/createVerificationArtifact.js",
        description: "Creates and publishes verification artifacts for upgrade records",
        trigger_type: "internal",
        entities_accessed: ["UpgradeRegistry", "PublishedOutput"],
        entities_written: ["PublishedOutput"]
      },
      {
        function_name: "generateVerificationArtifact",
        file_path: "functions/generateVerificationArtifact.js",
        description: "Generates verification records with comprehensive system state snapshots",
        trigger_type: "internal",
        entities_accessed: ["UpgradeRegistry"],
        entities_written: ["PublishedOutput"]
      },
      {
        function_name: "publishVerificationRecord",
        file_path: "functions/publishVerificationRecord.js",
        description: "Publishes verified records to appropriate display zones",
        trigger_type: "internal",
        entities_accessed: ["PublishedOutput"],
        entities_written: ["PublishedOutput"]
      },
      {
        function_name: "repairVerificationArtifacts",
        file_path: "functions/repairVerificationArtifacts.js",
        description: "Repairs incomplete or malformed verification artifacts",
        trigger_type: "manual",
        entities_accessed: ["PublishedOutput"],
        entities_written: ["PublishedOutput"]
      },
      {
        function_name: "runDeliveryGateChecks",
        file_path: "functions/runDeliveryGateChecks.js",
        description: "Executes delivery gate verification checks for upgrades",
        trigger_type: "internal",
        entities_accessed: ["UpgradeRegistry", "GovernanceRule"],
        entities_written: ["UpgradeAuditLog"]
      },
      {
        function_name: "initiateUpgrade",
        file_path: "functions/initializeUpgrade.js",
        description: "Initializes upgrade tracking and state machines",
        trigger_type: "manual",
        entities_accessed: [],
        entities_written: ["UpgradeRegistry", "UpgradeAuditLog"]
      },
      {
        function_name: "completeUpgrade",
        file_path: "functions/completeUpgrade.js",
        description: "Marks upgrade as complete with final verification",
        trigger_type: "manual",
        entities_accessed: ["UpgradeRegistry", "PublishedOutput"],
        entities_written: ["UpgradeRegistry", "UpgradeAuditLog"]
      },
      {
        function_name: "bulkUpdateEntities",
        file_path: "functions/bulkUpdateEntities.js",
        description: "Executes bulk update operations across entity types",
        trigger_type: "manual",
        entities_accessed: [],
        entities_written: []
      },
      {
        function_name: "exportEntityData",
        file_path: "functions/exportEntityData.js",
        description: "Exports entity data in multiple formats with filtering",
        trigger_type: "manual",
        entities_accessed: [],
        entities_written: []
      },
      {
        function_name: "executeGovernanceRule",
        file_path: "functions/executeGovernanceRule.js",
        description: "Executes governance rule checks and enforcement",
        trigger_type: "internal",
        entities_accessed: ["GovernanceRule"],
        entities_written: []
      },
      {
        function_name: "transitionState",
        file_path: "functions/transitionState.js",
        description: "Manages state machine transitions with permission enforcement",
        trigger_type: "internal",
        entities_accessed: ["StateMachineDefinition", "PermissionDefinition"],
        entities_written: ["StateTransitionLog"]
      },
      {
        function_name: "executeMigration",
        file_path: "functions/executeMigration.js",
        description: "Executes data migrations with rollback support",
        trigger_type: "manual",
        entities_accessed: [],
        entities_written: ["MigrationRecord"]
      },
      {
        function_name: "captureControlSnapshot",
        file_path: "functions/captureControlSnapshot.js",
        description: "Captures control state snapshot when test enters In Progress",
        trigger_type: "event",
        entities_accessed: ["ControlLibrary"],
        entities_written: ["ControlTest"]
      },
      {
        function_name: "validateEvidenceAttachment",
        file_path: "functions/validateEvidenceAttachment.js",
        description: "Validates and verifies evidence file integrity with SHA-256",
        trigger_type: "manual",
        entities_accessed: ["Evidence"],
        entities_written: ["Evidence"]
      }
    ];

    // PHASE 4: Agent Definition Export
    const agents = [
      {
        agent_name: "task_manager",
        purpose: "Manage tasks and work items across the platform",
        trigger_event: "user_request",
        functions_called: ["bulkUpdateEntities"],
        entities_accessed: ["Task"],
        entities_written: ["Task"]
      }
    ];

    // PHASE 5: Artifact Pipeline Export
    const artifactPipeline = {
      artifact_types: [
        {
          type: "verification_record",
          description: "Verification artifacts documenting feature implementation and testing",
          creation_trigger: "upgrade_completion",
          publication_trigger: "delivery_gate_pass",
          routing_surfaces: ["ChangeLog", "AdminDashboard"],
          classification: "verification_record"
        },
        {
          type: "delivery_gate_record",
          description: "Delivery gate execution records and test results",
          creation_trigger: "delivery_gate_run",
          publication_trigger: "delivery_gate_complete",
          routing_surfaces: ["AdminGovernance"],
          classification: "delivery_gate_record"
        },
        {
          type: "audit_record",
          description: "System audit and compliance records",
          creation_trigger: "audit_execution",
          publication_trigger: "audit_complete",
          routing_surfaces: ["AdminAuditLog"],
          classification: "audit_record"
        },
        {
          type: "report",
          description: "Generated reports and exports",
          creation_trigger: "report_generation",
          publication_trigger: "report_ready",
          routing_surfaces: ["Reports"],
          classification: "report"
        }
      ],
      pipeline_flow: "Entity Write → Event Trigger → Function Execution → Artifact Generation → Verification → Publication → Display Zone Routing"
    };

    // PHASE 6: Page Navigation Export
    const pages = [
    { page_name: "Dashboard", route: "/Dashboard", visible_in_navigation: true, section: "MAIN", admin_only: false },
    { page_name: "Clients", route: "/Clients", visible_in_navigation: true, section: "WORK", admin_only: false },
    { page_name: "ClientDetail", route: "/ClientDetail", visible_in_navigation: false, section: "WORK", admin_only: false },
    { page_name: "Engagements", route: "/Engagements", visible_in_navigation: true, section: "WORK", admin_only: false },
    { page_name: "EngagementDetail", route: "/EngagementDetail", visible_in_navigation: false, section: "WORK", admin_only: false },
    { page_name: "Tasks", route: "/Tasks", visible_in_navigation: true, section: "WORK", admin_only: false },
    { page_name: "Reports", route: "/Reports", visible_in_navigation: true, section: "WORK", admin_only: false },
    { page_name: "TestCycles", route: "/TestCycles", visible_in_navigation: true, section: "TESTING", admin_only: false },
    { page_name: "ControlTests", route: "/ControlTests", visible_in_navigation: true, section: "TESTING", admin_only: false },
    { page_name: "Findings", route: "/Findings", visible_in_navigation: true, section: "ISSUES", admin_only: false },
    { page_name: "RemediationActions", route: "/RemediationActions", visible_in_navigation: true, section: "ISSUES", admin_only: false },
    { page_name: "ReviewerDashboard", route: "/ReviewerDashboard", visible_in_navigation: true, section: "MAIN", admin_only: false },
    { page_name: "Admin", route: "/Admin", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminRiskLibrary", route: "/AdminRiskLibrary", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminControlLibrary", route: "/AdminControlLibrary", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminMethodologies", route: "/AdminMethodologies", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminNarratives", route: "/AdminNarratives", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminUsers", route: "/AdminUsers", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminInvitations", route: "/AdminInvitations", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminAuditLog", route: "/AdminAuditLog", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminJurisdictions", route: "/AdminJurisdictions", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminIndustries", route: "/AdminIndustries", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminTestScenarios", route: "/AdminTestScenarios", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminRiskProposals", route: "/AdminRiskProposals", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "LibraryReviewDashboard", route: "/LibraryReviewDashboard", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "AdminGovernance", route: "/AdminGovernance", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "ChangeLog", route: "/ChangeLog", visible_in_navigation: true, section: "GOVERNANCE", admin_only: true },
    { page_name: "ArtifactDiagnostics", route: "/ArtifactDiagnostics", visible_in_navigation: false, section: "GOVERNANCE", admin_only: true },
    { page_name: "Feedback", route: "/Feedback", visible_in_navigation: true, section: "MAIN", admin_only: false },
    { page_name: "Help", route: "/Help", visible_in_navigation: true, section: "MAIN", admin_only: false }
    ];

    // Note: ArchitectureExport is function-only (no page surface)—invoked directly via architectureExporter backend function by Technical Admin

    // PHASE 7: Scheduled Jobs Export
    const scheduledJobs = [
      {
        job_name: "none_currently_configured",
        schedule: "N/A",
        description: "No automated scheduled jobs are currently configured in this version",
        function_called: "N/A",
        entities_accessed: [],
        entities_written: []
      }
    ];

    // PHASE 8: Architecture Summary
    const summary = {
      export_date: new Date().toISOString(),
      product_version: "v0.6.0",
      upgrade_id: "NW-UPGRADE-031A",
      summary_statistics: {
        total_entities: entities.length,
        total_enums: Object.keys(enums).length,
        total_functions: functions.length,
        total_agents: agents.length,
        total_pages: pages.length,
        total_scheduled_jobs: 0,
        artifact_pipeline_stages: 5
      },
      system_architecture: {
        description: "Nightwatch AML Compliance Platform - v0.6 Complete Architecture",
        core_domains: [
          "Client & Engagement Management (Clients, Engagements)",
          "Risk Library & Library Management (RiskLibrary, ControlLibrary)",
          "Control Testing & Evidence (ControlTest, Evidence, TestCycle)",
          "Findings & Remediation (Finding, RemediationAction)",
          "Risk Assessment & Mapping (EngagementRisk, RiskControlMapping)",
          "Governance & Compliance (GovernanceRule, PermissionDefinition, StateMachineDefinition)",
          "Upgrade & Artifact Management (UpgradeRegistry, PublishedOutput, UpgradeAuditLog)",
          "Data Integrity (MigrationRecord, StateTransitionLog)"
        ],
        key_features: [
          "Deterministic risk coverage engine (calculateRiskCoverage)",
          "Comprehensive artifact pipeline with delivery gates",
          "State machine-based entity lifecycle management",
          "Role-based access control and permission enforcement",
          "Evidence integrity verification with SHA-256 hashing",
          "Upgrade tracking with verification records",
          "Governance rule enforcement with audit logging"
        ]
      }
    };

    // Return appropriate format
    if (exportFormat === 'summary') {
      return Response.json({ summary, total_pages: pages.length });
    }

    const fullExport = {
      export_metadata: {
        export_date: new Date().toISOString(),
        product_version: "v0.6.0",
        upgrade_id: "NW-UPGRADE-031A",
        format: "complete"
      },
      phase1_entities: entities,
      phase2_enums: enums,
      phase3_functions: functions,
      phase4_agents: agents,
      phase5_artifact_pipeline: artifactPipeline,
      phase6_pages: pages,
      phase7_scheduled_jobs: scheduledJobs,
      phase8_summary: summary
    };

    return Response.json(fullExport);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});