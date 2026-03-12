## Nightwatch Artifact Model Cleanup – NW-UPGRADE-033

### Files modified

- Backend:
  - `functions/artifactClassifications.ts` (new shared classification enum/constant)
  - `functions/createVerificationArtifact.ts` (canonical verification writer)
  - `functions/exportArchitectureWithFiles.ts` (canonical system export writer)
  - `functions/architectureExporter.ts` (architecture export helper)
- Frontend (ChangeLog/diagnostics only):
  - `src/components/changelog/ChangeLogQuery.jsx`
  - `src/pages/ChangeLog.jsx`
  - `src/pages/ArtifactDiagnostics.jsx`

### Artifact types detected before cleanup

Prior to NW-UPGRADE-033, `PublishedOutput.classification` values observed in the codebase included:

- `verification_record`
- `system_export` (already used by `exportArchitectureWithFiles`)
- `audit_record`
- `delivery_gate_record`
- `report`
- `tool`
- `documentation`
- `help`
- `dashboard_widget`
- `internal_record`
- `unclassified` (implicit bucket for missing classification in diagnostics)

Only a subset of these were intended to appear in ChangeLog:

- Verification tab and diagnostics tooling read:
  - `verification_record`
  - `audit_record`
  - `delivery_gate_record`
- System exports sometimes wrote:
  - `verification_record` (historical drift),
  - and later `system_export`.
- Diagnostics tools (`ChangeLog` / `ArtifactDiagnostics`) wrote:
  - `verification_record` with diagnostic subtypes, effectively polluting the verification stream.

### Final artifact classification map (post-cleanup)

For Nightwatch artifacts relevant to upgrades and ChangeLog:

- **verification_record**
  - Canonical upgrade verification artifacts.
  - Created exclusively by `createVerificationArtifact` (canonical writer), orchestrated by Release Controller for normal upgrades.
- **system_export**
  - Architecture/system snapshots.
  - Created by:
    - `exportArchitectureWithFiles.ts` (canonical system export writer),
    - `architectureExporter.ts` (external/audit-oriented exporter).
- **audit_record**
  - Reserved for future system audit artifacts (no new writers changed in this patch; existing references remain documentation/diagnostics only).
- **delivery_gate_record**
  - Reserved for delivery gate execution records (no new writers changed in this patch; existing references remain documentation/diagnostics only).
- **diagnostic_record**
  - New canonical classification for diagnostics/test artifacts.
  - Used by:
    - `ChangeLog` diagnostics writer (`ChangeLog.jsx`),
    - `ArtifactDiagnostics` test writer (`ArtifactDiagnostics.jsx`).

Other classifications such as `report`, `tool`, `documentation`, `help`, `dashboard_widget`, and `internal_record` remain in the model for **historical/compliance uses** (e.g., `report` for compliance reports in `Reports.jsx`, `tool`/`documentation` in legacy verification checks). They were **not refactored** here to avoid breaking existing reporting flows, but they are no longer used by the upgrade/ChangeLog writers touched in NW-UPGRADE-033.

### Writers corrected

#### Shared classification constants

- Added `functions/artifactClassifications.ts`:

  - Defines canonical classification constants:
    - `VERIFICATION_RECORD` → `'verification_record'`
    - `SYSTEM_EXPORT` → `'system_export'`
    - `AUDIT_RECORD` → `'audit_record'`
    - `DELIVERY_GATE_RECORD` → `'delivery_gate_record'`
    - `DIAGNOSTIC_RECORD` → `'diagnostic_record'`
  - Exposes `ALLOWED_ARTIFACT_CLASSIFICATIONS` for validation within canonical writers.

#### Canonical verification writer (`createVerificationArtifact.ts`)

- Imports shared constants and enforces classification:
  - Uses `ArtifactClassification.VERIFICATION_RECORD` when writing artifacts.
  - Validates the classification against `ALLOWED_ARTIFACT_CLASSIFICATIONS` and rejects invalid values with a clear error and log.
- Continues to:
  - Enforce `classification === 'verification_record'` post-write.
  - Enforce `status === 'published'`, correct `upgrade_id`, ChangeLog visibility, and valid JSON content.
- Result: upgrade verification artifacts **cannot drift** to other classifications when written through the canonical writer.

#### Canonical system export writers

- `exportArchitectureWithFiles.ts`:
  - Now imports `ArtifactClassification` and writes:
    - `classification: ArtifactClassification.SYSTEM_EXPORT`
  - The existing `published_output_classification` documentation array remains unchanged (backwards compatibility; no behavioral effect).

- `architectureExporter.ts`:
  - Now imports `ArtifactClassification` and writes:
    - `classification: ArtifactClassification.SYSTEM_EXPORT`
  - Retains all existing metadata and `file_manifest` behavior.

Result: all architecture exports now consistently use `system_export`, removing prior drift where some exports appeared as `verification_record`.

#### Diagnostics writers

