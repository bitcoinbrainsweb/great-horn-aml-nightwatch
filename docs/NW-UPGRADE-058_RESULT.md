# NW-UPGRADE-058 — Pre-Audit Graph and Verification Audit (Result)

**Upgrade ID:** NW-UPGRADE-058  
**Branch:** nw-upgrade-058-pre-audit-graph-verification-audit-v2  
**Risk:** MEDIUM  
**Status:** Implementation complete

---

## Subsystems Audited

1. Compliance graph integrity (Regulation → Risk → Control → Test → Evidence → Observation → Finding → Remediation)
2. Testing framework (TestTemplate, EngagementControlTest, ControlTest, TestCycle)
3. Control Coverage Map (calculateRiskCoverage, riskCoverageContract, ControlCoverageMap, CoverageBadge)
4. Verification artifact / reporting path (verifyLatestBuild, VerificationRecordCard, BuildVerificationDashboard)

---

## Files Changed

| File | Change | Reason |
|---|---|---|
| `functions/verifyLatestBuild.ts` | Added `delivery_gate_results` construction from checks/violations; compacted artifact content; used dynamic product_version; updated summary text | Fix "0/0 delivery gates" in VerificationRecordCard |
| `src/components/coverage/CoverageBadge.jsx` | Added `INEFFECTIVE` coverage state | Missing state from backend contract caused misleading display |

---

## Graph Issues Found

| # | Severity | Issue | Impact |
|---|---|---|---|
| 1 | Architectural | No FK between Regulation (ReviewArea) and Risk (RiskLibrary) | Regulation context does not flow to risk assessment |
| 2 | Architectural | Dual Risk→Control paths: `linked_control_ids` (backend) vs `linked_control_names` (frontend) | Renamed control silently breaks frontend; backend coverage diverges from UI |
| 3 | Architectural | `RiskControlMapping` entity orphaned — written by `riskControlMappingEngine` but never read by any other code | Dead entity |
| 4 | Architectural | Dual test systems: `ControlTest` (feeds coverage) vs `EngagementControlTest` (invisible to scoring) | Engagement test results excluded from risk coverage calculations |
| 5 | Architectural | Four fragmented evidence entities (Evidence, NormalizedEvidence, EvidenceItem, ControlEvidence) with no shared FKs | No single evidence entity works consistently across backend and frontend |
| 6 | Architectural | No FK between Observation and Finding — parallel disconnected entities | Cannot link observations to findings or remediation chain |
| 7 | Data | `ControlEvidence` uses camelCase fields while all other entities use snake_case | Naming inconsistency |
| 8 | Possible runtime | `riskControlMappingEngine.ts` uses `NightwatchControlLibrary` entity name; all other code uses `ControlLibrary` | May fail at runtime if entity was renamed |

**Assessment:** These are architectural gaps inherited from incremental development. None are blocking for Audit Module work — they represent the current design boundaries. The compliance graph works within each subsystem (standalone testing, engagement testing) but the subsystems are not yet unified.

---

## Testing Subsystem Issues Found

| # | Severity | Issue |
|---|---|---|
| 1 | Medium | `AdminTestTemplates.jsx` referenced in `pages.config.js` but file does not exist on disk — navigation will crash |
| 2 | Low | `test_template_id` on EngagementControlTest is defined but unused by any frontend component |
| 3 | Info | NW-056 and NW-057 have no presence in codebase (may have been planned but not implemented) |

**Prior upgrades 053–055 remain structurally compatible.** Evidence capture metadata (053), test event logging (054), and NormalizedEvidence (055) are all present and functional in `ControlTests.jsx`.

---

## Coverage Map Issues Found

| # | Severity | Issue | Fixed? |
|---|---|---|---|
| 1 | Medium | `CoverageBadge` missing INEFFECTIVE state — falls through to NOT_TESTED styling | **Yes** — added in this upgrade |
| 2 | Medium | `AdminRiskLibrary` computes coverage per-risk (expensive N+1 pattern) but never renders it — column shows hardcoded "—" | No — cosmetic; not blocking |
| 3 | Medium | Semantic divergence: backend `calculateRiskCoverage` checks effectiveness; frontend `ControlCoverageMap` only checks test existence | No — needs design decision |
| 4 | Low | `calculateRiskCoverage` fetches 1000 ControlTest rows on every invocation; called in a loop from `AdminRiskLibrary` | No — performance concern for scale |

---

## Verification / Reporting Issues Found

