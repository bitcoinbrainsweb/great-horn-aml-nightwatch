# NW-UPGRADE-074 — Stable Test Selectors Foundation — SANITYCHECK

## Risk Level: LOW

Additive-only: `data-test` attributes on existing elements. No behavior or styling changes.

## Scope

Add stable `data-test` attributes (lowercase kebab-case) to support Browser Use smoke testing:
- Core sidebar navigation links
- Key page root containers
- Primary create-action buttons
- Key form inputs/selects where present

## Exact Files Likely to Change

| File | Changes |
|------|--------|
| `src/components/Layout.jsx` | Add `data-test` to each nav `Link` (e.g. `data-test="nav-dashboard"`) |
| `src/pages/Dashboard.jsx` | Add root wrapper `data-test="page-dashboard"` |
| `src/pages/Clients.jsx` | Root `data-test="page-clients"`; New Client button `data-test="create-client-button"`; Legal Name input `data-test="client-name-input"` |
| `src/pages/Engagements.jsx` | Root `data-test="page-engagements"`; New Engagement button `data-test="create-engagement-button"` |
| `src/pages/TestCycles.jsx` | Root `data-test="page-test-cycles"`; New Test Cycle button `data-test="create-test-cycle-button"` |
| `src/pages/ControlTests.jsx` | Root `data-test="page-control-tests"`; New Test button `data-test="create-control-test-button"` |
| `src/pages/ControlCoverageMap.jsx` | Root `data-test="page-control-coverage-map"` |
| `src/pages/Findings.jsx` | Root `data-test="page-findings"` |
| `src/pages/RemediationActions.jsx` | Root `data-test="page-remediation-actions"` |
| `src/pages/AdminAudits.jsx` | Root `data-test="page-admin-audits"`; New Audit button `data-test="create-audit-button"`; Audit Name input `data-test="audit-name-input"`; Engagement Select `data-test="audit-engagement-select"` (on SelectTrigger) |
| `src/pages/AdminAuditPrograms.jsx` | Root `data-test="page-admin-audit-programs"`; New Program button `data-test="create-audit-program-button"`; Schedule dialog Engagement Select `data-test="audit-program-engagement-select"` |
| `src/pages/AdminAuditTemplates.jsx` | Root `data-test="page-admin-audit-templates"`; New Template button `data-test="create-audit-template-button"` |

## Selector Target List

### A. Core sidebar navigation (Layout.jsx)

Map from `NAV_ITEMS[].page` to stable `data-test`:

| Page | data-test |
|------|-----------|
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

### B. Page roots

| Page component | data-test |
|----------------|-----------|
| Dashboard | page-dashboard |
| Clients | page-clients |
| Engagements | page-engagements |
| TestCycles | page-test-cycles |
| ControlTests | page-control-tests |
| ControlCoverageMap | page-control-coverage-map |
| Findings | page-findings |
| RemediationActions | page-remediation-actions |
| AdminAudits | page-admin-audits |
| AdminAuditPrograms | page-admin-audit-programs |
| AdminAuditTemplates | page-admin-audit-templates |

### C. Create buttons

| Location | data-test |
|----------|-----------|
| Clients — "New Client" | create-client-button |
| Engagements — "New Engagement" | create-engagement-button |
| TestCycles — "New Test Cycle" | create-test-cycle-button |
| ControlTests — "New Test" | create-control-test-button |
| AdminAudits — "New Audit" | create-audit-button |
| AdminAuditPrograms — "New Program" | create-audit-program-button |
| AdminAuditTemplates — "New Template" | create-audit-template-button |

### D. Form elements

| Location | data-test |
|----------|-----------|
| AdminAudits — Audit Name input | audit-name-input |
| AdminAudits — Engagement select (trigger) | audit-engagement-select |
| AdminAuditPrograms — Schedule dialog Engagement select | audit-program-engagement-select |
| Clients — Legal Name input | client-name-input |
| Engagement name | engagement-name-input — DEFERRED (V1 create form has no engagement name field; only V2 edit form has it; add in follow-up if needed) |

## Duplicate or Ambiguous Targets

- None. Each selector is unique and maps to one logical element.
- "New Test" on ControlTests is the primary create action → `create-control-test-button`.

## Places to Defer

- **engagement-name-input**: Present only on EngagementDetailV2 (edit/create engagement name). V1 Engagements create form has Client + Type, no name field. Defer to avoid scope creep; can add in a later pass if smoke tests need it.

## Confirmation

- No changes to domain architecture, compliance graph, audit backend, help system, Control Coverage Map logic, verification contracts, Browser Use implementation, project bootstrap, or Coinbeast.
- Only `data-test` attributes added; no styling or behavior changes.

## Verdict

**LOW RISK** — Proceed with REVIEW then IMPLEMENT.
