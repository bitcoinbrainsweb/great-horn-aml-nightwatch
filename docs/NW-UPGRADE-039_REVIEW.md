# NW-UPGRADE-039 — Hardening Fix Bundle (Review Plan)

This document outlines the proposed hardening changes for NW-UPGRADE-039, based on findings from NW-UPGRADE-038.  
**No code has been modified yet.**

Because this upgrade is classified as **REVIEW (MEDIUM RISK)**, these plans should be reviewed and approved before implementation.

---

## 1. Summary of goals

NW-UPGRADE-039 aims to:

1. **Harden artifact writers** so normal flows consistently use canonical gateways and legacy/repair paths are clearly identified.
2. **Tighten permissions** on high-impact backend functions (migrations, repairs, infrastructure tools).
3. **Clarify the risk/control coverage contract** and centralize minimal coverage semantics.
4. **Add data health checks** for risk/control/test relationships (non-destructive).
5. **Label legacy/repair utilities** so they are not mistaken for canonical paths.

All while:

- Preserving **Release Controller authority**.
- Keeping **ChangeLog behavior** stable.
- Leaving **canonical classifications and verification downloads** unchanged.

---

## 2. Proposed changes by area

### 2.1 Artifact writer hardening

**Targets:**

- Canonical paths:
  - `functions/publishCanonicalArtifact.ts`
  - `functions/createVerificationArtifact.ts`
- Known non-canonical writers:
  - Historical upgrades:
    - `functions/completeUpgradeNW015.ts`
    - `functions/completeUpgradeNW016.ts`
    - `functions/completeUpgradeNW016A.ts`
  - Backfills and repairs:
    - `functions/BackfillHistoricalRecords.ts`
    - `functions/NormalizeVerificationReports.ts`
    - `functions/repairVerificationArtifacts.ts`
    - `functions/backendInfrastructureVerification.ts`
  - Architecture/system exports:
    - `functions/exportArchitectureWithFiles.ts`
    - `functions/architectureExporter.ts`
  - Other:
    - `functions/auditPageArchitecture.ts`

**Planned hardening:**

- **Step 1: Label legacy/repair writers**
  - Add clear comments near `PublishedOutput.create` / `update` calls:
    - Mark functions as **legacy**, **backfill**, or **repair-only**.
    - Explicitly state that they are **not** part of the normal Release Controller path.

- **Step 2: Gentle gateway adoption where trivial**
  - For a small subset of writers whose payloads already match canonical patterns (e.g., some system exports):
    - Route their `PublishedOutput.create` through `publishCanonicalArtifact` **without changing semantics**, if the mapping is straightforward.
  - Keep this minimal; avoid restructuring complex writers in this upgrade.

- **Step 3: Document non-canonical allowlist**
  - In `docs` (and possibly a small helper), list:
    - Which functions are explicitly permitted to write directly to `PublishedOutput` (backfills, repairs).
    - Why they are allowed and under which conditions (e.g., admin-only, one-time migrations).

**Open design decisions (for review):**

- Which, if any, non-Upgrade writers should be routed through `publishCanonicalArtifact` in NW-039 vs. deferred to a later upgrade.

---

### 2.2 Permissions hardening

**Targets (examples, not exhaustive):**

- Repair/migration tools:
  - `functions/repairArtifactClassificationsNW034.ts`
  - `functions/NormalizeVerificationReports.ts`
  - `functions/BackfillHistoricalRecords.ts`
  - `functions/backfillLibraryReviewState.ts`
  - `functions/backfillReviewStateFast.ts`
  - `functions/migrateWorkflowStates.ts`
  - `functions/migrateControlsToUnifiedSystem.ts`
- Infrastructure/system verifiers:
  - `functions/verifyNightwatchSystemContract.ts`
  - `functions/verifyInfrastructureLayer.ts`
  - `functions/comprehensiveSystemAudit.ts`
  - `functions/systemAudit.ts`

**Planned hardening:**

- **Step 1: Role audit**
  - For each high-impact function:
    - Confirm its intended audience: `admin`, `super_admin`, or broader.
    - Document expectations in a short comment near the entrypoint.

- **Step 2: Tighten checks where needed**
  - If a function:
    - Alters system state (migrations, repair, backfills), or
    - Writes verification/PublishedOutput artifacts,
  - Then:
    - Enforce explicit admin-level roles (e.g. `user.role` in `['admin', 'super_admin']`).

- **Step 3: Keep read-only verifiers broad where safe**
  - For functions that are strictly read-only (e.g. some audits), consider:
    - Keeping them accessible to all authenticated users, or
    - Restricting them to admins only if they expose sensitive system details.

**Open design decisions (for review):**

