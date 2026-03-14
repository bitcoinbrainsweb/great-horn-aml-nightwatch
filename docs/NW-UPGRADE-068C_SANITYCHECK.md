# NW-UPGRADE-068C — Admin Audit Route Integrity Fix (Sanity Check)

**Upgrade ID:** NW-UPGRADE-068C  
**Branch:** nw-upgrade-068c-admin-audit-route-fix  
**Risk:** MEDIUM

---

## Root Cause

The app uses an explicit React Router in `App.jsx` with a `<Route path="*">` catch-all that renders `PageNotFound`. Pages must be registered in `App.jsx` with explicit `<Route>` entries to be reachable. The Base44 `pages.config.js` auto-routing is superseded by the explicit router.

**AdminAudits, AdminAuditPrograms, and AdminAuditTemplates** all exist as files, are correctly imported/exported, and are registered in `pages.config.js` — but **none have `<Route>` entries in `App.jsx`**. Any navigation to `/AdminAudits`, `/AdminAuditPrograms`, or `/AdminAuditTemplates` falls to the catch-all 404.

The same gap affects 5 audit child/detail pages that AdminAudits navigates to.

---

## Full Chain Audit

### AdminAudits

| Check | Status |
|---|---|
| File exists: `src/pages/AdminAudits.jsx` | PASS |
| Export/import valid | PASS — `export default function AdminAudits()` |
| pages.config.js entry | PASS — import L54, PAGES L109 |
| App.jsx route | **FAIL — no Route entry** |
| Sidebar mapping | PASS — Layout.jsx L35: `{ name: 'Audits', icon: Briefcase, page: 'AdminAudits', adminOnly: true }` |
| Admin guard | N/A — follows existing pattern (sidebar `adminOnly` hides from non-admins; no frontend component guard) |

### AdminAuditPrograms

| Check | Status |
|---|---|
| File exists: `src/pages/AdminAuditPrograms.jsx` | PASS |
| Export/import valid | PASS |
| pages.config.js entry | PASS — import L52, PAGES L107 |
| App.jsx route | **FAIL — no Route entry** |
| Sidebar mapping | PASS — Layout.jsx L34: `{ name: 'Audit Programs', page: 'AdminAuditPrograms', adminOnly: true }` |

### AdminAuditTemplates

| Check | Status |
|---|---|
| File exists: `src/pages/AdminAuditTemplates.jsx` | PASS |
| Export/import valid | PASS |
| pages.config.js entry | PASS — import L53, PAGES L108 |
| App.jsx route | **FAIL — no Route entry** |
| Sidebar mapping | PASS — Layout.jsx L36: `{ name: 'Templates', page: 'AdminAuditTemplates', adminOnly: true }` |

### Audit Child/Detail Pages (also missing from App.jsx)

| Page | File exists | pages.config.js | App.jsx route | Navigated from |
|---|---|---|---|---|
| AuditDetail | YES | YES (L72, L127) | **FAIL** | AdminAudits → `createPageUrl('AuditDetail?id=...')` |
| AuditFindings | YES | YES (L73, L128) | **FAIL** | Audit workflow |
| AuditProcedureExecution | YES | YES (L74, L129) | **FAIL** | Audit workflow |
| AuditReport | YES | YES (L75, L130) | **FAIL** | Audit workflow |
| AuditReview | YES | YES (L76, L131) | **FAIL** | Audit workflow |

---

## Other Sidebar Pages Also Missing Routes (Out of Primary Scope)

| Page | Sidebar item | App.jsx route |
|---|---|---|
| ComplianceOperations | Yes — `'Compliance Ops'` | **MISSING** |
| ControlCoverageMap | Yes — `'Coverage Map'` (adminOnly) | **MISSING** |

These share the same root cause and will also be fixed in this upgrade since they are sidebar items that 404.

---

## Risk Assessment

- **MEDIUM** — adding Route entries is straightforward but touches App.jsx (central routing file)
- No architectural changes
- No data model changes
- No admin guard pattern changes (follows existing convention)
- REVIEW file required
