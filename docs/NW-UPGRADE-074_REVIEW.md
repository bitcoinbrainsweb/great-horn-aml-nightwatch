# NW-UPGRADE-074 — Stable Test Selectors Foundation — REVIEW

## Exact Selector List to Implement

### Sidebar (Layout.jsx)

| item.page | data-test |
|-----------|-----------|
| Dashboard | nav-dashboard |
| ComplianceOperations | nav-compliance-ops |
| Clients | nav-clients |
| Engagements | nav-engagements |
| Tasks | nav-tasks |
| Reports | nav-reports |
| TestCycles | nav-test-cycles |
| ControlTests | nav-control-tests |
| ControlCoverageMap | nav-control-coverage-map |
| ReviewerDashboard | nav-reviewer |
| Findings | nav-findings |
| RemediationActions | nav-remediation-actions |
| AdminAuditPrograms | nav-audit-programs |
| AdminAudits | nav-audits |
| AdminAuditTemplates | nav-audit-templates |
| Admin | nav-admin |
| ChangeLog | nav-changelog |
| BuildVerificationDashboard | nav-build-verification |
| Feedback | nav-feedback |

### Page roots (wrapper div or existing root)

| File | data-test |
|------|-----------|
| Dashboard.jsx | page-dashboard |
| Clients.jsx | page-clients |
| Engagements.jsx | page-engagements |
| TestCycles.jsx | page-test-cycles |
| ControlTests.jsx | page-control-tests |
| ControlCoverageMap.jsx | page-control-coverage-map |
| Findings.jsx | page-findings |
| RemediationActions.jsx | page-remediation-actions |
| AdminAudits.jsx | page-admin-audits |
| AdminAuditPrograms.jsx | page-admin-audit-programs |
| AdminAuditTemplates.jsx | page-admin-audit-templates |

### Create buttons

| File | Button text | data-test |
|------|-------------|-----------|
| Clients.jsx | New Client | create-client-button |
| Engagements.jsx | New Engagement | create-engagement-button |
| TestCycles.jsx | New Test Cycle | create-test-cycle-button |
| ControlTests.jsx | New Test | create-control-test-button |
| AdminAudits.jsx | New Audit | create-audit-button |
| AdminAuditPrograms.jsx | New Program | create-audit-program-button |
| AdminAuditTemplates.jsx | New Template | create-audit-template-button |

### Form elements

| File | Element | data-test |
|------|---------|-----------|
| Clients.jsx | Legal Name input (New Client dialog) | client-name-input |
| AdminAudits.jsx | Audit Name input (New Audit dialog) | audit-name-input |
| AdminAudits.jsx | Engagement Select trigger (New Audit dialog) | audit-engagement-select |
| AdminAuditPrograms.jsx | Engagement Select trigger (Schedule dialog) | audit-program-engagement-select |

### Deferred

- **engagement-name-input**: Not present on V1 Engagements create form. Add in follow-up if smoke tests need EngagementDetailV2.

## Exact Files/Components to Update

1. **src/components/Layout.jsx** — Add `data-test={NAV_TEST_IDS[item.page]}` (or equivalent) to the nav `Link` (only for item with `.page`).
2. **src/pages/Dashboard.jsx** — Wrap main content in `<div data-test="page-dashboard">` or add to existing root.
3. **src/pages/Clients.jsx** — Root div `data-test="page-clients"`; Button `data-test="create-client-button"`; Input (Legal Name) `data-test="client-name-input"`.
4. **src/pages/Engagements.jsx** — Root `data-test="page-engagements"`; Button `data-test="create-engagement-button"`.
5. **src/pages/TestCycles.jsx** — Root `data-test="page-test-cycles"`; Button "New Test Cycle" `data-test="create-test-cycle-button"`.
6. **src/pages/ControlTests.jsx** — Root `data-test="page-control-tests"`; Button "New Test" `data-test="create-control-test-button"`.
7. **src/pages/ControlCoverageMap.jsx** — Root `data-test="page-control-coverage-map"`.
8. **src/pages/Findings.jsx** — Root `data-test="page-findings"`.
9. **src/pages/RemediationActions.jsx** — Root `data-test="page-remediation-actions"`.
10. **src/pages/AdminAudits.jsx** — Root `data-test="page-admin-audits"`; Button "New Audit" `data-test="create-audit-button"`; Audit Name Input `data-test="audit-name-input"`; Engagement Select SelectTrigger `data-test="audit-engagement-select"`.
11. **src/pages/AdminAuditPrograms.jsx** — Root `data-test="page-admin-audit-programs"`; Button "New Program" `data-test="create-audit-program-button"`; Schedule dialog Engagement SelectTrigger `data-test="audit-program-engagement-select"`.
12. **src/pages/AdminAuditTemplates.jsx** — Root `data-test="page-admin-audit-templates"`; Button "New Template" `data-test="create-audit-template-button"`.

## Ambiguous Naming Decisions

- **create-control-test-button**: ControlTests page uses "New Test" (not "New Control Test"); selector name matches prompt for consistency.
- **audit-engagement-select** / **audit-program-engagement-select**: Applied to `SelectTrigger` so the dropdown is targetable; content is in SelectContent.

## Rollback

- Remove all `data-test` attributes; no functional code changed. Safe to revert.
