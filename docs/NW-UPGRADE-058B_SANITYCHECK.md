# NW-UPGRADE-058B — Fix Missing AdminTestTemplates Page (Sanity Check)

**Upgrade ID:** NW-UPGRADE-058B  
**Branch:** nw-upgrade-058-pre-audit-graph-verification-audit-v2

---

## Risk Classification: LOW

**Rationale:** This is a single missing file that is already imported and routed. The fix is to create the file using the same pattern as existing admin pages (e.g., `AdminControlLibrary.jsx`). No existing behavior changes; no other files need modification.

---

## Route/Page Mismatch Confirmed

- `src/pages.config.js` line 66: `import AdminTestTemplates from './pages/AdminTestTemplates';`
- `src/pages.config.js` line 124: `"AdminTestTemplates": AdminTestTemplates,`
- `src/pages/Admin.jsx` line 16: Routes "Test Templates" card to `AdminTestTemplates` page
- **File does not exist:** `src/pages/AdminTestTemplates.jsx` — confirmed absent on disk

Navigating to the AdminTestTemplates route will crash at import resolution.

---

## TestTemplate Entity Fields (from NW-047 report)

| Field | Type | Required |
|---|---|---|
| name | string | yes |
| description | string | no |
| test_type | enum (sample_review, data_validation, process_walkthrough, etc.) | yes |
| required_inputs | string/JSON | no |
| evidence_schema | string/JSON | no |
| result_metrics | string/JSON | no |
| default_execution_model | enum (manual, scheduled, automated) | no |
| test_objective_template | string | no |
| test_procedure_template | string | no |
| active | boolean | yes |
| category | string | no |
| tags | array | no |

---

## Implementation Plan

Create `src/pages/AdminTestTemplates.jsx` following the `AdminControlLibrary.jsx` pattern:
- List TestTemplate records with search and filter
- Create/edit form with the entity fields above
- Active/inactive status toggle
- Back link to Admin page

No other files need to change — the import and routing are already wired.

---

## REVIEW Required: No (low risk)
