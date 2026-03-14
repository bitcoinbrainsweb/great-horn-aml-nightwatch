# NW-UPGRADE-040R — Repair Broken Verification Artifact Publishing

**Risk Flag:** SAFE  
**Status:** Implemented

---

## Root Cause

`verifyEngagementAuditFoundation.ts` (the NW-UPGRADE-040 verification function) wrote directly to `PublishedOutput.create`, bypassing the canonical `publishCanonicalArtifact` gateway introduced in NW-UPGRADE-035. Additionally:

1. **No automatic trigger** — the function was only invocable from the `RunNW040Verification.jsx` page via a manual button click. If never triggered from the live environment, no artifact would exist.
2. **Direct create bypassed gateway validation** — the `PublishedOutput.create` call skipped classification and required-field validation provided by the canonical gateway.
3. **Weak role check** — used `user.role !== 'admin'` (string equality) instead of the NW-039 standard `['admin', 'super_admin'].includes(user.role)`.

## Files Changed

| File | Change |
|------|--------|
| `functions/verifyEngagementAuditFoundation.ts` | Routed new artifact creation through `publishCanonicalArtifact`; fixed role check to admin/super_admin; added canonical metadata (`generated_by`, `engine_version`) |
| `src/pages/ChangeLog.jsx` | Added temporary one-time auto-trigger for `verifyEngagementAuditFoundation` on Diagnostics tab load (admin only); clearly labeled for removal after confirmation |
| `docs/NW-UPGRADE-039_NON_CANONICAL_ALLOWLIST.md` | Documented `verifyEngagementAuditFoundation.ts` in the allowlist (routed through gateway for create) |
| `docs/NW-UPGRADE-040R_SANITYCHECK.md` | Sanity check documentation |
| `docs/NW-UPGRADE-040R_RESULT.md` | This file |

## Execution Path Fix

**Before (broken):**
```
RunNW040Verification page → manual button → verifyEngagementAuditFoundation
  → direct PublishedOutput.create (bypassed gateway)
  → no automatic trigger existed
```

**After (fixed):**
```
ChangeLog Diagnostics tab load (admin) → auto-trigger → verifyEngagementAuditFoundation
  → publishCanonicalArtifact (validates classification + required fields)
  → PublishedOutput.create (through gateway)

RunNW040Verification page → manual button → same fixed path
```

## Canonical Artifact Publishing

- **Create path:** Now routed through `publishCanonicalArtifact` with proper classification (`verification_record`), required metadata, and gateway validation.
- **Update path (deduplication):** Remains a direct `PublishedOutput.update` on existing records. This is correct since the gateway only handles create; updates to existing artifacts do not need classification re-validation.
- **Metadata:** Adds `generated_by: 'CanonicalVerificationWriter'` and `engine_version: '1.0.0'` to align with the canonical writer contract.

## ChangeLog Visibility

After sync, the NW-UPGRADE-040 verification artifact should appear in ChangeLog → Verification tab because:
- `classification: 'verification_record'` matches the Verification tab filter
- `status: 'published'` matches the published filter
- The artifact is created through the validated gateway

## Temporary Trigger (to remove after confirmation)

A `useEffect` in `ChangeLog.jsx` invokes `verifyEngagementAuditFoundation` once when:
- The Diagnostics tab is active
- The user is admin or super_admin
- It hasn't already run in this page session

The trigger is clearly labeled as `NW-UPGRADE-040R` and logs results to the browser console.

## Remaining Risks

1. **Temporary trigger should be removed** after confirming the artifact appears in ChangeLog. It is harmless (idempotent with deduplication) but adds unnecessary network calls on each fresh page load.
2. **No UpgradeRegistry entry for NW-UPGRADE-040** — the Release Controller canonical path (which requires a registry record) is not used here. The verification function publishes directly through the gateway, which is correct for a verification function that is not part of the normal upgrade completion lifecycle.

## Architecture Preservation

- Release Controller: **Not modified**
- ChangeLog filters: **Not modified**
- Canonical artifact classifications: **Unchanged** (`verification_record`)
- Verification downloads: **Unchanged**
- No new artifact writer paths introduced
- No permissions weakened (permissions strengthened)