- Exact role policies for each tool (e.g. whether some audits should be admin-only vs. any authenticated technical user).

---

### 2.3 Risk/control coverage contract

**Targets:**

- `functions/calculateRiskCoverage.ts`
- `functions/riskControlMappingEngine.ts`
- `functions/deterministicRiskEngine.ts`
- `functions/controlEffectivenessCalculator.ts`
- `functions/controlScoringEngine.ts`
- Any new small helper (e.g. `riskCoverageContract.ts`).

**Proposed contract (initial):**

At minimum, coverage results should clearly distinguish:

- `UNCONTROLLED` / `UNMAPPED`: risks with **no mapped controls**.
- `NOT_TESTED`: risks whose mapped controls exist but have **no tests**.
- `INEFFECTIVE`: risks where mapped controls are tested and **all are ineffective**.
- `PARTIALLY_COVERED`: risks where **some** controls are effective and some are not or not tested.
- `COVERED`: risks where **all mapped controls are effective** (or meet a configurable threshold).

**Planned hardening:**

- **Step 1: Introduce a tiny shared helper**
  - E.g. `riskCoverageContract.ts` exposing:
    - Types/enums for coverage states.
    - A small function that, given:
      - total_controls, tested_controls, effective_controls,
    - Returns a canonical coverage state.

- **Step 2: Apply helper to coverage logic**
  - Update `calculateRiskCoverage.ts` (and related engines where minimal) to:
    - Use the shared helper for deciding coverage state.
    - Keep existing API shapes but align semantics.

**Open design decisions (for review):**

- Whether to:
  - Adjust existing output enums/strings, or
  - Keep legacy naming and only align internal semantics.

---

### 2.4 Data health checks

**Targets:**

- New read-only function(s), e.g.:
  - `functions/verifyRiskControlIntegrity.ts`

**Planned behavior:**

- **Read-only integrity report** that:
  - Lists:
    - Risks without mappings (where mappings are expected by configuration).
    - Mappings referencing missing controls.
    - Control tests referencing missing controls or invalid states.
  - Returns JSON like:
    ```json
    {
      "success": true,
      "checks": [...],
      "warnings": [...],
      "violations": [...]
    }
    ```
- Patterned after `verifyNightwatchSystemContract.ts`:
  - No writes.
  - Admin-only by default.

**Open design decisions (for review):**

- Exact thresholds for what counts as a “violation” vs. “warning”.

---

### 2.5 Legacy / repair labeling

**Targets:**

- Historical upgrade and repair functions:
  - `completeUpgradeNW015.ts`, `completeUpgradeNW016.ts`, `completeUpgradeNW016A.ts`
  - `BackfillHistoricalRecords.ts`, `NormalizeVerificationReports.ts`, `repairVerificationArtifacts.ts`
  - Other backfill/migration scripts.

**Planned actions:**

- Add clear comments at file headers and critical functions stating:
  - The function’s purpose (migration/repair/historical support).
  - That it is **not** part of the canonical upgrade or artifact publishing path.
  - Any constraints (e.g. “one-time use”, “admin-only”, “run under ops supervision”).

---

## 3. Risk assessment and guardrails

- **Risk classification for NW-UPGRADE-039**: **REVIEW (MEDIUM RISK)**
  - Touches:
    - Artifact writers.
    - Permissions on high-impact operations.
    - Coverage semantics that could influence downstream modules.
  - Guardrails:
    - Preserve Release Controller and canonical paths unchanged.
    - Avoid broad refactors; prefer small, well-documented changes.
    - Keep new integrity checks strictly read-only.

**Guardrails to enforce during implementation:**

- Do **not**:
  - Introduce new non-canonical artifact writers.
  - Loosen any existing role checks.
  - Change ChangeLog routing or classification logic except where a hardening fix is explicitly approved.
  - Alter verification download behavior.

- Prefer:
  - Minimal, well-scoped edits in each function.
  - Small, composable helpers (for coverage, integrity checks).
  - Explicit comments and docs over silent behavior changes.

---

## 4. Ready-for-implementation checklist

Before implementation starts, reviewers should confirm:

- [ ] The list of artifact writers to be touched (or labeled only) is accurate and complete enough for this upgrade.
- [ ] The proposed coverage contract is acceptable (at least as a first iteration).
- [ ] The set of functions that require stricter role checks is agreed and documented.
- [ ] The new integrity check utilities are clearly scoped as read-only and admin-only.
- [ ] No planned change weakens Release Controller authority, modifies ChangeLog behavior, alters canonical classifications, or affects verification downloads.

Once these are confirmed, NW-UPGRADE-039 can proceed with implementation under the above guardrails.

