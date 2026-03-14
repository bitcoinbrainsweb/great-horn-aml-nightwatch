# NW-UPGRADE-074 — Stable Test Selectors Foundation — RESULT

## Summary

Added stable `data-test` attributes (lowercase kebab-case) across core navigation, page roots, create-action buttons, and key form elements. No behavior or styling changes. All prior verified fixes remain intact.

---

## Files Changed (13)

| File | Changes |
|------|--------|
| `src/components/Layout.jsx` | Added `NAV_TEST_IDS` map; added `data-test={NAV_TEST_IDS[item.page]}` to each nav `Link` |
| `src/pages/Dashboard.jsx` | Root wrapper `data-test="page-dashboard"` (loading + main return) |
| `src/pages/Clients.jsx` | Root `data-test="page-clients"`; Button `data-test="create-client-button"`; Legal Name input `data-test="client-name-input"` |
| `src/pages/Engagements.jsx` | Root `data-test="page-engagements"`; Button `data-test="create-engagement-button"` |
| `src/pages/TestCycles.jsx` | Root `data-test="page-test-cycles"`; Button `data-test="create-test-cycle-button"` |
| `src/pages/ControlTests.jsx` | Root `data-test="page-control-tests"`; Button `data-test="create-control-test-button"` |
| `src/pages/ControlCoverageMap.jsx` | Root `data-test="page-control-coverage-map"` |
| `src/pages/Findings.jsx` | Root `data-test="page-findings"` |
| `src/pages/RemediationActions.jsx` | Root `data-test="page-remediation-actions"` |
| `src/pages/AdminAudits.jsx` | Root `data-test="page-admin-audits"`; Button `data-test="create-audit-button"`; Audit Name input `data-test="audit-name-input"`; Engagement SelectTrigger `data-test="audit-engagement-select"` |
| `src/pages/AdminAuditPrograms.jsx` | Root `data-test="page-admin-audit-programs"`; Button `data-test="create-audit-program-button"`; Schedule dialog Engagement SelectTrigger `data-test="audit-program-engagement-select"` |
| `src/pages/AdminAuditTemplates.jsx` | Root `data-test="page-admin-audit-templates"`; Button `data-test="create-audit-template-button"` |

---

## Selectors Added

### A. Sidebar navigation (19)

nav-dashboard, nav-compliance-ops, nav-clients, nav-engagements, nav-tasks, nav-reports, nav-test-cycles, nav-control-tests, nav-control-coverage-map, nav-reviewer, nav-findings, nav-remediation-actions, nav-audit-programs, nav-audits, nav-audit-templates, nav-admin, nav-changelog, nav-build-verification, nav-feedback

### B. Page roots (11)

page-dashboard, page-clients, page-engagements, page-test-cycles, page-control-tests, page-control-coverage-map, page-findings, page-remediation-actions, page-admin-audits, page-admin-audit-programs, page-admin-audit-templates

### C. Create buttons (7)

create-client-button, create-engagement-button, create-test-cycle-button, create-control-test-button, create-audit-button, create-audit-program-button, create-audit-template-button

### D. Form elements (4)

client-name-input, audit-name-input, audit-engagement-select, audit-program-engagement-select

---

## Selectors Deferred

- **engagement-name-input**: V1 Engagements create form has no engagement name field; only EngagementDetailV2 has it. Deferred; can add in a follow-up if Browser Use smoke tests need it.

---

## Validation Summary

| Check | Result |
|-------|--------|
| Broken imports | None |
| Broken routes | None |
| UI behavior changes | None |
| Selectors on intended elements | Yes |
| Linter errors introduced | None |
| Unrelated files changed | None |
| Prior major verified fixes | Intact |

---

## Notes for Browser Use Smoke-Test Setup

- **Navigation**: Use `[data-test^="nav-"]` or specific values (e.g. `[data-test="nav-dashboard"]`) to click sidebar items. Admin-only items (e.g. nav-control-coverage-map, nav-audits) require an admin/super_admin user.
- **Page presence**: After navigation, assert a single root with the matching page selector (e.g. `[data-test="page-dashboard"]`) to confirm the page loaded.
- **Create flows**: Click the corresponding `[data-test="create-*-button"]`, then fill or interact with form elements by their `data-test` (e.g. `client-name-input`, `audit-engagement-select`). Selects are on the trigger; opening the dropdown and choosing an option is environment-specific.
- **Naming**: All values are lowercase kebab-case. No new UI was added; selectors map to existing labels and actions.
