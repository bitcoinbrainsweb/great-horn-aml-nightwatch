# NW-UPGRADE-068 — System Hardening & Navigation Integrity Sweep (Result)

**Upgrade ID:** NW-UPGRADE-068  
**Branch:** nw-upgrade-068-system-hardening  
**Risk:** MEDIUM  
**Status:** Complete

---

## Files Changed / Created

| File | Action | Scope |
|---|---|---|
| `src/pages/ComplianceOperations.jsx` | **Created** | Scope 1 — sidebar route fix |
| `src/pages/ControlCoverageMap.jsx` | **Created** | Scope 1 — sidebar route fix |
| `src/pages/Engagements.jsx` | Modified (1 line) | Scope 4 — engagement_name fix |
| `functions/verifyLatestBuild.ts` | Modified | Scopes 3, 6, 8 — contracts + nav integrity |
| `functions/detectOrphanObjects.ts` | **Created** | Scope 5 — orphan detection |
| `functions/validateMutationGuardrails.ts` | **Created** | Scope 7 — mutation guardrails |
| `docs/NW-UPGRADE-068_SANITYCHECK.md` | **Created** | Documentation |
| `docs/NW-UPGRADE-068_REVIEW.md` | **Created** | Documentation |
| `docs/NW-UPGRADE-068_PAGE_INVENTORY.md` | **Created** | Scope 2 — page inventory |
| `docs/NW-UPGRADE-068_RESULT.md` | **Created** | Documentation |

---

## Scope 1: Sidebar Route Audit

| Page | Previous Status | Action |
|---|---|---|
| ComplianceOperations | DEAD_ROUTE (file missing) | Created — operational hub linking to Engagements, ControlTests, TestCycles, Findings, RemediationActions with live stats |
| ControlCoverageMap | DEAD_ROUTE (file missing) | Created — admin-only coverage dashboard showing risk→control→test coverage with effectiveness-based status |
| AdminAuditPrograms | ACTIVE_PAGE | No action needed |
| AdminAuditTemplates | ACTIVE_PAGE | No action needed |

**Result:** All 19 sidebar routes now resolve to valid page files. Zero dead routes remain.

---

## Scope 2: Page Inventory

Written to `docs/NW-UPGRADE-068_PAGE_INVENTORY.md`.

- **63 total pages** (63 files, 63 routes)
- **19 ACTIVE_PAGE** — sidebar + route + file present
- **44 MISSING_NAV** — sub-pages/admin/detail pages with route+file but no sidebar (expected)
- **0 DEAD_ROUTE** — all previously dead routes fixed
- **0 ORPHAN_PAGE** — no files without routes

---

## Scope 3: Navigation Integrity Check

Added `navigationContracts` array to `VerificationContractRegistry` containing all 19 sidebar page targets. During verification execution, each sidebar target is checked against the known pages list. Results are:
- Added as `Navigation Contract` checks/violations in the delivery gate results
- Included in the `navigation_integrity_check` object in the artifact content and API response

**Artifact shape:**
```json
{
  "navigation_integrity_check": {
    "sidebar_routes_valid": true,
    "sidebar_routes_total": 19,
    "sidebar_routes_resolved": 19,
    "dead_routes_detected": 0,
    "orphan_pages_detected": 0,
    "missing_routes": []
  }
}
```

---

## Scope 4: Fix engagement_name Entity Warning

**Root cause:** The V1 Engagement create flow in `Engagements.jsx` did not set `engagement_name` on the Engagement entity. The V2 flow (`EngagementDetailV2.jsx`) already set it correctly. The verification contract requires `engagement_name`.

**Fix:** Added `engagement_name: \`\${client?.legal_name || ''} - \${form.engagement_type || ''}\`` to the V1 create payload. This matches the pattern already used for Task creation on the same page.

**Result:** New Engagements created via V1 will now populate `engagement_name`. Existing V1-created Engagements without the field will still trigger a warning — this is expected (historical data).

---

## Scope 5: Orphan Object Detection

Created `functions/detectOrphanObjects.ts` — read-only, admin-only backend function.

