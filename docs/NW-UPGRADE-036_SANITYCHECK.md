## NW-UPGRADE-036 — System Contract Sanity Check (Planning Only)

This document captures the **sanity check and implementation plan** for NW-UPGRADE-036.  
No application code has been modified as part of this step.

---

### 1. Minimal implementation approach

- **New backend utility function**
  - Add a single new function file under `functions/`:
    - `functions/verifyNightwatchSystemContract.ts`
  - Implement it as a **read-only** Deno function using the Base44 SDK:
    - Accepts a simple POST (no required request body).
    - Restricted to Technical Admin roles (`admin` / `super_admin`).
    - Returns JSON in the shape:
      ```json
      {
        "success": true | false,
        "checks": [],
        "warnings": [],
        "violations": []
      }
      ```
- **Behavior**
  - Performs a series of **system contract checks** against:
    - `PublishedOutput` records in the database.
    - Static TypeScript source in the repository (for writer usage).
  - Aggregates results into:
    - `checks`: named, structured pass/fail checks.
    - `warnings`: non-fatal issues or legacy patterns that should be addressed later.
    - `violations`: contract-breaking findings that should fail the sanity check.
  - **Read-only** by design: no calls to `create`, `update`, or other mutating methods.

---

### 2. Exact files that would change

If/when NW-UPGRADE-036 is implemented as planned, the **only required code change** is:

- **New file**
  - `functions/verifyNightwatchSystemContract.ts`
    - Contains the `verifyNightwatchSystemContract` Deno function.
    - Imports `ALLOWED_ARTIFACT_CLASSIFICATIONS` from `artifactClassifications.ts`.
    - Uses the existing Base44 client to read `PublishedOutput` entities.

No other files need to change for this upgrade, as long as the utility remains purely read-only and self-contained.

---

### 3. Pre-Commit Risk Flag

**Pre-Commit Risk Flag: SAFE**

- **Scope**
  - The function is an **observability / sanity-check** tool only.
  - It does not modify the database, alter upgrade lifecycle behavior, or touch UI components.
- **Behavior**
  - Read-only queries against `PublishedOutput`.
  - Static text scanning of `.ts` files for `PublishedOutput.create(` usage.
  - No side effects; it only returns a structured report.
- **Invocation**
  - Runs only when explicitly called (e.g., via a function invocation).
  - Not wired into any critical path like `ReleaseController` or page loads.

Given these constraints, implementing `verifyNightwatchSystemContract` as described is low risk.

---

### 4. Confirmation of non-effects

Assuming the implementation follows this plan:

- **Release Controller authority**
  - `functions/releaseController.ts` is not modified.
  - The new utility is independent and does **not** participate in upgrade lifecycle orchestration.
  - Release Controller remains the **sole authority** for upgrade completion and verification artifact production timing.

- **ChangeLog queries**
  - No changes to:
    - `src/components/changelog/ChangeLogQuery.jsx`
    - `src/pages/ChangeLog.jsx`
  - The utility **mirrors** the ChangeLog filter logic internally (for verification) but does not modify it.
  - Therefore, ChangeLog behavior and tab visibility remain unchanged.

- **Artifact classifications**
  - The utility **reads** `classification` values from `PublishedOutput` and compares them to the canonical set.
  - It does **not** update or remap classifications.
  - Canonical classification definitions in `artifactClassifications.ts` remain the single source of truth.

- **Verification downloads**
  - No changes to any code that:
    - Generates download URLs,
    - Resolves files/blobs,
    - Or renders download buttons/cards in the UI.
  - The utility only inspects metadata fields; it does not interact with file storage paths.

---

### 5. How each proposed system contract check would work

The `verifyNightwatchSystemContract` function will execute several checks, each reported as an entry in `checks` with a `name`, `passed` flag, and optional `details`.

#### 5.1 Artifact classifications are valid

- **Goal**
  - Ensure all `PublishedOutput.classification` values belong to the canonical set:
    - `verification_record`
    - `system_export`
    - `audit_record`
    - `delivery_gate_record`
    - `diagnostic_record`
