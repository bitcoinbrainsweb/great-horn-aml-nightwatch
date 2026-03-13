# NW-UPGRADE-039 — Hardening Fix Bundle (Result)

Implementation completed per `docs/NW-UPGRADE-039_REVIEW.md` and user constraints. No writer migrations through `publishCanonicalArtifact` were performed; labeling, permissions, coverage contract, data health checks, and legacy labeling were applied.

---

## Files created or modified

### Created

| File | Purpose |
|------|--------|
| `functions/riskCoverageContract.ts` | Shared coverage status contract and `resolveCoverageStatus(total, tested, effective)` |
| `functions/verifyRiskControlIntegrity.ts` | Read-only, admin-only risk/control integrity check; returns checks, warnings, violations |
| `docs/NW-UPGRADE-039_NON_CANONICAL_ALLOWLIST.md` | Documents all allowed non-canonical `PublishedOutput` writers and conditions |

### Modified

| File | Changes |
|------|--------|
| `functions/calculateRiskCoverage.ts` | Uses `resolveCoverageStatus` from `riskCoverageContract.ts`; API and behavior unchanged |
| `functions/NormalizeVerificationReports.ts` | Role check extended to `admin` or `super_admin`; legacy header comment added |
| `functions/BackfillHistoricalRecords.ts` | Role check extended to `admin` or `super_admin`; backfill header comment added |
| `functions/backfillLibraryReviewState.ts` | Role check extended to `admin` or `super_admin` |
| `functions/backfillReviewStateFast.ts` | Role check extended to `admin` or `super_admin` |
| `functions/verifyInfrastructureLayer.ts` | Added admin/super_admin role check (was auth-only) |
| `functions/systemAudit.ts` | Added admin/super_admin role check |
| `functions/comprehensiveSystemAudit.ts` | Added admin/super_admin role check |
| `functions/completeUpgradeNW015.ts` | Legacy/non-canonical header comment added |
| `functions/completeUpgradeNW016.ts` | Legacy header + role check extended to super_admin |
| `functions/completeUpgradeNW016A.ts` | Legacy header + role check extended to super_admin |
| `functions/repairVerificationArtifacts.ts` | Repair-only/non-canonical line added to existing header |
| `functions/backendInfrastructureVerification.ts` | Non-canonical header + role check extended to super_admin |
| `functions/auditPageArchitecture.ts` | Non-canonical header + auth and admin/super_admin check added |
| `functions/exportArchitectureWithFiles.ts` | Allowlist comment + role check extended to super_admin |
| `functions/architectureExporter.ts` | Legacy allowlist comment + role check extended to super_admin |

---

## What was hardened

1. **Artifact writer scope**
   - **Labeling:** All listed non-canonical writers now have file-level comments marking them as legacy, backfill, migration, or repair-only and referencing `docs/NW-UPGRADE-039_NON_CANONICAL_ALLOWLIST.md`.
   - **Allowlist:** Non-canonical allowlist documented in `docs/NW-UPGRADE-039_NON_CANONICAL_ALLOWLIST.md` (no new writers; no routing of additional writers through `publishCanonicalArtifact` in this upgrade).

2. **Permissions**
   - **Admin/super_admin** enforced on:
     - NormalizeVerificationReports, BackfillHistoricalRecords, backfillLibraryReviewState, backfillReviewStateFast
     - verifyInfrastructureLayer, systemAudit, comprehensiveSystemAudit
     - completeUpgradeNW016, completeUpgradeNW016A, backendInfrastructureVerification, auditPageArchitecture
     - exportArchitectureWithFiles, architectureExporter
   - repairArtifactClassificationsNW034 and createVerificationArtifact already required admin/super_admin; unchanged.

3. **Coverage contract**
   - **riskCoverageContract.ts** added with:
     - `COVERAGE_STATUS` enum: UNCONTROLLED, NOT_TESTED, INEFFECTIVE, PARTIALLY_COVERED, COVERED
     - `resolveCoverageStatus(totalControls, testedControls, effectiveControls)` returning canonical status
   - **calculateRiskCoverage.ts** now uses `resolveCoverageStatus` for the decision; existing API and response shape unchanged.

4. **Data health checks**
   - **verifyRiskControlIntegrity.ts** added:
     - Read-only; no writes; admin/super_admin only
     - Checks: risks without mappings, mappings referencing missing controls, control tests referencing missing controls
     - Returns `{ success, checks, warnings, violations }`; no UI, no runtime enforcement

5. **Legacy / repair labeling**
   - File or block comments added on all targeted non-canonical writers stating they are not part of the Release Controller path and pointing to the allowlist where applicable.

---

## Writer migrations performed

**None.** No additional writers were routed through `publishCanonicalArtifact` in this upgrade. All changes are labeling, permissions, coverage contract usage, new read-only integrity check, and allowlist documentation.

---

## Remaining risks

- **Legacy writers:** Multiple direct `PublishedOutput.create`/`update` callers remain outside the canonical gateway; they are documented and gated by role. Future work can migrate suitable ones through the gateway when payloads align.
- **verifyRiskControlIntegrity:** Depends on `RiskControlMapping` and `ControlLibrary`; if entity names or schemas differ in your environment, the check may need adaptation (e.g. fallback to `linked_control_ids` already used for risk mapping count).
- **Coverage contract:** Only `calculateRiskCoverage` was switched to the shared helper; other engines (e.g. deterministicRiskEngine, controlScoringEngine) could adopt it in a later pass for full semantic alignment.

---

## Guardrails confirmed

- **Release Controller:** Not modified; remains sole authority for upgrade completion.
- **ChangeLog:** No changes to queries, tabs, or visibility logic.
- **Canonical artifact classifications:** Unchanged; no edits to `artifactClassifications.ts` or classification behavior.
- **Verification downloads:** Unchanged.
- **New non-canonical writers:** None introduced.

---

## Stable for NW-UPGRADE-040 Audit Module Foundation

**Yes.** With this hardening in place:

- Canonical vs non-canonical artifact paths are clearly labeled and documented.
- High-impact backend tools are restricted to Technical Admin (admin/super_admin).
- Coverage semantics are centralized in a small contract used by at least one consumer.
- A read-only risk/control integrity check is available for data health visibility.
- No new artifact writers were added and no authority was weakened.

The system is **stable enough to begin NW-UPGRADE-040 Audit Module Foundation** with the understanding that legacy writers remain in the allowlist and can be migrated or retired in later upgrades.