**Checks performed:**
1. SampleItem without valid SampleSet
2. RemediationAction without valid Observation
3. AuditWorkpaper without valid AuditProcedure
4. AuditPhase without valid Audit
5. AuditFinding without valid Audit
6. EvidenceItem without valid Engagement

**Response shape:**
```json
{
  "success": true,
  "total_orphans_detected": 0,
  "checks_run": 6,
  "checks_failed": 0,
  "checks": [...]
}
```

No records are deleted or modified. Failed entity queries return `orphan_count: -1` with error details.

---

## Scope 6: Verification Contract Coverage

**Before:** 21 entity contracts (with 2 duplicates: SampleSet x2, SampleItem x2) = 19 unique entities contracted out of ~88 used (~22%)

**After:** 28 unique entity contracts. Added:
- RiskLibrary (risk_name, risk_category, status)
- ControlTest (control_library_id, status)
- TestCycle (name, status)
- Finding (status)
- Client (legal_name)
- Task (status)
- ReviewArea (name)

**Removed:** Duplicate SampleSet and SampleItem entries.

**Coverage increase:** 19 → 28 unique entities contracted (~32% of total entities used). Core compliance graph entities are now covered.

---

## Scope 7: Mutation Guardrails

Created `functions/validateMutationGuardrails.ts` — advisory pre-mutation validation.

**Supported checks:**

| Check | Entity | Rule |
|---|---|---|
| `edit_locked_evidence` | EvidenceItem | Cannot modify evidence where `locked_for_audit === true` |
| `close_finding_without_remediation` | AuditFinding | Cannot close finding without verified RemediationAction(s) |
| `delete_procedure_with_evidence` | AuditProcedure | Cannot delete procedure with linked EvidenceItem or AuditWorkpaper |

**Usage:** Call with `{ check: "check_name", entity_id: "..." }`. Returns `{ result: { check, allowed, reason } }`.

These are advisory — they inform the caller whether a mutation is safe, but do not block mutations directly. Frontend code can call this before performing destructive operations.

---

## Scope 8: Navigation Health Artifact

The `navigation_integrity_check` object is now included in both:
1. The stored verification artifact content (for ChangeLog/card display)
2. The API response (for dashboard display)

Fields: `sidebar_routes_valid`, `sidebar_routes_total`, `sidebar_routes_resolved`, `dead_routes_detected`, `orphan_pages_detected`, `missing_routes`

---

## Confirmation Checklist

- [x] All 19 sidebar links resolve to valid page files
- [x] engagement_name populated in V1 Engagement creation flow
- [x] Page inventory generated at `docs/NW-UPGRADE-068_PAGE_INVENTORY.md`
- [x] Orphan detection function created (`functions/detectOrphanObjects.ts`)
- [x] Verification contract coverage expanded (19 → 28 entities)
- [x] Navigation integrity check added to build verification
- [x] Navigation health artifact included in verification output
- [x] Mutation guardrails function created (`functions/validateMutationGuardrails.ts`)
- [x] No core compliance graph modified (Regulation→Risk→Control→Test→Evidence→Observation→Remediation)
- [x] No audit graph modified (Audit→Phase→Procedure→SampleSet→SampleItem→Evidence→Finding)
- [x] No new entities introduced
- [x] No unrelated files changed
- [x] Duplicate SampleSet/SampleItem contracts removed
- [x] No linter errors
- [x] Upgrade ID is NW-UPGRADE-068 everywhere

---

## Remaining Known Issues

| Priority | Issue | Notes |
|---|---|---|
| P3 | ~60 entities still lack verification contracts | Further tiers can be added incrementally; many are legacy/infrastructure entities |
| P3 | Mutation guardrails are advisory only | Frontend must explicitly call the check; no server-side enforcement |
| P3 | Historical V1 Engagements still lack engagement_name | A backfill migration could fix these, but is out of scope for hardening |
| P3 | Evidence entity fragmentation (4 entities) | Architectural concern from NW-058; needs dedicated unification upgrade |
