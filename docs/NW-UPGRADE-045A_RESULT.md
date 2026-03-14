# NW-UPGRADE-045A — Result Summary

**Upgrade ID:** NW-UPGRADE-045A  
**Product Version:** v0.6  
**Risk Flag:** SAFE  
**Status:** Implemented

---

## Root Cause

Both `BuildVerificationDashboard.jsx` and `verifyLatestBuild.ts` used a **hardcoded** build label (`'NW-UPGRADE-045'`). The auto-run comparison logic was structurally correct (it compared current build vs. latest verified build), but with a frozen label, auto-run could only trigger once for that specific label and then permanently suppress — regardless of what was actually deployed.

## Files Changed

| File | Change |
|------|--------|
| `functions/resolveBuildIdentity.ts` | **New.** Shared utility that queries `UpgradeRegistry` (most recent entry) and returns `{ build_label, product_version, source }`. Falls back gracefully to `'UNKNOWN'` if the registry is empty. |
| `functions/verifyLatestBuild.ts` | Replaced hardcoded `build_label = 'NW-UPGRADE-045'` with `resolveBuildIdentity(base44)`. Added `build_identity` to response payload. Added a warning if fallback identity is used. |
| `src/pages/BuildVerificationDashboard.jsx` | Replaced hardcoded `currentBuildLabel = 'NW-UPGRADE-045'` with a React Query that resolves the label from `UpgradeRegistry.list('-created_date', 1)`. Auto-run `useEffect` now waits for both the build label query and the latest artifact query before comparing. Loading state shown for build label. |

## Build Identity Resolution

- **Source:** `UpgradeRegistry`, most recently created entry, `upgrade_id` field.
- **Shared utility:** `resolveBuildIdentity.ts` (backend, importable).
- **Frontend equivalent:** Inline React Query with same logic (`UpgradeRegistry.list('-created_date', 1)`).
- **Fallback:** If `UpgradeRegistry` is empty or unreachable, resolves to `'UNKNOWN'` and logs a warning.

## Auto-Run Behavior (Corrected)

| Scenario | Auto-Run? |
|----------|-----------|
| No prior verification exists | Yes |
| Prior verification exists for a different build | Yes |
| Prior verification exists for the same build | No (skipped) |
| Manual "Run Verification" button clicked | Always runs |

## Debug / Output Fields

The dashboard now displays:

- **Current Build:** Dynamically resolved from `UpgradeRegistry` (shown in Build Identity Status bar)
- **Latest Verified:** From the most recent `build_verification` artifact's `upgrade_id`
- **Auto-Run:** Whether auto-run triggered, with reason string showing both labels

The backend response now includes:

- `build_label` — the resolved label used for this verification run
- `build_identity` — full resolution object `{ build_label, product_version, source }`

## Manual Run Behavior

Confirmed: The "Run Verification" button calls `runVerification()` directly with no guards. It always invokes `verifyLatestBuild()` regardless of previous verification state, timing, or label match.

## Canonical Artifact Publishing

Confirmed unchanged. `verifyLatestBuild.ts` still publishes via:

```
base44.asServiceRole.entities.PublishedOutput.create({
  classification: 'verification_record',
  subtype: 'build_verification',
  upgrade_id: build_label,   // now dynamic
  ...
})
```

Same fields, same classification, same store. The only difference is `upgrade_id` is now the dynamically resolved label instead of a hardcoded string.

## Preserved (Not Modified)

- VerificationContractRegistry (inline in `verifyLatestBuild.ts`) — unchanged
- ChangeLog filters — unchanged
- Canonical artifact publishing paths — unchanged
- BuildVerificationSummary component — unchanged
- All other verification infrastructure — unchanged

## Remaining Risks / Follow-Ups

1. **UpgradeRegistry ordering assumption:** The resolver uses `-created_date` sort order, so the "current build" is the most recently created registry entry. If entries are created out of order (e.g., backfilled historical entries), the wrong label could be returned. This is unlikely in normal operation.
2. **Frontend/backend alignment:** The frontend and backend each independently query `UpgradeRegistry`. They use the same logic, but if the registry changes between queries, they could briefly disagree. This is harmless — the backend's resolved label is authoritative for the artifact it publishes.
3. **Future improvement:** When deployment metadata (commit SHA, CI build number) becomes available, `resolveBuildIdentity` can be extended to include it without changing callers.
