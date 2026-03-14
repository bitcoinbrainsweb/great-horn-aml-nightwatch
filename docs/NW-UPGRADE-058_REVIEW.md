# NW-UPGRADE-058 — Pre-Audit Graph and Verification Audit (Review)

**Upgrade ID:** NW-UPGRADE-058  
**Risk:** MEDIUM  
**Source of truth:** current main branch

---

## 1. Compliance Graph Map (as found in code)

### Entity inventory

| Entity | Role | Backend | Frontend |
|---|---|---|---|
| RiskLibrary | Risk register | 5+ functions | AdminRiskLibrary, RisksTab, ControlsTab |
| ControlLibrary | Control register | 6+ functions | AdminControlLibrary, ControlTests, ControlsTab |
| RiskControlMapping | Risk↔Control join table | riskControlMappingEngine only | None |
| EngagementRisk | Engagement-scoped risk | validateWorkflowTransition | RisksTab, ControlsTab |
| ControlAssessment | Control assessment | None | RisksTab, ControlsTab, ComplianceOverview |
| ControlTest | Standalone control testing | calculateRiskCoverage, captureControlSnapshot, validateWorkflowTransition, validateEvidenceAttachment, controlEvidenceEvaluator | ControlTests |
| EngagementControlTest | Engagement-scoped testing | verifyEngagementAuditFoundation (verification only) | EngagementControlTesting |
| TestCycle | Test cycle container | validateWorkflowTransition | TestCycles, ControlTests |
| TestTemplate | Test template (NW-047) | verifyLatestBuild (contract check only) | AdminTestTemplates (MISSING FILE) |
| Evidence | Legacy evidence | migrateEvidenceIntegrity | ControlTests |
| NormalizedEvidence | Normalized evidence (NW-055) | None | ControlTests |
| EvidenceItem | Engagement evidence (NW-040) | verifyEngagementAuditFoundation | EvidenceManager |
| ControlEvidence | Assessment evidence | controlEvidenceEvaluator, segregationOfDutiesChecker | ControlEvidenceList |
| ControlEvidenceAssessment | Computed confidence | controlEvidenceEvaluator | ControlConfidenceSummaryPanel |
| AuditControlSnapshot | Point-in-time snapshot | createEngagementSnapshots | EngagementControlTesting |
| Observation | Engagement findings | VerificationContractRegistry | ObservationManager |
| Finding | Standalone findings | validateWorkflowTransition | Findings |
| RemediationAction | Remediation tracking | validateWorkflowTransition | RemediationActions |
| ReviewArea | AML review areas | initializeAMLReviewAreas | EngagementControlTesting |
| TestExecutionHistory | Execution snapshots | None (frontend-written) | ControlTests (history dialog) |
| TestExecutionLog | Event audit trail | None (frontend-written) | None (audit trail only) |

### Graph edges and their status

| Edge | FK Field(s) | Status |
|---|---|---|
| Regulation → Risk | None (no FK) | **GAP** — ReviewArea and RiskLibrary are unlinked |
| Risk → Control (backend) | `RiskLibrary.linked_control_ids` (ID array) | **Working** — used by 5+ backend engines |
| Risk → Control (frontend) | `RiskLibrary.linked_control_names` (string array) | **Fragile** — breaks if controls are renamed |
| Risk → Control (mapping entity) | `RiskControlMapping.risk_id + control_id` | **Orphaned** — written by riskControlMappingEngine only; never read by any other code |
| Control → Test (standalone) | `ControlTest.control_library_id` | **Working** — feeds risk coverage engine |
| Control → Test (engagement) | `EngagementControlTest.control_library_id` | **Isolated** — never consumed by scoring engines |
| Test → Evidence (legacy) | `Evidence.control_test_id` | **Working** — frontend write/read in ControlTests |
| Test → Evidence (normalized) | `NormalizedEvidence.related_test_id` | **Working** — frontend only |
| Test → Evidence (engagement) | `EvidenceItem.engagement_id` (no test FK) | **Weak** — no FK from evidence to test |
| Test → Evidence (assessment) | `ControlEvidence.controlId + assessmentId` (camelCase) | **Working** but **not written by frontend** |
| Evidence → Observation | None | **Missing** |
| Observation → Finding | None | **Missing** |
| Finding → Remediation | `RemediationAction.finding_id` | **Solid** — backend + frontend consistent |
| Observation → Remediation | `Observation.remediation_due_date` (text, not FK) | **Dead** |

### Critical graph issues

1. **Entity name mismatch:** `riskControlMappingEngine.ts` uses `NightwatchControlLibrary` (line ~45); all other code uses `ControlLibrary`. Will fail at runtime if entity was renamed.
2. **Four fragmented evidence entities** with no shared FKs: Evidence, NormalizedEvidence, EvidenceItem, ControlEvidence. No single entity spans both backend and frontend.
3. **`linked_control_ids` vs `linked_control_names` split:** Backend engines use IDs; engagement-level frontend uses name strings. A renamed control silently breaks the frontend path.
4. **Dual test systems (ControlTest vs EngagementControlTest):** Only ControlTest feeds coverage calculations; EngagementControlTest results are invisible to all scoring.

---

## 2. Testing Framework Audit

### TestTemplate
- Entity registered in VerificationContractRegistry and verified by verifyLatestBuild.
- `AdminTestTemplates.jsx` page is referenced in `pages.config.js` but **the file does not exist on disk**. Navigating to this page would crash.
- `test_template_id` field exists on EngagementControlTest but is unused by any frontend component.

