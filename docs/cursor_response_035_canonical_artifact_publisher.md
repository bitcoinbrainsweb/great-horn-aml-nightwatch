## NW-UPGRADE-035 — Canonical Artifact Publisher Gateway

### Files changed
- `functions/publishCanonicalArtifact.ts` (new)
- `functions/createVerificationArtifact.ts`

### What changed
- Introduced a minimal backend gateway `publishCanonicalArtifact` that:
  - Accepts a canonical artifact payload and a Base44 client.
  - Validates that `classification` is one of the `ALLOWED_ARTIFACT_CLASSIFICATIONS`.
  - Ensures required canonical fields are present for published artifacts (`title` or `outputName`, `classification`, `published_at`).
  - Calls `base44.asServiceRole.entities.PublishedOutput.create(...)` with the provided payload.
  - Returns the created `PublishedOutput` record without altering existing field semantics.
- Updated `createVerificationArtifact.ts` so that **only the new-creation path** (when no existing artifact is found) now uses `publishCanonicalArtifact` instead of calling `PublishedOutput.create` directly.
  - The created record still uses:
    - `classification = verification_record`
    - `status = 'published'`
    - `display_zone = 'internal_only'`
    - `subtype = 'upgrade_verification'`
    - `source_module = payload.upgrade_id`
    - `source_event_type = 'verification_complete'`
    - `product_version` and `upgrade_id` from the canonical payload
    - `published_at` sourced from the existing logic (controlled upstream by Release Controller)
  - The update path for existing artifacts is intentionally left unchanged in this upgrade to keep the refactor minimal.

### Risks / blockers
- **Scope:** This change touches the canonical verification artifact path used by `ReleaseController`, so any regression would impact upgrade completion.
- **Mitigations:**
  - The gateway is a thin wrapper that forwards the existing payload to `PublishedOutput.create` with minimal validation, so behavior should remain identical for valid requests.
  - Validation reuses the shared `ALLOWED_ARTIFACT_CLASSIFICATIONS` and does not alter classification values.
  - No changes were made to:
    - `releaseController.ts`
    - ChangeLog query logic or classification filters
    - UI components or download logic
  - Legacy/other writers still use their existing direct paths; this upgrade does **not** enforce the gateway globally yet.
- **Potential follow-up:** In later upgrades, additional writers can be migrated to `publishCanonicalArtifact`, and stricter enforcement can be added, but that is explicitly out of scope here.

### Architecture rules preserved
- **Release Controller** remains the sole authority for upgrade lifecycle completion and still calls `createVerificationArtifact` exactly as before.
- **Canonical artifact model** is unchanged; classifications and metadata shapes for verification artifacts remain the same.
- **ChangeLog visibility** is preserved because `classification`, `status`, and `published_at` semantics are unchanged and the same fields are written to `PublishedOutput`.
- **Verification downloads** continue to use the same fields (`outputName`, content metadata, and file-related fields), which are forwarded unchanged through the gateway.
- **Diagnostics** remains read-only with respect to `PublishedOutput`; no new writers or diagnostic paths were introduced.

### Ready to commit
- Pre-Commit Risk Flag: **REVIEW**
- The gateway is in place, `createVerificationArtifact` uses it for new verification artifacts, and behavior is expected to be unchanged for valid inputs. Targeted testing of a full upgrade via `ReleaseController` is recommended before merging.