- `src/pages/ChangeLog.jsx` → `createTestArtifact`:
  - Previously created a diagnostic test artifact with:
    - `classification: 'verification_record'`
  - Now writes:
    - `classification: 'diagnostic_record'`
    - `outputName` updated to a `Nightwatch_DiagnosticsRecord_...` pattern to reflect its nature.

- `src/pages/ArtifactDiagnostics.jsx` → `createTestArtifact`:
  - Previously wrote:
    - `classification: 'verification_record'`
  - Now writes:
    - `classification: 'diagnostic_record'`
    - Classification check updated to expect `diagnostic_record`.

Diagnostics tools now produce `diagnostic_record` artifacts only, instead of polluting the verification stream.

### ChangeLog query and tab behavior (post-cleanup)

#### Shared ChangeLog query (`ChangeLogQuery.jsx`)

- `getChangeLogArtifacts()` now:
  - Loads `PublishedOutput.filter({ status: 'published' })`.
  - Filters **in memory** to:
    - `classification === 'verification_record'`.
  - Sorts by `published_at` (or `created_date`) descending.
- `CHANGELOG_QUERY_CONFIG.classificationFilter` updated to `['verification_record']`.

This function is now intentionally scoped to the **Verification** tab only.

#### `ChangeLog.jsx` tabs

- **Verification tab**:
  - Uses `getChangeLogArtifacts()` to load only `verification_record` artifacts.
  - Real-time subscription reloads on events where:
    - `event.data.classification === 'verification_record'`.

- **System Artifacts tab**:
  - Loads **all** `PublishedOutput` with `status: 'published'`, then filters in memory to:
    - `classification === 'system_export' || classification === 'audit_record'`.
  - Renders these via `VerificationRecordCard`.

- **Diagnostics tab**:
  - `loadDiagnostics()` now:
    - Computes `classificationCounts` across all records.
    - Filters to `published` records.
    - Derives a diagnostics list from records where:
      - `classification === 'diagnostic_record'` OR
      - `classification === 'delivery_gate_record'`.
    - Sorts by `published_at` / `created_date` descending and takes the latest 10 as `recent`.
  - Summary counts:
    - `total` = all records.
    - `published` = records with `status === 'published'`.
    - `changelogVisible` = length of the diagnostics `recent` list for this tab.

Resulting behavior (per tab requirement):

- Verification tab → `verification_record` only.
- System Artifacts tab → `system_export` and `audit_record`.
- Diagnostics tab → `diagnostic_record` and `delivery_gate_record`.

### Remaining legacy paths / classifications

- **Compliance reports**:
  - Writers such as:
    - `functions/BackfillHistoricalRecords.ts`
    - `functions/NormalizeVerificationReports.ts`
    - `functions/publishNW011Report.ts`
  - Still write `classification: 'report'` for compliance/engagement outputs consumed by `Reports.jsx`.
  - These are **intentionally not modified** in NW-UPGRADE-033 to avoid breaking the reporting pipeline.
  - They are outside the Release Controller and ChangeLog upgrade verification flow.

- **Tool/documentation/internal classifications**:
  - Verification/diagnostic functions like `VerifyNW011Implementation.ts` and related helpers still reference:
    - `tool`, `documentation`, `internal_record` classifications for test coverage and validation.
  - These are **verification helpers**, not writers used by Release Controller or ChangeLog tabs.

### Verification outcomes

After the cleanup:

- **Architecture exports**:
  - Are written exclusively with `classification: 'system_export'` (via `exportArchitectureWithFiles` and `architectureExporter`).
  - Appear only in the **System Artifacts** tab.

- **Verification artifacts**:
  - Are written with `classification: 'verification_record'` by `createVerificationArtifact`.
  - Are the only artifacts surfaced by `getChangeLogArtifacts()` and the **Verification** tab.
  - Release Controller flows (NW-UPGRADE-032) still work unchanged, since they already call `createVerificationArtifact` and rely on `classification: 'verification_record'`.

- **Diagnostics records**:
  - Are now consistently created with `classification: 'diagnostic_record'`.
  - Appear in the Diagnostics tab (alongside any future `delivery_gate_record` outputs), not in Verification.

- **No artifact defaults to `verification_record`**:
  - Canonical verification writer explicitly uses the `VERIFICATION_RECORD` constant, and validates it against `ALLOWED_ARTIFACT_CLASSIFICATIONS`.
  - Diagnostics writers and system exporters now use the appropriate `diagnostic_record` and `system_export` labels.

### Summary

NW-UPGRADE-033 introduces a shared artifact classification enum for backend writers, corrects classification usage for canonical verification and system export paths, reclassifies diagnostics artifacts to `diagnostic_record`, and tightens ChangeLog queries so each tab displays only the intended artifact types. Historical and compliance/report artifacts remain unchanged and readable; a separate migration can normalize them later if needed. The Release Controller architecture from NW-UPGRADE-032 continues to operate unchanged, now on top of a cleaner, more deterministic artifact classification model. 

