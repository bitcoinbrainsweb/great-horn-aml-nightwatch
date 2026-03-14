## NW-UPGRADE-039 — Hardening Fix Bundle (Sanity Check)

This document captures the **sanity check and implementation plan** for NW-UPGRADE-039 before any code changes.

---

### 1. Minimal implementation approach

NW-UPGRADE-039 is a **targeted hardening bundle** that should make small, high-impact fixes rather than broad rewrites.

- **Artifact writer hardening**
  - Identify remaining non-canonical `PublishedOutput` writers (historical, repair, architecture exports).
  - Where safe and simple:
    - Route them through existing canonical gateways (e.g. `publishCanonicalArtifact`) or a thin, shared helper.
  - Where not safe:
    - Leave behavior unchanged but **explicitly label** them as legacy/repair-only.
  - Do **not**:
    - Introduce new non-canonical writers.
    - Change Release Controller’s canonical path.

- **Permissions hardening**
  - Focus on **high-impact backend functions**:
    - Migrations and backfills.
    - Repair tools (classification repairs, verification repairs, backfills).
    - Infrastructure/system verification tools.
    - Artifact/state-changing functions.
  - For each:
    - Add or tighten explicit role checks (e.g. `admin`, `super_admin`) where actions are clearly admin-only or system-wide.
    - Keep auth consistent with existing patterns (`base44.auth.me()` + role gating).

- **Risk/control coverage contract**
  - Introduce a **small, shared contract** for coverage semantics:
    - Distinguish: `COVERED`, `PARTIALLY_COVERED`, `UNCONTROLLED/UNMAPPED`, `NOT_TESTED` where feasible.
  - Apply this contract in the minimal number of places:
    - For example, centralize helpers used by `calculateRiskCoverage` and any `verifyControlCoverage`/coverage-like logic.
  - Do **not**:
    - Build the Audit Module yet.
    - Change the underlying data model for risks/controls/tests.

- **Data health checks**
  - Add lightweight, **non-destructive** verification utilities (similar to `verifyNightwatchSystemContract`) that:
    - Report:
      - Risks without mappings where mappings are expected.
      - Mappings pointing to missing controls.
      - Control tests with broken references.
    - Return JSON-only reports, no writes.

- **Legacy / repair labeling**
  - Add clear comments/doc markers and, where appropriate, doc entries that:
    - Mark functions as **legacy**, **migration**, or **repair-only**.
    - Clarify that they are **not canonical paths** for new development.

Overall, the approach is to **add guardrails and labels**, not to refactor core architecture.

---

### 2. Exact files likely to change

Based on NW-UPGRADE-038 findings, the following files are the most likely candidates for **small, targeted edits**:

- **Artifact writers and related helpers**
  - `functions/publishCanonicalArtifact.ts`
  - `functions/createVerificationArtifact.ts`
  - Historical/repair/system writers that call `PublishedOutput.create` or `update`:
    - `functions/completeUpgradeNW015.ts`
    - `functions/completeUpgradeNW016.ts`
    - `functions/completeUpgradeNW016A.ts`
    - `functions/BackfillHistoricalRecords.ts`
    - `functions/NormalizeVerificationReports.ts`
    - `functions/repairVerificationArtifacts.ts`
    - `functions/backendInfrastructureVerification.ts`
    - `functions/auditPageArchitecture.ts`
    - `functions/exportArchitectureWithFiles.ts`
    - `functions/architectureExporter.ts`

- **Permissions / auth**
  - High-impact tools that already use `base44.auth.me()` but may need tighter role checks, e.g.:
    - `functions/repairArtifactClassificationsNW034.ts`
    - `functions/verifyNightwatchSystemContract.ts`
    - `functions/verifyAdminConsolidation.ts`
    - `functions/NormalizeVerificationReports.ts`
    - Selected backfills and migrations (`BackfillHistoricalRecords`, `backfillLibraryReviewState`, `backfillReviewStateFast`, `migrateWorkflowStates`, `migrateControlsToUnifiedSystem`, etc.).

- **Risk/control coverage**
  - `functions/calculateRiskCoverage.ts`
  - `functions/riskControlMappingEngine.ts`
  - `functions/deterministicRiskEngine.ts`
  - `functions/controlEffectivenessCalculator.ts`
  - `functions/controlScoringEngine.ts`
  - Any small helper introduced for a shared coverage contract.

- **Data health checks**
  - Potential new read-only function(s) under `functions/` (e.g. `verifyRiskControlIntegrity.ts`), patterned after:
    - `functions/verifyNightwatchSystemContract.ts`

- **Legacy / repair labeling**
  - Comments and doc links in:
    - Historical upgrade/repair functions listed above.
    - System audit docs (`docs/`).

No UI files are expected to change unless a **very small, clearly necessary hardening fix** is identified.

---

### 3. Pre-Commit Risk Flag

**Pre-Commit Risk Flag: REVIEW (MEDIUM RISK)**

**Reasoning:**

- This upgrade will likely touch:
  - Core artifact writer paths (even if only labeling or shallow routing through a gateway).
  - High-impact backend tools (migrations, repairs).
  - Risk/control coverage semantics that may be consumed by other modules.
- Even with a minimal approach, changes here can **affect critical system behavior** if not carefully implemented and reviewed:
  - Subtle differences in how artifacts are written or updated.
  - Stricter permissions accidentally blocking legitimate admin workflows.
  - Coverage semantics changing expectations for downstream consumers.

Because of this, NW-UPGRADE-039 should be treated as **MEDIUM RISK**, requiring review of the implementation plan and diffs before merging.

Per the prompt, this means:

- **Do not implement code changes yet.**
- Create:
  - `docs/NW-UPGRADE-039_SANITYCHECK.md` (this file).
  - `docs/NW-UPGRADE-039_REVIEW.md` (implementation/review plan and recommendations).

---

### 4. Confirmation of potential impact areas

At the **planning stage**, the intent is:

- **Release Controller**
  - **Not** to weaken or bypass Release Controller.
  - Only to:
    - Harden surrounding writers and tools.
    - Clarify canonical vs. non-canonical paths.

- **ChangeLog behavior**
  - ChangeLog query behavior should remain **functionally unchanged**.
  - Any modification would be strictly limited to:
    - Hardened checks against misclassified artifacts or invalid states.
    - Clear fixes for identified failure modes (if absolutely necessary).

- **Canonical artifact classifications**
  - No changes to the canonical classification model in `artifactClassifications.ts` are planned.
  - Hardening should align writers with the existing model, not change the model itself.

- **Verification downloads**
  - No changes are planned to:
    - Download URLs.
    - File identifiers or attachment logic.
    - UI behavior for downloading verification artifacts.

- **Canonical artifact publishing behavior**
  - The canonical path (`ReleaseController` → `createVerificationArtifact` → `publishCanonicalArtifact`) should be preserved as-is.
  - Hardening will:
    - Ensure surrounding writers are clearly marked or gently routed to gateways where safe.
    - Avoid any change in semantics for normal upgrade completion flows.

Any deviation from these constraints should be treated as **out of scope** for NW-UPGRADE-039 and moved to a separate, explicitly approved upgrade.

