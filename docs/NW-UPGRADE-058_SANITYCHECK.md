# NW-UPGRADE-058 — Pre-Audit Graph and Verification Audit (Sanity Check)

**Upgrade ID:** NW-UPGRADE-058  
**Branch:** nw-upgrade-058-pre-audit-graph-verification-audit-v2  
**Source of truth:** current main

---

## Risk Classification: MEDIUM

**Rationale:** The audit has uncovered real, correctness-affecting defects in two subsystems:
1. The verification artifact is missing `delivery_gate_results`, causing `VerificationRecordCard` to show 0/0 and a false-failure icon.
2. `CoverageBadge` is missing the `INEFFECTIVE` state from the backend contract, causing misleading display.

These require targeted code changes. A REVIEW file is required.

---

## Subsystems Involved

| Subsystem | Files | Status on Main |
|---|---|---|
| **Compliance Graph** | Risk/Control/Test/Evidence entities across functions/*.ts and src/**/*.jsx | Structurally functional but has multiple known architectural gaps (dual test systems, fragmented evidence, etc.) |
| **Testing Framework** | ControlTest, EngagementControlTest, TestCycle, TestTemplate, Evidence entities | Functional; TestTemplate scaffolded but incomplete (missing page file) |
| **Coverage Map** | `calculateRiskCoverage.ts`, `riskCoverageContract.ts`, `ControlCoverageMap.jsx`, `CoverageBadge.jsx` | Functional but has semantic divergence (backend vs frontend "covered" definition) and missing INEFFECTIVE badge state |
| **Verification/Reporting** | `verifyLatestBuild.ts`, `VerificationRecordCard.jsx`, `BuildVerificationDashboard.jsx` | **Has real defect**: `delivery_gate_results` field is missing from artifact content |

---

## Delivery-Gate / Reporting Logic Status on Main

- `verifyLatestBuild.ts` on main **does NOT produce `delivery_gate_results`** in the artifact content. It produces `checks[]`, `warnings[]`, `violations[]`, and `contract_execution` counts, but `VerificationRecordCard` specifically reads `content.delivery_gate_results`.
- The artifact content includes the full `checks`, `warnings`, `violations` arrays which may create large content JSON.
- Publish guards exist (NW-050/052) that prevent 0-contract or 0-check artifacts.
- `resolveBuildIdentity` is inlined in the file (not imported from a separate module).
- `product_version` is hardcoded to `'v0.6.0'` instead of using `buildIdentity.product_version`.

## REVIEW File Required

Yes — because risk is MEDIUM.
