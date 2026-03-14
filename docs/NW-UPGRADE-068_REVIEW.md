# NW-UPGRADE-068 — System Hardening & Navigation Integrity Sweep (Review)

**Upgrade ID:** NW-UPGRADE-068  
**Risk:** MEDIUM  
**Branch:** nw-upgrade-068-system-hardening

---

## Implementation Plan

### Scope 1: Sidebar Route Audit

**ComplianceOperations** — DEAD_ROUTE. No .jsx file exists. Plan: Create a minimal placeholder page at `src/pages/ComplianceOperations.jsx` that links to existing operational pages (Engagements, ControlTests, TestCycles).

**ControlCoverageMap** — DEAD_ROUTE. No .jsx file exists. Plan: Create a minimal coverage dashboard page at `src/pages/ControlCoverageMap.jsx` that queries RiskLibrary and ControlTest to show coverage counts. Admin-only (already `adminOnly: true` in sidebar).

**AdminAuditPrograms** — ACTIVE_PAGE. No action needed.

**AdminAuditTemplates** — ACTIVE_PAGE. No action needed.

### Scope 2: Page Inventory Scan

Generate `docs/NW-UPGRADE-068_PAGE_INVENTORY.md` from the audit results.

### Scope 3: Navigation Integrity Check

Add a `navigationContracts` section to the `VerificationContractRegistry` in `verifyLatestBuild.ts`. The check will:
- Define the expected sidebar→page mapping
- Verify each sidebar target exists in the pages registry
- Report results as `navigation_integrity_check` in the artifact

### Scope 4: Fix engagement_name

In `Engagements.jsx` line 94, add `engagement_name` to the create payload:
```
engagement_name: `${client?.legal_name} - ${form.engagement_type}`,
```
This matches the pattern already used for Task creation on line 109.

### Scope 5: Orphan Object Detection

Create a read-only backend function `detectOrphanObjects.ts` that:
- Checks EvidenceItem records without valid procedure links
- Checks SampleItem records without valid SampleSet
- Checks RemediationAction records without valid Observation
- Returns counts only; does not delete

### Scope 6: Verification Contract Coverage

Add entity contracts for core entities not yet covered. Priority tier:
- **Tier 1 (core graph):** RiskLibrary, ControlTest, Finding, Client, Task
- **Tier 2 (testing):** TestCycle, ControlAssessment, EngagementRisk, ReviewArea

Remove duplicate SampleSet/SampleItem entries.

### Scope 7: Mutation Guardrails

Create a backend function `validateMutationGuardrails.ts` that checks:
- Cannot edit locked evidence (EvidenceItem where `locked_for_audit === true`)
- Cannot close Finding without verified RemediationAction
- Cannot delete AuditProcedure that has linked EvidenceItem

These are advisory checks callable before mutations.

### Scope 8: Navigation Health Artifact

Add `navigation_integrity_check` to the build verification artifact content with:
- sidebar_routes_valid (boolean)
- dead_routes_detected (count)
- orphan_pages_detected (count)

---

## Files to Change/Create

| File | Action |
|---|---|
| `src/pages/ComplianceOperations.jsx` | Create — minimal ops hub |
| `src/pages/ControlCoverageMap.jsx` | Create — minimal coverage dashboard |
| `src/pages/Engagements.jsx` | Fix — add engagement_name to create |
| `functions/verifyLatestBuild.ts` | Modify — add navigation/entity contracts, nav health artifact |
| `functions/detectOrphanObjects.ts` | Create — read-only orphan detection |
| `functions/validateMutationGuardrails.ts` | Create — advisory mutation guards |
| `docs/NW-UPGRADE-068_PAGE_INVENTORY.md` | Create — inventory report |
| `docs/NW-UPGRADE-068_RESULT.md` | Create — result summary |

---

## Regression Risks

| Risk | Mitigation |
|---|---|
| New pages crash at render | Following established patterns (AdminControlLibrary, AdminTestTemplates) |
| engagement_name change breaks V1 flow | Additive only — never removes fields, only adds |
| Verification content too large | Navigation check is a lightweight string comparison, no entity queries |
| Mutation guardrails false positive | Advisory only — returns pass/fail, does not block |

---

## Guardrails

- Do not modify core compliance graph
- Do not modify audit graph
- Do not introduce new entities
- Do not remove pages — only report orphans
- Keep new backend functions read-only except the mutation guard check
