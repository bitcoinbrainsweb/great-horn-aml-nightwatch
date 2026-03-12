import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// NW-UPGRADE-031G: Architecture Export with Real Persistent Files
// Generates export data, uploads files to persistent storage, then creates artifact
// Files FIRST, then artifact, never the reverse

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
      { function_name: "createVerificationArtifact", file_path: "functions/createVerificationArtifact.js", description: "Creates and publishes verification artifacts for upgrade records", trigger_type: "internal", entities_accessed: ["UpgradeRegistry", "PublishedOutput"], entities_written: ["PublishedOutput"] },
      { function_name: "generateVerificationArtifact", file_path: "functions/generateVerificationArtifact.js", description: "Generates verification records with comprehensive system state snapshots", trigger_type: "internal", entities_accessed: ["UpgradeRegistry"], entities_written: ["PublishedOutput"] },
      { function_name: "publishVerificationRecord", file_path: "functions/publishVerificationRecord.js", description: "Publishes verified records to appropriate display zones", trigger_type: "internal", entities_accessed: ["PublishedOutput"], entities_written: ["PublishedOutput"] },
      { function_name: "repairVerificationArtifacts", file_path: "functions/repairVerificationArtifacts.js", description: "Repairs incomplete or malformed verification artifacts", trigger_type: "manual", entities_accessed: ["PublishedOutput"], entities_written: ["PublishedOutput"] },
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
      artifact_types: [
        { type: "verification_record", description: "Verification artifacts documenting feature implementation and testing", creation_trigger: "upgrade_completion", publication_trigger: "delivery_gate_pass", routing_surfaces: ["ChangeLog"], classification: "verification_record" },
        { type: "system_export", description: "System architecture and configuration exports", creation_trigger: "manual_export", publication_trigger: "files_persisted", routing_surfaces: ["ChangeLog"], classification: "system_export" }
      ],
      pipeline_flow: "Generate Data → Persist Files → Create Artifact → Publish → Display Zone Routing"
    };

    const summary = {
      export_date: new Date().toISOString(),
      product_version: "v0.7.0",
      upgrade_id: "NW-UPGRADE-031G",
      summary_statistics: {
        total_entities: entities.length,
        total_enums: Object.keys(enums).length,
        total_functions: functions.length,
        total_agents: agents.length,
        total_pages: pages.length,
        artifact_pipeline_stages: 2
      },
      system_architecture: {
        description: "Nightwatch AML Compliance Platform - v0.7 Complete Architecture",
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

    // STEP 2: Upload files to persistent storage using platform's UploadFile integration
    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];
    const uploadedFiles = {};

    const files = {
      'entities.json': JSON.stringify(entities, null, 2),
      'enums.json': JSON.stringify(enums, null, 2),
      'functions.json': JSON.stringify(functions, null, 2),
      'agents.json': JSON.stringify(agents, null, 2),
      'pages.json': JSON.stringify(pages, null, 2),
      'artifact_pipeline.json': JSON.stringify(artifactPipeline, null, 2),
      'scheduled_jobs.json': JSON.stringify([{ job_name: "none_currently_configured", schedule: "N/A", description: "No automated scheduled jobs are currently configured in this version", function_called: "N/A", entities_accessed: [], entities_written: [] }], null, 2),
      'system_architecture_summary.md': `# Nightwatch Architecture Summary\n\n## Export Date\n${now}\n\n## Product Version\nv0.7.0\n\n## System Architecture\n\n${summary.system_architecture.description}\n\n### Core Domains\n${summary.system_architecture.core_domains.map(d => `- ${d}`).join('\n')}\n\n### Statistics\n- Entities: ${entities.length}\n- Enums: ${Object.keys(enums).length}\n- Functions: ${functions.length}\n- Agents: ${agents.length}\n- Pages: ${pages.length}`
    };

    // Upload each file
    for (const [filename, content] of Object.entries(files)) {
      try {
        // Create a text file blob and upload
        const blob = new TextEncoder().encode(content);
        const uploadResult = await base44.integrations.Core.UploadFile({
          file: blob
        });
        uploadedFiles[filename] = {
          url: uploadResult.file_url,
          size: Math.round(content.length / 1024),
          uploaded_at: now
        };
        console.log(`[exportArchitectureWithFiles] Uploaded ${filename}`);
      } catch (uploadError) {
        console.error(`[exportArchitectureWithFiles] Failed to upload ${filename}:`, uploadError);
        return Response.json({
          error: 'File upload failed',
          file: filename,
          details: uploadError.message
        }, { status: 500 });
      }
    }

    // STEP 3: Verify all files were uploaded
    if (Object.keys(uploadedFiles).length !== Object.keys(files).length) {
      return Response.json({
        error: 'File upload incomplete',
        uploaded: Object.keys(uploadedFiles).length,
        expected: Object.keys(files).length
      }, { status: 206 });
    }

    // STEP 4: Create artifact with file references
    const artifactRecord = await base44.asServiceRole.entities.PublishedOutput.create({
      outputName: 'Nightwatch Architecture Export',
      classification: 'system_export',
      subtype: 'architecture_export',
      is_runnable: false,
      is_user_visible: false,
      display_zone: 'internal_only',
      source_module: 'exportArchitectureWithFiles',
      source_event_type: 'architecture_export_complete',
      product_version: 'v0.7.0',
      upgrade_id: 'NW-UPGRADE-031G',
      status: 'published',
      published_at: now,
      content: JSON.stringify({
        title: 'Nightwatch Architecture Export',
        description: 'Complete system architecture snapshot with all entities, enums, functions, agents, pages, and artifact pipeline definitions',
        export_date: now,
        product_version: 'v0.7.0'
      }),
      summary: `Complete v0.7.0 system architecture: ${entities.length} entities, ${Object.keys(enums).length} enums, ${functions.length} functions, ${pages.length} pages. All files persisted and downloadable.`,
      metadata: JSON.stringify({
        export_version: 'v0.7.0',
        export_upgrade_id: 'NW-UPGRADE-031G',
        export_timestamp: now,
        total_files: 8,
        files: uploadedFiles,
        canonical_shape: 'files_in_metadata.files',
        implementation: 'Real persistent file storage via UploadFile integration'
      })
    });

    return Response.json({
      status: 'success',
      artifact: {
        id: artifactRecord.id,
        title: artifactRecord.outputName,
        classification: artifactRecord.classification,
        product_version: artifactRecord.product_version,
        upgrade_id: artifactRecord.upgrade_id
      },
      files_uploaded: Object.keys(uploadedFiles).length,
      files: uploadedFiles,
      message: 'Architecture export successfully generated with real persistent files'
    });

  } catch (error) {
    console.error('[exportArchitectureWithFiles] Error:', error);
    return Response.json({
      error: 'Export failed',
      details: error.message
    }, { status: 500 });
  }
});