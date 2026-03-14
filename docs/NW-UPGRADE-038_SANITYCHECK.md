## NW-UPGRADE-038 — Comprehensive Code Audit + Stability Review (Sanity Check)

This document captures the **sanity check and implementation plan** for NW-UPGRADE-038 before any code changes.

---

### 1. Minimal implementation approach

- **Scope of this upgrade**
  - Perform a **read-only code audit** of Nightwatch focused on stability and architectural integrity.
  - Identify issues and recommend follow-up upgrades (especially NW-UPGRADE-039) rather than making broad changes now.
  - Optionally make only **tiny, clearly safe, non-controversial cleanups**, and only if they do not alter architecture behavior (default posture: no code changes).

- **Implementation shape**
  - Use static analysis only:
    - Search for known risk areas (e.g., `PublishedOutput.create`, `PublishedOutput.update`, `base44.auth.me`, `ChangeLog` integration points, risk/control engines).
    - Review existing verification utilities (e.g., `verifyNightwatchSystemContract`, `validateArtifactSchema`, `exportArchitectureWithFiles`) for gaps.
  - Produce documentation only:
    - `docs/NW-UPGRADE-038_SANITYCHECK.md` (this file).
    - `docs/NW-UPGRADE-038_RESULT.md` (full audit report).
  - **No runtime data migrations** or destructive operations.

- **Audit focus areas**
  - **Architecture drift**
    - Duplicate write paths
    - Bypasses around canonical artifact publishing
    - Inconsistent “source of truth” enforcement
    - Weak boundaries between modules (e.g., verification, diagnostics, reporting)
  - **Artifact system integrity**
    - Direct `PublishedOutput.create` / `update` usage outside approved paths
    - Classification and metadata consistency
    - Lifecycle and state alignment with `UpgradeRegistry` and Release Controller
  - **Permissions and auth**
    - Functions/pages intended to be admin-only
    - Weak or inconsistent role checks vs. `base44.auth.me()`
  - **Data model consistency**
    - Entity relationship mismatches between `RiskLibrary`, `ControlLibrary`, `EngagementRisk`, `RiskControlMapping`, etc.
    - Fallback logic that might hide schema or data quality problems
  - **ChangeLog / diagnostics / verification stability**
    - Query robustness and error handling
    - Potential “invisible artifact” failure modes
  - **Risk/control foundation quality**
    - Behavior and assumptions in `calculateRiskCoverage`, `deterministicRiskEngine`, `riskControlMappingEngine`, and any `verifyControlCoverage`-style logic
  - **Dead / fragile code**
    - Legacy upgrade writers
    - Temporary migrations and repair utilities
    - Obvious brittle patterns likely to break as Base44 evolves

---

### 2. Exact files likely to be examined

This audit is broad but still bounded. Key targets include:

- **Core upgrade / artifact architecture**
  - `functions/releaseController.ts`
  - `functions/createVerificationArtifact.ts`
  - `functions/publishCanonicalArtifact.ts`
  - Legacy and repair writers that touch `PublishedOutput`:
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
  - System contract and verification utilities:
    - `functions/verifyNightwatchSystemContract.ts`
    - `functions/validateArtifactSchema.ts`
    - `functions/verifyOutputClassification.ts`

- **ChangeLog and diagnostics**
  - `src/components/changelog/ChangeLogQuery.jsx`
  - `src/pages/ChangeLog.jsx`
  - `src/pages/ArtifactDiagnostics.jsx`

- **Permissions / auth**
  - Backend functions that call `base44.auth.me()` (many under `functions/`)
  - `functions/checkPermission.ts`
  - `functions/permissionChecker.ts`
  - Key admin-only surfaces (e.g., `verifyAdminConsolidation.ts`)

- **Risk / control foundation**
  - `functions/calculateRiskCoverage.ts`
  - `functions/riskControlMappingEngine.ts`
  - `functions/deterministicRiskEngine.ts`
  - `functions/controlEffectivenessCalculator.ts`
  - `functions/controlScoringEngine.ts`

- **System / architecture documentation utilities**
  - `functions/exportArchitectureWithFiles.ts`
  - `functions/architectureExporter.ts`
  - `functions/documentationGenerator.ts`
  - `functions/systemAudit.ts`
  - `functions/comprehensiveSystemAudit.ts`

Other files may be inspected as needed, but the audit is intended to remain read-only and documentation-focused.

---

### 3. Pre-Commit Risk Flag

**Pre-Commit Risk Flag: SAFE (for audit + documentation only)**

- **Reasoning**
  - The planned work is:
    - Purely **read-only** (code inspection and documentation).
    - Focused on identifying and classifying risks, not changing behavior.
  - No code paths will be changed unless explicitly approved in a later fix-focused upgrade (e.g., NW-UPGRADE-039).
- **Guardrails**
  - Do **not**:
    - Modify `releaseController.ts` in this upgrade.
    - Change ChangeLog logic or queries.
    - Add or alter artifact writers.
    - Modify artifact classifications.
    - Touch verification download behavior.

Given these constraints, the audit and documentation work is considered low risk.

---

### 4. Confirmation of non-effects for this upgrade

For NW-UPGRADE-038, as planned:

- **Release Controller**
  - Will **not** be modified.
  - Any concerns or recommendations will be documented only; actual changes belong in a follow-up upgrade.

- **ChangeLog behavior**
  - No changes to:
    - `ChangeLog.jsx`
    - `ChangeLogQuery.jsx`
    - Any ChangeLog-specific routing or filters.
  - Findings about ChangeLog stability will be documented, not immediately patched.

- **Artifact writers**
  - No new writers will be introduced.
  - Existing writers (canonical, legacy, repair) will be **analyzed only**.
  - Any consolidation or enforcement changes will be deferred to a later upgrade.

- **Artifact classifications**
  - No changes to the canonical classification model (`artifactClassifications.ts`) or how classifications are written.
  - Classification inconsistencies will be reported as findings.

- **Verification downloads**
  - No code touching download URLs, file attachments, or related metadata will be modified.
  - Any issues or fragility will be documented for later action.

This sanity check confirms that NW-UPGRADE-038 is constrained to a **read-only stability audit and documentation**, with no direct changes to runtime behavior in this phase.

