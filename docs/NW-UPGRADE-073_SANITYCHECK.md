# NW-UPGRADE-073 — Dead Component Cleanup Pass — SANITYCHECK

## Risk Level: LOW

Read-only audit followed by deletion of confirmed-orphaned files only.
No architecture, domain, or runtime behavior changes.

## Audit Method

Every `.jsx` file under `src/components/` (148 files) was checked for importers across the entire `src/` tree.
A component is classified ORPHANED if no file outside itself (or another orphan) imports it.
Dynamic imports (`lazy()`, `import()`) were searched — none exist in this codebase.

---

## Classification Results

### SAFE TO REMOVE — 38 files

#### Orphaned Components (17 files)

| # | File | Reason |
|---|------|--------|
| 1 | `src/components/coverage/RiskCoverageDetail.jsx` | Only imports CoverageBadge (also orphaned). No page imports it. |
| 2 | `src/components/coverage/CoverageBadge.jsx` | Only imported by RiskCoverageDetail (also orphaned). No page imports it. |
| 3 | `src/components/reports/LiveReportPanel.jsx` | Self-only. No importers. |
| 4 | `src/components/evidence/ControlTestList.jsx` | Self-only. No importers. |
| 5 | `src/components/evidence/ControlEvidenceList.jsx` | Self-only. No importers. |
| 6 | `src/components/evidence/ControlConfidenceSummaryPanel.jsx` | Self-only. No importers. |
| 7 | `src/components/admin/VersionDashboard.jsx` | Self-only. No importers. |
| 8 | `src/components/admin/SystemConfigDashboard.jsx` | Self-only. No importers. |
| 9 | `src/components/admin/OutputClassificationDashboard.jsx` | Self-only. No importers. |
| 10 | `src/components/regression/BaselineApprovalPanel.jsx` | Self-only. No importers. |
| 11 | `src/components/processing/ProcessingJobProgress.jsx` | Self-only. No importers. |
| 12 | `src/components/narrative/NarrativeTemplateRenderer.jsx` | Self-only. No importers. |
| 13 | `src/components/observability/ExecutionMetricsDashboard.jsx` | Self-only. No importers. |
| 14 | `src/components/observability/SystemEventTimeline.jsx` | Self-only. No importers. |
| 15 | `src/components/feedback/FeedbackForm.jsx` | Self-only. FeedbackButton → FeedbackModal is the active chain; FeedbackForm is unused. |
| 16 | `src/components/tags/TagInput.jsx` | Self-only. No importers. |
| 17 | `src/components/filters/SavedFilters.jsx` | Self-only. No importers. |

#### Dead Docs Reports (21 files)

The entire `src/components/docs/` directory contains JSX report components for past upgrades.
**None** of these files are imported by any page or component in `src/`.
They are static upgrade-report artifacts that were never wired into the app.

| # | File |
|---|------|
| 18 | `src/components/docs/NW_UPGRADE_040_README.jsx` |
| 19 | `src/components/docs/NW_UPGRADE_047_REPORT.jsx` |
| 20 | `src/components/docs/NW_UPGRADE_048_REPORT.jsx` |
| 21 | `src/components/docs/NW_UPGRADE_049_REPORT.jsx` |
| 22 | `src/components/docs/NW_UPGRADE_050_REPORT.jsx` |
| 23 | `src/components/docs/NW_UPGRADE_051_REPORT.jsx` |
| 24 | `src/components/docs/NW_UPGRADE_052_REPORT.jsx` |
| 25 | `src/components/docs/NW_UPGRADE_059_REPORT.jsx` |
| 26 | `src/components/docs/NW_UPGRADE_060_REPORT.jsx` |
| 27 | `src/components/docs/NW_UPGRADE_061_REPORT.jsx` |
| 28 | `src/components/docs/NW_UPGRADE_062_REPORT.jsx` |
| 29 | `src/components/docs/NW_UPGRADE_063_REPORT.jsx` |
| 30 | `src/components/docs/NW_UPGRADE_064_REPORT.jsx` |
| 31 | `src/components/docs/NW_UPGRADE_065_REPORT.jsx` |
| 32 | `src/components/docs/NW_UPGRADE_066_REPORT.jsx` |
| 33 | `src/components/docs/NW_UPGRADE_067_REPORT.jsx` |
| 34 | `src/components/docs/NW_UPGRADE_067B_REPORT.jsx` |
| 35 | `src/components/docs/NW_UPGRADE_069A_REPORT.jsx` |
| 36 | `src/components/docs/NW_UPGRADE_069B_REPORT.jsx` |
| 37 | `src/components/docs/NW_UPGRADE_070_REPORT.jsx` |
| 38 | `src/components/docs/NW_UPGRADE_071_REPORT.jsx` |

