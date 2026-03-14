# Non-canonical artifact writer allowlist (NW-UPGRADE-039)

Canonical upgrade completion and verification artifact publishing flow:

- **Release Controller** (`releaseController.ts`) → **createVerificationArtifact** → **publishCanonicalArtifact** → `PublishedOutput.create`

Only that path is the canonical writer for upgrade verification. The functions listed below are **explicitly permitted** to write (or update) `PublishedOutput` **outside** that path. They are legacy, repair, backfill, or system-export tools—**not** for normal upgrade completion.

| Function | Purpose | Conditions |
|----------|---------|------------|
| `completeUpgradeNW015.ts` | Legacy upgrade completion (historical) | Admin-only; one-time/historical use |
| `completeUpgradeNW016.ts` | Legacy upgrade completion (historical) | Admin-only; one-time/historical use |
| `completeUpgradeNW016A.ts` | Legacy upgrade completion (historical) | Admin-only; one-time/historical use |
| `BackfillHistoricalRecords.ts` | Backfill from GeneratedReport/OutputRegistryItem | Admin-only; migration |
| `NormalizeVerificationReports.ts` | Migrate DeliveryGateRun → PublishedOutput | Admin-only; migration |
| `repairVerificationArtifacts.ts` | Backfill verification artifacts (e.g. NW-025) | Admin-only; repair |
| `repairArtifactClassificationsNW034.ts` | Update classification on existing records only | Admin/super_admin; repair, no new artifacts |
| `backendInfrastructureVerification.ts` | Infrastructure verification artifact | Admin-only; verification helper |
| `auditPageArchitecture.ts` | Page architecture audit artifact | Admin-only; audit |
| `exportArchitectureWithFiles.ts` | System architecture export (system_export) | Admin-only; canonical system_export path |
| `architectureExporter.ts` | Architecture export (legacy path) | Admin-only; system export |
| `publishCanonicalArtifact.ts` | Canonical gateway used by createVerificationArtifact | N/A (gateway itself) |
| `createVerificationArtifact.ts` | Canonical verification writer (via gateway for create) | Admin/super_admin; used by Release Controller |
| `verifyEngagementAuditFoundation.ts` | NW-040 verification; creates via `publishCanonicalArtifact`, updates existing directly | Admin/super_admin; routed through gateway for create (NW-040R) |

**Do not** add new direct `PublishedOutput.create`/`update` callers without documenting them here and ensuring they are admin-only and either repair/migration or a designated canonical path.
