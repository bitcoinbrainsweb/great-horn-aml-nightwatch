# Nightwatch Verification Artifact System

## Overview

The Nightwatch verification artifact system ensures all product upgrades create auditable, traceable records that appear in the ChangeLog. This system was repaired and hardened in NW-UPGRADE-025A.

## Architecture

### Data Flow

```
Upgrade Execution
    ↓
createVerificationArtifact (Canonical Writer)
    ↓
PublishedOutput Entity
    ↓
ChangeLog Query (getChangeLogArtifacts)
    ↓
ChangeLog Page Display
```

### Canonical Components

1. **Writer**: `functions/createVerificationArtifact.js`
   - Single source of truth for artifact creation
   - Enforces schema compliance
   - Performs mandatory post-write validation

2. **Storage**: `PublishedOutput` entity
   - Required classification: `verification_record`
   - Required status: `published`
   - All verification artifacts stored here

3. **Query**: `components/changelog/ChangeLogQuery.js`
   - Canonical query logic shared across UI
   - Filters by status and classification
   - Sorts by publication date

4. **Display**: `pages/ChangeLog.jsx`
   - Restricted to admin/super_admin
   - Uses shared query logic
   - Renders expandable verification cards

## Required Fields

Every verification artifact MUST include:

```javascript
{
  // Entity fields (PublishedOutput)
  outputName: "Nightwatch_VerificationRecord_<Title>_<Version>_<UpgradeID>_<Date>",
  classification: "verification_record",
  subtype: "upgrade_verification",
  status: "published",
  published_at: "<ISO timestamp>",
  upgrade_id: "<NW-UPGRADE-XXX>",
  product_version: "<v0.X.X>",
  source_module: "<NW-UPGRADE-XXX>",
  source_event_type: "verification_complete",
  display_zone: "internal_only",
  is_runnable: false,
  is_user_visible: false,
  
  // Content structure (JSON string)
  content: {
    upgrade_metadata: {
      upgrade_id: string,
      prompt_id: string,
      product_version: string,
      timestamp: string,
      actor: string,
      actor_role: string
    },
    upgrade_summary: {
      title: string,
      description: string,
      purpose: string,
      components_modified: string[]
    },
    validation_results: {
      checks_performed: string[],
      records_inserted: object,
      records_updated: object,
      schema_changes: string[],
      ui_checks: string[],
      total_records_affected: number
    },
    system_impact: {
      entities_affected: string[],
      pages_affected: string[],
      functions_affected: string[],
      components_affected: string[],
      total_files_modified: number
    },
    known_issues: {
      failures: string[],
      warnings: string[],
      notes: string[],
      total_issues: number
    },
    verification_status: {
      overall_status: "PASS" | "PASS_WITH_WARNINGS" | "FAIL",
      passed: boolean,
      passed_with_warnings: boolean,
      failed: boolean
    }
  },
  
  // Metadata (JSON string)
  metadata: {
    prompt_id: string,
    generated_by: string,
    engine_version: string
  }
}
```

## Hard Validation Requirements

As of NW-UPGRADE-025A, all verification artifacts MUST pass these checks:

1. **Artifact Exists**: Record retrievable from PublishedOutput
2. **Classification Correct**: `classification === "verification_record"`
3. **Status Published**: `status === "published"`
4. **ChangeLog Visible**: Artifact appears in real ChangeLog query results
5. **Content Valid**: Content field contains valid JSON

**Critical**: If ANY check fails, upgrade completion is blocked with HTTP 500.

## Usage

### Creating a Verification Artifact

