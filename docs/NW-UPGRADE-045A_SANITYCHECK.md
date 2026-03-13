# NW-UPGRADE-045A — Sanity Check

## Risk Flag: SAFE

## Problem

`BuildVerificationDashboard.jsx` and `verifyLatestBuild.ts` both use a **hardcoded** build label (`'NW-UPGRADE-045'`). Once that label is verified once, auto-run never triggers again — even when newer upgrades are deployed. The user perceives this as a "24-hour window" suppression because verification only runs once and then stops permanently.

## Root Cause

- `BuildVerificationDashboard.jsx` line 19: `const currentBuildLabel = 'NW-UPGRADE-045'` — static string, never updates.
- `verifyLatestBuild.ts` line 229: `const build_label = 'NW-UPGRADE-045'` — static string, never updates.
- The auto-run comparison logic (current build vs. latest verified build) was structurally correct, but both sides referenced frozen values.

## Minimal Implementation Approach

1. Create `functions/resolveBuildIdentity.ts` — shared utility that queries `UpgradeRegistry` (most recent entry) and returns `{ build_label, product_version, source }`.
2. Update `verifyLatestBuild.ts` — import and use `resolveBuildIdentity()` instead of hardcoded `build_label`.
3. Update `BuildVerificationDashboard.jsx` — query `UpgradeRegistry` via React Query to resolve the current build label dynamically.

## Files Changed

| File | Change |
|------|--------|
| `functions/resolveBuildIdentity.ts` | New shared utility |
| `functions/verifyLatestBuild.ts` | Import resolver; replace hardcoded label |
| `src/pages/BuildVerificationDashboard.jsx` | Dynamic UpgradeRegistry query; replace hardcoded label |

## Confirmation of Non-Effects

- **VerificationContractRegistry:** Not modified.
- **ChangeLog filters:** Not modified.
- **Canonical artifact publishing paths:** Not modified. `verifyLatestBuild.ts` still publishes via `PublishedOutput.create` with the same fields.
- **Manual verification:** Still calls `verifyLatestBuild()` unconditionally via the "Run Verification" button.