---

### DEFER — 9 help system components

These are orphaned (no active page imports them) but are part of the help-system architecture
established in NW-UPGRADE-069A/069B. They reference each other in a chain and were designed
for future help-system expansion. Per standing rules: defer rather than delete when uncertain.

| # | File | Notes |
|---|------|-------|
| 1 | `src/components/help/PageHelpPanel.jsx` | Self-only. Planned for per-page help expansion. |
| 2 | `src/components/help/NextStepPanel.jsx` | Referenced by workflowHints + dead 069A report. |
| 3 | `src/components/help/ContextHelpPanel.jsx` | Referenced by dead 069A report only. |
| 4 | `src/components/help/pageHelpRegistry.jsx` | Referenced by ContextHelpPanel + dead 069A/B reports. |
| 5 | `src/components/help/SmartEmptyState.jsx` | Referenced by dead 069A report only. |
| 6 | `src/components/help/emptyStates.jsx` | Referenced by SmartEmptyState + dead 069A report. |
| 7 | `src/components/help/ComplianceTerm.jsx` | Referenced by helpDefinitions + dead 069A report. |
| 8 | `src/components/help/helpDefinitions.jsx` | Referenced by ComplianceTerm + dead 069A/B reports. |
| 9 | `src/components/help/workflowHints.jsx` | Referenced by NextStepPanel + dead 069A/B reports. |

---

### PRESERVE — confirmed active components

Key components verified as actively imported by pages or Layout:

- `Layout.jsx` — app shell
- `ChangeLogQuery.jsx` — used by ChangeLog, ArtifactDiagnostics
- `VerificationRecordCard.jsx` — used by ChangeLog, AdminChangeManagement
- `BuildVerificationSummary.jsx` — used by BuildVerificationDashboard
- `ReportPublicationDashboard.jsx` — used by ReportPublicationDebug (admin)
- `FeedbackButton.jsx` + `FeedbackModal.jsx` — used by Layout
- `GlobalSearch.jsx` — used by Layout
- `NextStepGuidance.jsx` — used by 10+ pages (active help system)
- `EvidenceCard.jsx` — used by ControlTests
- `RegressionRunDashboard.jsx` + `ScenarioLibraryView.jsx` — used by RegressionTestDashboard
- `RiskSnapshotPanel.jsx` — used by EngagementDetail
- All engagement tabs (SummaryTab, RisksTab, ControlsTab, ReviewTab, ReportTab, IntakeTab, etc.) — used by EngagementDetail/V2
- All audit components (RelationshipPanel, DefenseReadiness, AuditJumpLinks, WorkflowProgress) — used by audit pages
- All governance components — used by AdminGovernance pages
- All UI primitives (`src/components/ui/`) — used throughout

---

## Directories That Will Become Empty After Cleanup

- `src/components/docs/` (entire directory removed)
- `src/components/reports/`
- `src/components/processing/`
- `src/components/narrative/`
- `src/components/observability/`
- `src/components/tags/`
- `src/components/filters/`
- `src/components/coverage/`

---

## Cleanup Boundaries

- Only delete files with zero active importers
- No import path normalization
- No stylistic refactoring
- No changes to pages, routing, Layout, or verification logic
- No changes to help system behavior (NextStepGuidance remains active)
- No changes to backend functions

## Confirmation

- Release Controller: NOT affected
- ChangeLog behavior: NOT affected
- Canonical artifact classifications: NOT affected
- Verification downloads: NOT affected
- Help system (active): NOT affected
- Compliance graph: NOT affected
- Audit backend: NOT affected

## Verdict

**LOW RISK** — Proceed directly with implementation. No REVIEW file strictly required,
but one will be created per the upgrade protocol for documentation completeness.
