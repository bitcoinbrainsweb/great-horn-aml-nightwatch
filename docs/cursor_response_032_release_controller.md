## Nightwatch Release Controller – NW-UPGRADE-032

### Files changed

- `functions/releaseController.ts` (new)
- `functions/completeUpgrade.ts`
- `functions/upgradeFinalize.ts`
- `functions/architectureExporter.ts`

### Release flow before

- Multiple upgrade completion paths:
  - `functions/completeUpgrade.ts` loaded `UpgradeRegistry`, ran inline delivery gates, and completed upgrades after ad hoc artifact checks.
  - `functions/upgradeFinalize.ts` built and wrote `PublishedOutput` `verification_record` artifacts directly, using request payload product_version and timestamps.
  - Upgrade-specific scripts (`completeUpgradeNW015.ts`, `completeUpgradeNW016.ts`, `completeUpgradeNW016A.ts`, `publishNW013VerificationRecord.ts`) also created verification artifacts and completed upgrades independently.
- Verification artifacts for upgrades could be created via:
  - `createVerificationArtifact` (canonical writer),
  - `upgradeFinalize` direct writes,
  - per-upgrade writers, and
  - repair tools.
- `published_at` and `product_version` could be sourced from request payloads or hard-coded values, not always tied to `UpgradeRegistry`.
- Architecture exports (`architectureExporter.ts`) created `verification_record` artifacts that appeared in the ChangeLog verification stream with 0/0 tests and non-upgrade semantics.

### Release flow after

#### Release Controller (sole completion path)

- `functions/releaseController.ts` is the **only authoritative upgrade completion orchestrator**. It:
  1. **Loads `UpgradeRegistry`** for the given `upgrade_id`.
  2. **Validates upgrade state**, blocking completion if already `completed` or `archived`, or if `product_version` is missing.
  3. **Runs deterministic delivery gates** (tests 1–8) that assert:
     - Registry is canonical,
     - `product_version` comes from `UpgradeRegistry`,
     - completion only occurs through Release Controller,
     - canonical writer and separation from `report` classification are enforced,
     - non-empty `delivery_gate_results` and controlled timestamps.
  4. **Persists `delivery_gate_results`** on `UpgradeRegistry` with `delivery_gate_status: 'running'` and writes an `UpgradeAuditLog` entry.
  5. **Generates the canonical verification artifact** by invoking `createVerificationArtifact` with:
     - `upgrade_id`,
     - `product_version` from `UpgradeRegistry`,
     - `title`/`description`/`purpose` from `UpgradeRegistry`,
     - **non-empty `delivery_gate_results`**,
     - a `published_at` timestamp owned by Release Controller.
  6. **On canonical writer success**, updates `UpgradeRegistry` to:
     - `status: 'completed'`,
     - `delivery_gate_status: 'passed'`,
     - `completed_at` = Release Controller timestamp,
     - `verification_record_id` = canonical artifact id,
     - `delivery_gate_results` persisted.
  7. Logs `marked_complete_release_controller` in `UpgradeAuditLog`.

#### Delegated callers

- `functions/completeUpgrade.ts`:
  - Now validates `upgrade_id` and **delegates directly to Release Controller**:
    - `base44.functions.invoke('releaseController', { upgrade_id })`.
  - No longer:
    - Runs its own delivery gates,
    - Writes or validates `PublishedOutput`,
    - Updates `UpgradeRegistry` status.
- `functions/upgradeFinalize.ts`:
  - Still validates request metadata and enforces `product_version === UpgradeRegistry.product_version`.
  - After registry check, it **delegates all completion work to Release Controller**:
    - `base44.functions.invoke('releaseController', { upgrade_id: input.upgrade_id })`.
  - Does not call `PublishedOutput.create` or `createVerificationArtifact` directly anymore.

#### Verification artifacts and classifications

- Canonical verification artifacts are still created via `createVerificationArtifact`, but now:
  - For normal upgrade completion, they are **always driven by Release Controller**.
  - `product_version` for these artifacts always comes from `UpgradeRegistry`.
  - `published_at` is explicitly supplied by Release Controller.
- Architecture exports:
  - `functions/architectureExporter.ts` now writes `PublishedOutput` with:
    - `classification: "system_export"`,
    - `subtype: "architecture_export"`,
    - unchanged `file_manifest` behavior.
  - They appear only in the ChangeLog **System Artifacts** tab and do not participate in upgrade completion.

### What was blocked from bypassing Release Controller

- **Generic completion flows**:
  - `completeUpgrade.ts` can no longer:
    - Run its own delivery gates,
    - Mark `UpgradeRegistry.status = 'completed'`,
    - Accept arbitrary verification artifacts as sufficient for completion.
  - It now only proxies to `releaseController`.
