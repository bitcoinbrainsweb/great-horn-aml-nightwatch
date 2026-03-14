# NW-UPGRADE-068C — Admin Audit Route Integrity Fix (Review)

**Upgrade ID:** NW-UPGRADE-068C  
**Risk:** MEDIUM

---

## Root Cause Summary

Pages exist on disk, are correctly imported/exported, and are registered in `pages.config.js`, but have no `<Route>` entries in `App.jsx`. The explicit React Router's catch-all (`path="*"`) renders `PageNotFound`, causing 404s.

This affects:
- 3 admin audit sidebar pages: AdminAudits, AdminAuditPrograms, AdminAuditTemplates
- 5 audit workflow child pages: AuditDetail, AuditFindings, AuditProcedureExecution, AuditReport, AuditReview
- 2 additional sidebar pages created in NW-UPGRADE-068: ComplianceOperations, ControlCoverageMap

---

## Exact Files to Change

| File | Change |
|---|---|
| `src/App.jsx` | Add 10 imports + 10 Route entries |

No other files need modification.

---

## Exact Fix Plan

Add to `App.jsx`:

**Imports (10):**
- AdminAudits
- AdminAuditPrograms
- AdminAuditTemplates
- AuditDetail
- AuditFindings
- AuditProcedureExecution
- AuditReport
- AuditReview
- ComplianceOperations
- ControlCoverageMap

**Routes (10):**
Each follows the exact same pattern already used throughout App.jsx:
```
<Route path="/PageName" element={<LayoutWrapper currentPageName="PageName"><PageName /></LayoutWrapper>} />
```

---

## Naming Mismatch

None found. All page names are consistent across:
- file names
- export function names
- pages.config.js keys
- Layout.jsx sidebar `page` values
- Layout.jsx active-state mappings

---

## Import/Export Mismatch

None found. All pages use `export default function PageName()` matching the import name.

---

## Admin Guard Behavior

Existing pattern for admin pages (AdminRiskLibrary, AdminControlLibrary, etc.) uses only sidebar-level `adminOnly: true` to hide nav items from non-admin users. No frontend component-level admin guards. This fix follows the same pattern — no frontend guard changes needed.

---

## Rollback

Revert the single App.jsx change. Zero risk of data loss or side effects.

---

## Pages NOT Fixed (Intentionally)

These pages are in pages.config.js but NOT in App.jsx and are NOT being fixed in this upgrade:
- PageInventoryAudit, RegressionTestDashboard, ReportPublicationDebug — hidden admin tools (068B), intentionally not sidebar items
- AdminChangeManagement, AdminGovernanceDocumentation, AdminSuggestions, AdminTestTemplates — not sidebar items, accessible through pages.config.js auto-routing only
