# NW-UPGRADE-068 — System Hardening & Navigation Integrity Sweep (Sanity Check)

**Upgrade ID:** NW-UPGRADE-068  
**Branch:** nw-upgrade-068-system-hardening  
**Source of truth:** current main

---

## Risk Classification: MEDIUM

**Rationale:** This upgrade touches 8 distinct scopes including creating missing pages, modifying the build verification contract registry, adding new backend functions, and fixing entity field population. The individual changes are each low risk, but the breadth requires careful execution and a REVIEW file.

---

## Subsystems Involved

| # | Scope | Subsystem | Risk |
|---|---|---|---|
| 1 | Sidebar Route Audit | Layout.jsx, pages.config.js | Low — creating missing pages |
| 2 | Page Inventory Scan | Documentation only | Safe |
| 3 | Navigation Integrity Check | verifyLatestBuild.ts | Low — additive contract |
| 4 | Engagement entity warning | Engagements.jsx, verifyLatestBuild.ts | Low — field population fix |
| 5 | Orphan Object Detection | New backend function | Low — read-only |
| 6 | Verification Contract Coverage | verifyLatestBuild.ts | Low — additive contracts |
| 7 | Mutation Guardrails | New backend function | Medium — business rules |
| 8 | Navigation Health Artifact | verifyLatestBuild.ts | Low — additive output |

---

## Key Findings

### Dead Routes (2)
- `ComplianceOperations` — sidebar + pages.config.js import, but .jsx file MISSING
- `ControlCoverageMap` — sidebar + pages.config.js import, but .jsx file MISSING

### Engagement Field
- V1 `Engagements.jsx` create flow does not set `engagement_name`
- V2 `EngagementDetailV2.jsx` sets it correctly
- Contract requires `engagement_name` — V1-created records will fail the check

### Contract Coverage
- 21 entities have contracts out of ~88 total (~24%)
- Core entities missing: RiskLibrary, Client, ControlTest, Task, Finding, User

### Duplicate Entity Contracts
- `SampleSet` and `SampleItem` each appear twice in entityContracts (lines 30-31 and 35-36)

---

## REVIEW Required: Yes (MEDIUM risk)