| # | Severity | Issue | Fixed? |
|---|---|---|---|
| 1 | **High** | `verifyLatestBuild.ts` artifact content has no `delivery_gate_results` field; VerificationRecordCard shows 0/0 and false-failure icon | **Yes** — delivery_gate_results now built from checks/violations and included in artifact content |
| 2 | Medium | Artifact content included full checks/warnings/violations arrays (~15-30KB) — scaling risk | **Yes** — artifact content compacted to delivery_gate_results + summary counts only |
| 3 | Low | `product_version` hardcoded to `'v0.6.0'` instead of using buildIdentity.product_version | **Yes** — now dynamic with fallback |
| 4 | Low | Artifact summary text did not include gate counts | **Yes** — now shows `X/Y delivery gates passed` |

### Root cause of "0/0 passed"

**Schema mismatch.** `VerificationRecordCard.jsx` reads `content.delivery_gate_results` to compute gate counts. `verifyLatestBuild.ts` never produced this field — it used `checks[]` / `violations[]` arrays that the card does not read. This is not a truncation issue; the field was simply absent.

**Fix applied:** `delivery_gate_results` is now constructed from the `checks[]` and `violations[]` arrays before publishing. Each passing check becomes a gate entry with `status: 'pass'`, each violation becomes `status: 'fail'`. Evidence strings are capped at 200 chars. The full arrays remain in the API response for dashboard display but are excluded from the stored artifact content to prevent size issues.

---

## Fixes Implemented

### Fix A: Verification artifact content (`verifyLatestBuild.ts`)
- **Built `delivery_gate_results`** from `checks[]` and `violations[]` before publishing
- **Compacted artifact content** — removed full `checks[]`, `warnings[]`, `violations[]`, `contract_execution`, `build_identity`, and `architecture_notes` from stored content
- **Capped evidence strings** at 200 characters to prevent oversized entries
- **Used dynamic `product_version`** from `buildIdentity.product_version` with `'v0.6.0'` fallback
- **Updated summary text** to include gate counts: `${build_label}: ${gatesPassed}/${gateKeys.length} delivery gates passed`
- **Added `delivery_gate_results`** to API response for dashboard use

### Fix B: Coverage badge (`CoverageBadge.jsx`)
- **Added `INEFFECTIVE` state** with red styling matching the backend `riskCoverageContract.ts` contract

---

## Confirmation Checklist

- [x] Upgrade ID is NW-UPGRADE-058 everywhere
- [x] SANITYCHECK exists: `docs/NW-UPGRADE-058_SANITYCHECK.md`
- [x] REVIEW exists (required by MEDIUM risk): `docs/NW-UPGRADE-058_REVIEW.md`
- [x] RESULT exists: `docs/NW-UPGRADE-058_RESULT.md`
- [x] Verification reporting fix targets real root cause (missing `delivery_gate_results` field)
- [x] Graph relationships audited against real code paths (all edges documented with FK fields and status)
- [x] Coverage map calculations validated against real data logic (backend vs frontend divergence documented)
- [x] Prior verified fixes on main preserved (publish guards, build identity resolver, contract registry)
- [x] No unrelated files changed (only `verifyLatestBuild.ts` and `CoverageBadge.jsx`)
- [x] ChangeLog filters not modified
- [x] Release Controller not modified
- [x] Canonical artifact classifications not modified
- [x] VerificationContractRegistry not modified
- [x] No new pages created
- [x] No new artifact writers introduced

---

## Remaining Known Issues

| Priority | Issue | Recommendation |
|---|---|---|
| P1 | `AdminTestTemplates.jsx` missing — page will crash if navigated to | Create a minimal page or remove the route in a follow-up |
| P2 | ControlCoverageMap uses existence-based coverage; backend uses effectiveness-based | Align in a future upgrade after design decision |
| P2 | AdminRiskLibrary computes coverage but never renders it (dead code) | Remove dead code or wire up the display |
| P3 | Evidence entity fragmentation (4 entities, no shared FKs) | Needs dedicated unification upgrade |
| P3 | EngagementControlTest results invisible to coverage engine | Needs design decision on scoring integration |
| P3 | Observation ↔ Finding entities disconnected | Needs compliance graph unification |

---

## Go / No-Go Recommendation for Audit Module

### **GO** — with caveats

The system is stable enough to begin Audit Module development. The core data model, entity CRUD, and workflow validation are functional. The two correctness-affecting bugs identified in this audit (verification 0/0 display and missing CoverageBadge state) have been fixed.

**Caveats:**
1. **The Audit Module should be designed for the engagement-scoped path** (EngagementControlTest + EvidenceItem + Observation), not the standalone ControlTest path. These are parallel systems and should not be conflated.
2. **Risk→Control linkage in the engagement path uses `linked_control_names`** (string matching). The Audit Module should use ID-based linkage or the Audit Module's own entity relationships.
3. **The `AdminTestTemplates.jsx` missing file** should be resolved before or during Audit Module work if TestTemplate integration is planned.
4. **Evidence entity fragmentation** should be considered in the Audit Module evidence strategy — do not introduce a fifth evidence entity.