### EngagementControlTest
- Full CRUD in EngagementControlTesting.jsx.
- Lifecycle: Not Started → In Progress → Testing Complete → In Review → Reviewer Notes → Approved.
- Fields: engagement_id, control_library_id, review_area_id, audit_control_snapshot_id, test_status, test_objective, test_procedure, etc.
- **Gap:** Results never flow into risk coverage calculations.

### ControlTest
- Full CRUD in ControlTests.jsx with execution history, evidence management, normalized evidence.
- Lifecycle status: Planned → In Progress → Completed (via validateWorkflowTransition).
- Lifecycle_status: draft → scheduled → in_progress → completed → reviewed → closed.
- **This is the only test entity that feeds calculateRiskCoverage.**

### Prior upgrades 053-057 compatibility
- NW-053 patterns (evidence_captured_at/by on ControlTest): Present in ControlTests.jsx.
- NW-054 patterns (test event logging): Present in ControlTests.jsx.
- NW-055 patterns (NormalizedEvidence): Present in ControlTests.jsx.
- NW-056, NW-057: No references found in codebase. Either never merged or implemented differently.

---

## 3. Coverage Map Audit

### Backend (`calculateRiskCoverage.ts`)
- Queries `ControlTest.list('-created_date', 1000)` — all tests fetched every invocation.
- For each `linked_control_ids` entry, filters for `ControlTest` rows where `control_library_id` matches.
- Checks `effectiveness_rating === 'Effective'` for the most recent test.
- Delegates to `resolveCoverageStatus(totalControls, testedControls, effectiveControls)`.

### Frontend (`ControlCoverageMap.jsx`)
- Queries ControlLibrary, RiskLibrary, ControlTest, TestExecutionHistory directly.
- Only checks whether a test **exists** (not whether it's effective).
- **Semantic divergence:** Backend says "covered" = tested + effective. Frontend says "covered" = has any test.

### `CoverageBadge.jsx`
- Handles: COVERED, PARTIALLY_COVERED, UNCONTROLLED, NOT_TESTED.
- **Missing: INEFFECTIVE.** Falls through to NOT_TESTED styling, which is misleading.

### `AdminRiskLibrary.jsx`
- Calls `calculateRiskCoverage` in a loop per risk (N+1 pattern).
- Stores result in `coverage` state but **never renders it** — shows hardcoded "—" in the coverage column.

---

## 4. Verification Artifact / Reporting Path Audit

### Root cause of "0/0 passed"
**The `delivery_gate_results` field does not exist in the artifact content.**

`verifyLatestBuild.ts` creates `artifactContent` with: `build_label`, `build_identity`, `success`, `generated_at`, `verification_mode`, `contract_registry`, `contract_execution`, `summary`, `checks`, `warnings`, `violations`, `changed_files_summary`, `architecture_notes`.

`VerificationRecordCard.jsx` reads `content.delivery_gate_results`. Finding `undefined`, `gateResults = {}`, `totalTests = 0`, `passedTests = 0`. The card shows a red failure icon even when all checks pass.

This is a **schema mismatch**, not a truncation issue. The card was designed for upgrade-completion artifacts (Release Controller path) which include `delivery_gate_results`. The build verification path uses a different content structure that was never reconciled.

### Additional verification issues
- `product_version` hardcoded to `'v0.6.0'` instead of using `buildIdentity.product_version`.
- Full `checks[]`, `warnings[]`, `violations[]` arrays in artifact content create large JSON (~15-30KB). Safe for now but a scaling risk.

---

## 5. Smallest Durable Fix Strategy

Only two code changes are necessary and safe:

### Fix A: Add `delivery_gate_results` to verification artifact content (`verifyLatestBuild.ts`)
- Build `delivery_gate_results` from `checks[]` and `violations[]` before publishing.
- Keep artifact content compact — exclude the full checks/warnings/violations arrays from the stored content (they remain in the API response).
- Cap evidence strings at 200 chars to prevent oversized entries.
- Use `buildIdentity.product_version` instead of hardcoded `'v0.6.0'`.
- Add gate counts to summary text field.

### Fix B: Add `INEFFECTIVE` state to `CoverageBadge.jsx`
- Add the missing coverage state that exists in the backend contract.

### NOT fixing (documented for future upgrades):
- Graph fragmentation (evidence entities, dual test systems, linked_control_names) — these are architectural and need a dedicated upgrade.
- AdminTestTemplates missing page — scaffolding gap, not a correctness issue.
- AdminRiskLibrary dead coverage code — cosmetic, not blocking.
- ControlCoverageMap semantic divergence — needs design decision, not a bug.
- riskControlMappingEngine entity name — NightwatchControlLibrary may be valid on the platform.

---

## 6. Regression Risks

| Risk | Mitigation |
|---|---|
| Existing verification artifacts in ChangeLog | Old artifacts will still show 0/0 (no delivery_gate_results). Only new artifacts get the fix. |
| Content JSON size | Compact content (removing full arrays) reduces size significantly. |
| CoverageBadge change | Adding a state cannot break existing usage; existing states unchanged. |

---

## 7. Ordered Implementation Plan

1. Create sanity check file ✅
2. Create review file (this file) ✅
3. Fix `verifyLatestBuild.ts` — add `delivery_gate_results`, compact content, dynamic product_version
4. Fix `CoverageBadge.jsx` — add INEFFECTIVE state
5. Create result file with go/no-go recommendation
