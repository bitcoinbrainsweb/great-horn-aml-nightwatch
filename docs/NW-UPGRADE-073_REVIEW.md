# NW-UPGRADE-073 — Dead Component Cleanup Pass — REVIEW

## Risk: LOW

## Exact Files Proposed for Deletion (38 files)

### Orphaned Components (17 files)

1. `src/components/admin/VersionDashboard.jsx`
2. `src/components/admin/SystemConfigDashboard.jsx`
3. `src/components/admin/OutputClassificationDashboard.jsx`
4. `src/components/coverage/CoverageBadge.jsx`
5. `src/components/coverage/RiskCoverageDetail.jsx`
6. `src/components/evidence/ControlTestList.jsx`
7. `src/components/evidence/ControlEvidenceList.jsx`
8. `src/components/evidence/ControlConfidenceSummaryPanel.jsx`
9. `src/components/feedback/FeedbackForm.jsx`
10. `src/components/filters/SavedFilters.jsx`
11. `src/components/narrative/NarrativeTemplateRenderer.jsx`
12. `src/components/observability/ExecutionMetricsDashboard.jsx`
13. `src/components/observability/SystemEventTimeline.jsx`
14. `src/components/processing/ProcessingJobProgress.jsx`
15. `src/components/regression/BaselineApprovalPanel.jsx`
16. `src/components/reports/LiveReportPanel.jsx`
17. `src/components/tags/TagInput.jsx`

### Dead Docs Report Components (21 files)

18. `src/components/docs/NW_UPGRADE_040_README.jsx`
19. `src/components/docs/NW_UPGRADE_047_REPORT.jsx`
20. `src/components/docs/NW_UPGRADE_048_REPORT.jsx`
21. `src/components/docs/NW_UPGRADE_049_REPORT.jsx`
22. `src/components/docs/NW_UPGRADE_050_REPORT.jsx`
23. `src/components/docs/NW_UPGRADE_051_REPORT.jsx`
24. `src/components/docs/NW_UPGRADE_052_REPORT.jsx`
25. `src/components/docs/NW_UPGRADE_059_REPORT.jsx`
26. `src/components/docs/NW_UPGRADE_060_REPORT.jsx`
27. `src/components/docs/NW_UPGRADE_061_REPORT.jsx`
28. `src/components/docs/NW_UPGRADE_062_REPORT.jsx`
29. `src/components/docs/NW_UPGRADE_063_REPORT.jsx`
30. `src/components/docs/NW_UPGRADE_064_REPORT.jsx`
31. `src/components/docs/NW_UPGRADE_065_REPORT.jsx`
32. `src/components/docs/NW_UPGRADE_066_REPORT.jsx`
33. `src/components/docs/NW_UPGRADE_067_REPORT.jsx`
34. `src/components/docs/NW_UPGRADE_067B_REPORT.jsx`
35. `src/components/docs/NW_UPGRADE_069A_REPORT.jsx`
36. `src/components/docs/NW_UPGRADE_069B_REPORT.jsx`
37. `src/components/docs/NW_UPGRADE_070_REPORT.jsx`
38. `src/components/docs/NW_UPGRADE_071_REPORT.jsx`

---

## Files Proposed for Import Cleanup Only

None. All 38 files above are leaf orphans with no active importers.
No other file needs import cleanup because no file imports these dead components.

---

## Files Explicitly Preserved and Why

### Help System Components (9 files — DEFERRED)

These are currently orphaned but are part of the help-system architecture from NW-UPGRADE-069A/069B.
They form a coherent subsystem intended for future page-level help expansion.

| File | Rationale |
|------|-----------|
| `src/components/help/PageHelpPanel.jsx` | Per-page help panel — future expansion |
| `src/components/help/NextStepPanel.jsx` | Workflow next-step panel — future expansion |
| `src/components/help/ContextHelpPanel.jsx` | Context-aware help — future expansion |
| `src/components/help/pageHelpRegistry.jsx` | Help registry data — needed by ContextHelpPanel |
| `src/components/help/SmartEmptyState.jsx` | Intelligent empty states — future expansion |
| `src/components/help/emptyStates.jsx` | Empty state definitions — needed by SmartEmptyState |
| `src/components/help/ComplianceTerm.jsx` | Compliance terminology tooltips — future expansion |
| `src/components/help/helpDefinitions.jsx` | Compliance term definitions — needed by ComplianceTerm |
| `src/components/help/workflowHints.jsx` | Workflow hint data — needed by NextStepPanel |

**Decision**: DEFER. These form the scaffolding for the help-system direction and may be
wired into production pages in a near-future upgrade. Deleting and recreating would be wasteful.

### Active Components (confirmed safe)

All components verified as actively imported remain untouched. See SANITYCHECK for full list.

---

## Special Attention: Help System

The docs report files `NW_UPGRADE_069A_REPORT.jsx` and `NW_UPGRADE_069B_REPORT.jsx` reference
several help components. Once these docs reports are deleted, the only references to the deferred
help components will be their internal cross-references. This is acceptable — they form a
self-contained subsystem awaiting integration.

The **active** help system component (`NextStepGuidance.jsx`) is imported by 10+ pages and
is NOT being touched.

---

## Rollback Considerations

- **Low risk**: All deleted files are available in git history
- **No code changes**: No imports to clean up in surviving files (no file imports any of the 38 targets)
- **No routing changes**: None of the deleted components have routes
- **No Layout changes**: None of the deleted components appear in sidebar or Layout
- **Rollback**: `git checkout HEAD~1 -- src/components/docs/ src/components/coverage/ ...` restores everything

---

## Implementation Plan

1. Delete all 38 files listed above
2. Verify no broken imports remain (grep for deleted component names)
3. Verify no linter errors introduced
4. Create RESULT and GATE docs
