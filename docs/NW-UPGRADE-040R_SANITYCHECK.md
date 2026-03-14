## NW-UPGRADE-040R — Repair Broken Verification Artifact Publishing (Sanity Check)

### 1. Root cause

`verifyEngagementAuditFoundation.ts` (the NW-UPGRADE-040 verification function):
- Runs verification checks correctly.
- Writes directly to `PublishedOutput.create` (line 306), **bypassing** the canonical `publishCanonicalArtifact` gateway.
- Is only invoked manually via the `RunNW040Verification.jsx` page — there is no automatic trigger on deploy or diagnostics load.
- Uses `user.role !== 'admin'` (string equality) instead of the NW-039 pattern `['admin', 'super_admin'].includes(...)`.

As a result, even if the function runs successfully, the artifact may not be created through the canonical gateway, and there is no guarantee it was ever invoked in the live environment.

### 2. Minimal implementation approach

- Route the `PublishedOutput.create` call in `verifyEngagementAuditFoundation.ts` through `publishCanonicalArtifact`.
- Fix role check to `['admin', 'super_admin']`.
- Keep the update path (for deduplication) as a direct `PublishedOutput.update` since the gateway only handles create.
- Add a one-time auto-trigger in `ChangeLog.jsx` Diagnostics tab (similar to the NW-034 pattern) so the function runs once on admin page load. This is temporary and clearly labeled.

### 3. Exact files that would change

- `functions/verifyEngagementAuditFoundation.ts` — import and use `publishCanonicalArtifact`; fix role check
- `src/pages/ChangeLog.jsx` — add temporary one-time trigger for `verifyEngagementAuditFoundation` (auto-runs once on Diagnostics tab load for admin)

### 4. Risk flag

**SAFE** — targeted fix to one backend function to use existing gateway; one small temporary trigger.

### 5. Confirmation of non-effects

- **Release Controller:** Not modified.
- **ChangeLog queries:** Not modified.
- **Canonical artifact classifications:** Unchanged; the function already uses `verification_record`.
- **Verification downloads:** Unchanged.
- **Canonical publishing behavior:** Strengthened; the create path now goes through `publishCanonicalArtifact`.
