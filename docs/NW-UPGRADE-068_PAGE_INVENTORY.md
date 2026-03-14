# NW-UPGRADE-068 — Page Inventory

**Upgrade ID:** NW-UPGRADE-068  
**Generated from:** current branch state (post-fix)  
**Total pages:** 63 files | 63 routes | 19 sidebar entries

---

## Sidebar Navigation Items (19)

| # | Sidebar Label | Route Key | Admin Only | File Exists | Status |
|---|---|---|---|---|---|
| 1 | Dashboard | Dashboard | No | Yes | ACTIVE_PAGE |
| 2 | Compliance Ops | ComplianceOperations | No | Yes | ACTIVE_PAGE |
| 3 | Clients | Clients | No | Yes | ACTIVE_PAGE |
| 4 | Engagements | Engagements | No | Yes | ACTIVE_PAGE |
| 5 | Tasks | Tasks | No | Yes | ACTIVE_PAGE |
| 6 | Reports | Reports | No | Yes | ACTIVE_PAGE |
| 7 | Test Cycles | TestCycles | No | Yes | ACTIVE_PAGE |
| 8 | Control Tests | ControlTests | No | Yes | ACTIVE_PAGE |
| 9 | Coverage Map | ControlCoverageMap | Yes | Yes | ACTIVE_PAGE |
| 10 | Reviewer | ReviewerDashboard | No | Yes | ACTIVE_PAGE |
| 11 | Findings | Findings | No | Yes | ACTIVE_PAGE |
| 12 | Remediation Actions | RemediationActions | No | Yes | ACTIVE_PAGE |
| 13 | Audit Programs | AdminAuditPrograms | Yes | Yes | ACTIVE_PAGE |
| 14 | Audits | AdminAudits | Yes | Yes | ACTIVE_PAGE |
| 15 | Templates | AdminAuditTemplates | Yes | Yes | ACTIVE_PAGE |
| 16 | Admin | Admin | No | Yes | ACTIVE_PAGE |
| 17 | ChangeLog | ChangeLog | Yes | Yes | ACTIVE_PAGE |
| 18 | Build Verification | BuildVerificationDashboard | Yes | Yes | ACTIVE_PAGE |
| 19 | Feedback | Feedback | No | Yes | ACTIVE_PAGE |

**All 19 sidebar routes now resolve to valid page files.**

---

## All Routed Pages (63)

### ACTIVE_PAGE — Sidebar + Route + File (19 pages)

Dashboard, ComplianceOperations, Clients, Engagements, Tasks, Reports, TestCycles, ControlTests, ControlCoverageMap, ReviewerDashboard, Findings, RemediationActions, AdminAuditPrograms, AdminAudits, AdminAuditTemplates, Admin, ChangeLog, BuildVerificationDashboard, Feedback

### MISSING_NAV — Route + File, No Sidebar Entry (44 pages)

These are sub-pages, detail views, admin panels, and diagnostic pages navigated to programmatically. This is expected behavior.

**Admin sub-pages (accessed from Admin hub):**
AdminAuditLog, AdminChangeManagement, AdminControlLibrary, AdminEngagementSetup, AdminGovernance, AdminGovernanceDocumentation, AdminIndustries, AdminInvitations, AdminJurisdictions, AdminMethodologies, AdminNarratives, AdminRiskLibrary, AdminRiskProposals, AdminSuggestions, AdminTestScenarios, AdminTestTemplates, AdminUsers

**Detail/child pages:**
AuditDetail, AuditFindings, AuditProcedureExecution, AuditReport, AuditReview, ClientDetail, EngagementControlTesting, EngagementDetail, EngagementDetailV2

**V2/alternate pages:**
EngagementsV2

**Library/review:**
LibraryReviewDashboard

**Diagnostic/delivery gate pages:**
ArtifactDiagnostics, DeterministicEngineArchitecture, DeterministicEngineUpgradeSummary, GovernanceDeliveryGateSummary, Help, HistoricalNormalizationSummary, InfrastructureLayerOverview, NW010DeliveryGateSummary, NW013DeliveryGateFinal, NW040UpgradeSummary, PageInventoryAudit, PromptTemplateSystemSummary, PublishNW013, RegressionTestDashboard, ReportPublicationDebug, RunNW040Verification

### DEAD_ROUTE — Route exists but file missing (0)

None. All previously dead routes have been fixed in this upgrade.

### ORPHAN_PAGE — File exists but no route (0)

None. Every .jsx file has a matching pages.config.js entry.

---

## Previously Dead Routes (Fixed in NW-UPGRADE-068)

| Route | Previous Status | Fix Applied |
|---|---|---|
| ComplianceOperations | DEAD_ROUTE (file missing) | Created `src/pages/ComplianceOperations.jsx` — ops hub with links to testing/remediation |
| ControlCoverageMap | DEAD_ROUTE (file missing) | Created `src/pages/ControlCoverageMap.jsx` — admin-only coverage dashboard |