```javascript
const response = await base44.functions.invoke('createVerificationArtifact', {
  // Required fields
  upgrade_id: 'NW-UPGRADE-XXX',
  prompt_id: 'NW-UPGRADE-XXX-PROMPT-001',
  product_version: 'v0.6.0',
  title: 'Upgrade Title',
  description: 'What this upgrade does',
  purpose: 'Why this upgrade was needed',
  
  // Optional but recommended
  components_modified: ['pages/SomePage.jsx', 'entities/SomeEntity.json'],
  validation_results: {
    checks_performed: ['Schema validation', 'Data integrity'],
    records_inserted: { SomeEntity: 5 },
    records_updated: { AnotherEntity: 12 },
    schema_changes: ['Added new field to Entity'],
    ui_checks: ['Page renders correctly'],
    total_records_affected: 17
  },
  system_impact: {
    entities_affected: ['SomeEntity', 'AnotherEntity'],
    pages_affected: ['SomePage'],
    functions_affected: ['someFunction'],
    components_affected: ['SomeComponent'],
    total_files_modified: 4
  },
  known_issues: {
    failures: [],
    warnings: ['Minor UI alignment issue on mobile'],
    notes: ['Will be addressed in future update'],
    total_issues: 1
  }
});

if (!response.data.success) {
  throw new Error('Verification artifact creation failed validation');
}
```

### Response Structure

```javascript
{
  success: true,
  artifact_id: "69b2ecc4cfc678b5fd57a32f",
  artifact_name: "Nightwatch_VerificationRecord_...",
  verification_status: "PASS",
  verification_checks: {
    artifact_exists: true,
    classification_correct: true,
    upgrade_id_matches: true,
    changelog_visible: true,
    content_readable: true
  },
  message: "Verification artifact created successfully and confirmed visible in ChangeLog"
}
```

## Repair History

### NW-UPGRADE-025A (2026-03-12)

**Problem**: NW-UPGRADE-025 did not create a visible verification artifact

**Root Cause**: System did not enforce post-write validation

**Solution**:
1. Created `repairVerificationArtifacts.js` function
2. Backfilled missing NW-UPGRADE-025 artifact
3. Created NW-UPGRADE-025A artifact
4. Enforced hard validation in canonical writer
5. Added mandatory ChangeLog visibility checks

**Outcome**: 
- Both artifacts now visible in ChangeLog
- All validation checks passing
- Future upgrades will fail hard if artifacts not visible

## Backfill Procedure

If a verification artifact is missing:

1. Use `functions/repairVerificationArtifacts.js` as template
2. Create artifact with `backfilled: true` in metadata
3. Include `backfilled_by` and `backfilled_reason` fields
4. Run full validation suite
5. Update UpgradeRegistry with backfill notes

## Testing

```javascript
// Test artifact creation
const result = await base44.functions.invoke('createVerificationArtifact', {
  upgrade_id: 'TEST-001',
  prompt_id: 'TEST-001-PROMPT-001',
  product_version: 'v0.6.0',
  title: 'Test Artifact',
  description: 'Test verification artifact',
  purpose: 'Testing artifact creation system'
});

// Verify in ChangeLog
const artifacts = await base44.entities.PublishedOutput.filter({
  upgrade_id: 'TEST-001',
  classification: 'verification_record',
  status: 'published'
});

console.assert(artifacts.length === 1, 'Artifact should exist');
console.assert(result.data.verification_checks.changelog_visible, 'Should be ChangeLog visible');
```

## Future Enhancements

1. **Automated Testing**: Add regression tests for artifact creation
2. **Duplicate Detection**: Prevent multiple artifacts for same upgrade_id
3. **Version Control**: Track artifact schema versions
4. **Metrics**: Track artifact creation success rates
5. **Alerts**: Notify on validation failures

## Governance

- All changes to verification system require Technical Admin approval
- Schema changes require ChangeLog artifact documenting the change
- Breaking changes must include migration path
- All repairs must create their own verification artifacts

## References

- PublishedOutput Entity: `entities/PublishedOutput.json`
- ChangeLog Query: `components/changelog/ChangeLogQuery.js`
- ChangeLog Page: `pages/ChangeLog.jsx`
- Canonical Writer: `functions/createVerificationArtifact.js`
- Repair Function: `functions/repairVerificationArtifacts.js