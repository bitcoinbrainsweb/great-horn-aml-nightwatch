## NW-UPGRADE-034 — Artifact Classification Repair

**Pre-Commit Risk Flag**: REVIEW

### Files modified

- `functions/artifactClassifications.ts` (reused from NW-UPGRADE-033; no changes in this upgrade)
- `functions/repairArtifactClassificationsNW034.ts` (new migration/repair function)
- `src/components/changelog/ChangeLogQuery.jsx` (already aligned in NW-UPGRADE-033; no changes in this upgrade)
- `src/pages/ChangeLog.jsx` (already aligned in NW-UPGRADE-033; no changes in this upgrade)
- `src/pages/ArtifactDiagnostics.jsx` (already aligned in NW-UPGRADE-033; no changes in this upgrade)

### Artifact types detected before repair

From repository analysis and diagnostics:

- Total `PublishedOutput` records: > 0 (e.g., Diagnostics previously reported 56 total, 56 published).
- Classifications in use included:
  - `verification_record`
  - `system_export`
  - `diagnostic_record`
  - `audit_record`
  - `delivery_gate_record`
  - plus legacy/report classifications (`report`, `tool`, `documentation`, `help`, `dashboard_widget`, `internal_record`).
- ChangeLog visibility filters were already strict:
  - Verification tab: `verification_record` only.
  - System Artifacts tab: `system_export` and `audit_record`.
  - Diagnostics tab: `diagnostic_record` and `delivery_gate_record`.

The symptom "Diagnostics shows total/published > 0 but ChangeLog visible = 0" indicated that **records existed** but **none matched the ChangeLog filters** (e.g., architecture exports still classified as `verification_record`, diagnostics as `verification_record` or `report`, etc.).

### Final artifact classification map (after NW-UPGRADE-034)

NW-UPGRADE-034 does not introduce new classifications; it **repairs existing records** to conform to the canonical model defined in NW-UPGRADE-033:

- `verification_record`
  - Upgrade verification artifacts (from `createVerificationArtifact` / Release Controller).
- `system_export`
  - Architecture/system exports (from `exportArchitectureWithFiles`, `architectureExporter`).
- `diagnostic_record`
  - Diagnostics/test artifacts (from `ChangeLog` and `ArtifactDiagnostics` writers).
- `audit_record`
  - System audit artifacts (where present).
- `delivery_gate_record`
  - Delivery gate execution artifacts (where present).

Legacy classifications (`report`, `tool`, `documentation`, `help`, `dashboard_widget`, `internal_record`) remain only for historical/compliance/reporting flows and are **not** changed by this upgrade.

### Writers touched (logical check) in this upgrade

NW-UPGRADE-034 **does not change writer logic**; it focuses on **existing data**:

- Canonical verification writer (`createVerificationArtifact.ts`):
  - Already locked to `classification: 'verification_record'` via `ArtifactClassification.VERIFICATION_RECORD`.
- System exporters (`exportArchitectureWithFiles.ts`, `architectureExporter.ts`):
  - Already locked to `classification: 'system_export'` via `ArtifactClassification.SYSTEM_EXPORT`.
- Diagnostics writers (`ChangeLog.jsx`, `ArtifactDiagnostics.jsx`):
  - Already writing `classification: 'diagnostic_record'`.

The upgrade adds **one repair function** that updates existing `PublishedOutput` records to match these expectations.

### Migration/repair logic

New function: `functions/repairArtifactClassificationsNW034.ts`

- Auth:
  - Requires authenticated user with `role` in `['admin', 'super_admin']`.
- Operation:
  1. Loads all `PublishedOutput` records: `base44.asServiceRole.entities.PublishedOutput.filter({})`.
  2. For each record:
     - If `classification` is already one of:
       - `verification_record`, `system_export`, `audit_record`, `delivery_gate_record`, `diagnostic_record`  
       then it is left unchanged.
     - Otherwise, applies targeted corrections:
       - **Architecture exports**:
         - If `subtype === 'architecture_export'` OR `outputName` contains `"Architecture"` OR `source_module` contains `"architecture"` (case-insensitive)  
           AND `display_zone === 'internal_only'`  
           → set `classification` to `system_export`.
       - **Diagnostics artifacts**:
         - If `subtype === 'diagnostic_test'` OR `source_module` is `"ChangeLog"` or `"ArtifactDiagnostics"`  
           → set `classification` to `diagnostic_record`.
  3. Applies changes via:
     - `base44.asServiceRole.entities.PublishedOutput.update(record.id, { classification: target })`.
  4. Aggregates summary:
     - `updated_records` count.
     - `published_records` count.
     - `published_by_classification` map.
     - Up to 100 `updates` entries `{ id, from, to }` for visibility.

- The function **does not**:
  - Create new `PublishedOutput` records.
  - Modify `ReleaseController` or its flows.
  - Change reports (`classification: 'report'`) or other legacy types unless they clearly match the architecture/diagnostic heuristics above.

### ChangeLog visibility after repair

With corrected classifications:

- **Verification tab** (via `getChangeLogArtifacts`):
  - Shows all `verification_record` artifacts (unchanged).
- **System Artifacts tab**:
  - Shows:
    - `system_export` (architecture exports, now properly classified),
    - `audit_record` (if present).
- **Diagnostics tab**:
  - Diagnostics counts:
    - `total` → all records,
    - `published` → all published,
    - `changelogVisible` → number of diagnostics/delivery gate records surfaced.
  - Recent list:
    - `diagnostic_record` and `delivery_gate_record` only, sorted by `published_at`/`created_date`.

If Diagnostics previously showed:

- `total` > 0,
- `published` > 0,
- `changelogVisible` = 0,

running `repairArtifactClassificationsNW034` ensures that any architecture/diagnostics records that belong in ChangeLog tabs now have the correct `classification` and are counted accordingly.

### Artifact downloads

NW-UPGRADE-034 does **not** change:

- `metadata.file_manifest` for system exports,
- `VerificationRecordCard` rendering or download behavior.

By restricting changes to `classification` only on selected records, we preserve:

- Downloadable JSON files for architecture exports,
- Markdown downloads for verification records (driven by `VerificationRecordCard`),
- Overall UI layout and presentation.

### Remaining legacy paths

- Historical/legacy writers that:
  - Create `report` artifacts for compliance,
  - Use `tool`/`documentation`/`internal_record` classifications in validation helpers,
  remain unchanged and continue to function as before.
- Future upgrades can perform deeper content/schema migrations if needed, but NW-UPGRADE-034 deliberately limits itself to **non-destructive classification repairs** needed to restore ChangeLog visibility.