- **Implementation**
  - Query `PublishedOutput`:
    - `const allRecords = await base44.asServiceRole.entities.PublishedOutput.filter({});`
  - Collect all distinct `classification` strings:
    - Normalize `null`/empty to `'unclassified'` for reporting.
  - Compare each value to `ALLOWED_ARTIFACT_CLASSIFICATIONS`.
  - For each non-allowed value:
    - Append a human-readable description to `violations`, e.g.:
      - `"Invalid classification found: \"legacy_type\""`
  - **Check entry**
    - `name`: `"classifications_valid"`
    - `passed`: `true` if no invalid classifications; otherwise `false`.
    - `details`: includes `seen_classifications` and `invalid_classifications`.

#### 5.2 No direct artifact writes exist outside the gateway

- **Goal**
  - Detect code paths that call `PublishedOutput.create(` directly instead of routing through the canonical gateway (`publishCanonicalArtifact`) or known grandfathered repair tools.
  - This check is **static** (source-based), not runtime-based.
- **Implementation**
  - Resolve the repository root (e.g. `Deno.cwd()`).
  - Recursively scan `.ts` files using `Deno.readDir` and `Deno.readTextFile`.
  - For each file:
    - Split into lines and look for the substring `PublishedOutput.create(`.
    - Record findings as:
      - `Direct PublishedOutput.create usage in <path>:<lineNumber>`
    - Exclude the canonical gateway file (`publishCanonicalArtifact.ts`) from warnings.
    - Optionally, maintain a small allowlist of legacy repair writers if necessary (future refinement).
  - Add each finding to `warnings` (so the check is advisory for now).
  - **Check entry**
    - `name`: `"artifact_writers_routed_through_gateway"`
    - `passed`: `true` if no out-of-gateway usages; `false` otherwise.
    - `details`: list of files/lines where direct `PublishedOutput.create` was found.

#### 5.3 Verification artifacts contain required metadata

- **Goal**
  - Ensure every published verification artifact has the core metadata required by the architecture:
    - `classification`
    - `published_at`
    - `upgrade_id`
    - `product_version`
- **Implementation**
  - Query `PublishedOutput`:
    - Filter `classification === 'verification_record'` and `status === 'published'`.
  - For each record:
    - Build a `missing` array of any absent/empty fields from the required set.
    - If `missing` is non-empty, append a violation such as:
      - `"Verification artifact <id> missing required fields: published_at, product_version"`
  - **Check entry**
    - `name`: `"verification_metadata_complete"`
    - `passed`: `true` if no records are missing required fields; otherwise `false`.
    - `details`: includes counts and a list of violating record ids with their missing fields.

#### 5.4 Published verification_record appear in ChangeLog queries

- **Goal**
  - Ensure that every published `verification_record` is visible to the ChangeLog Verification tab, given its classification-based filter.
- **Implementation**
  - Reuse the verification set from 5.3:
    - All `PublishedOutput` where `classification === 'verification_record'` and `status === 'published'`.
  - Independently, simulate the ChangeLog Verification filter server-side:
    - Query `PublishedOutput` where `status === 'published'`.
    - Filter in memory to `classification === 'verification_record'`.
  - Build a set of ids from the simulated ChangeLog result.
  - For each published verification artifact:
    - If its id is **not** in the ChangeLog set, record a violation:
      - `"Verification artifact <id> is published but not visible in ChangeLog verification query"`
  - **Check entry**
    - `name`: `"verification_visible_in_changelog"`
    - `passed`: `true` if all published verification artifacts are visible under this filter; otherwise `false`.
    - `details`: includes counts and ids of any missing records.

---

### 6. Result aggregation semantics

Once all checks are executed:

- `checks`:
  - Contains one entry per check (`classifications_valid`, `artifact_writers_routed_through_gateway`, `verification_metadata_complete`, `verification_visible_in_changelog`).
  - Each entry has:
    - `name`
    - `passed`
    - optional `details` with structured data.
- `warnings`:
  - Contains human-readable descriptions of non-fatal issues, such as:
    - Direct `PublishedOutput.create` usages outside the gateway.
    - Legacy patterns or soft policy violations that should be cleaned up later.
- `violations`:
  - Contains human-readable descriptions of contract-breaking failures:
    - Invalid classifications.
    - Missing required metadata on verification artifacts.
    - Published verification artifacts not visible to the simulated ChangeLog query.
- `success`:
  - `true` **only if**:
    - All checks have `passed === true`, **and**
    - `violations.length === 0`.
  - `false` if any check fails or any violation exists.

This provides a clear, structured, and non-destructive way to validate that Nightwatch’s core system contract remains intact after upgrades.