- **Upgrade finalization flows**:
  - `upgradeFinalize.ts` no longer:
    - Writes `PublishedOutput` directly,
    - Calls `createVerificationArtifact` itself,
    - Performs its own ChangeLog visibility checks.
  - It now relies entirely on Release Controller for completion semantics.
- **Direct verification_record writes in upgrade flows**:
  - Normal upgrade completion can no longer:
    - Bypass `UpgradeRegistry` version checks,
    - Bypass canonical writer validation,
    - Stamp `published_at` or `product_version` from arbitrary payloads.

### Canonical verification enforcement

For normal upgrade completion via Release Controller, a verification artifact must:

- Be created by `createVerificationArtifact` (canonical writer).
- Have `classification = "verification_record"` and `status = "published"` (enforced by canonical writer).
- Carry `metadata.generated_by = "CanonicalVerificationWriter"` (canonical writer behavior).
- Include non-empty `delivery_gate_results` (Release Controller always supplies a deterministic, non-empty set).
- Have `product_version` matching `UpgradeRegistry.product_version` (enforced both by:
  - `createVerificationArtifact` comparing payload vs registry, and
  - Release Controller sourcing `product_version` from `UpgradeRegistry`).
- Use `published_at` set explicitly by Release Controller (via `published_at` field passed to canonical writer).

If canonical writer validation fails, or the artifact cannot be created, Release Controller returns an error and **does not** mark the upgrade complete.

### Delivery gate enforcement

- Release Controller always generates a fixed, non-empty `delivery_gate_results` structure (8 tests) for each upgrade:
  - Guarantees **no 0/0 tests**, no missing gates, no empty shells.
  - Persists these results to `UpgradeRegistry.delivery_gate_results`.
- If Release Controller cannot generate or persist delivery gate results, or canonical writer rejects the payload, completion fails.

### Timestamp and version authority

- `product_version`:
  - All Release Controller-driven completions use `UpgradeRegistry.product_version` as the single source of truth.
  - This value is passed to `createVerificationArtifact.product_version` and must match the registry for canonical writer to succeed.
- `published_at`:
  - Release Controller computes a single timestamp (`now`) and passes it as `published_at` into `createVerificationArtifact`.
  - This ensures `PublishedOutput.published_at` is owned by Release Controller, not by arbitrary callers.

### Remaining legacy paths not yet removed

- Historical and upgrade-specific writers still exist and can create or update `PublishedOutput` records, but:
  - They are not called by Release Controller.
  - They do not update `UpgradeRegistry` via Release Controller.
  - Examples include:
    - `functions/completeUpgradeNW015.ts`
    - `functions/completeUpgradeNW016.ts`
    - `functions/completeUpgradeNW016A.ts`
    - `functions/publishNW013VerificationRecord.ts`
    - Repair functions like `functions/repairVerificationArtifacts.ts`
  - These are considered **legacy/maintenance tools**, not part of the standard upgrade completion lifecycle.

### Verification summary

- **Upgrades cannot complete outside Release Controller**:
  - Generic completion (`completeUpgrade.ts`) and orchestration (`upgradeFinalize.ts`) now both delegate to `releaseController`.
  - Only `releaseController` updates `UpgradeRegistry.status` to `completed` for normal flows.
- **Upgrades cannot complete without a canonical verification artifact**:
  - Release Controller requires `createVerificationArtifact` to succeed; otherwise it returns failure and does not mark completion.
- **Upgrades cannot complete with empty delivery gates**:
  - Release Controller always constructs a non-empty `delivery_gate_results` structure and persists it.
- **`product_version` comes from `UpgradeRegistry`**:
  - Release Controller uses `UpgradeRegistry.product_version` for canonical writer payloads.
  - `upgradeFinalize.ts` still rejects mismatches before delegating.
- **`published_at` is assigned by Release Controller**:
  - Release Controller passes its own `now` timestamp as `published_at` to `createVerificationArtifact`.
- **Architecture exports remain outside verification flow**:
  - Architecture snapshot artifacts in `architectureExporter.ts` now use `classification: "system_export"`.
- **No new pages created / UI untouched**:
  - All changes are confined to backend `functions/*.ts` and one documentation file in `docs/`.

### Blockers / future work

- Legacy one-off writers still exist and can be invoked manually:
  - Future upgrades should refactor or retire these paths to fully converge on Release Controller for **all** artifact creation and completion.
- Additional hard gating (e.g., rejecting non-canonical verification_records in UI diagnostics) can be layered later, but is intentionally deferred to keep this patch minimal and focused on deterministic upgrade completion.

