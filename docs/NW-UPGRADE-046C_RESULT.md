# NW-UPGRADE-046C — Delivery Gate Output Fix (Result)

**Upgrade ID:** NW-UPGRADE-046C
**Status:** Implemented
**Risk Flag:** SAFE

---

## Why Artifacts Were Showing 0 / 0

The stored artifact's `content` JSON was oversized. It contained:
- `delivery_gate_results` (~50 entries with gate data)
- `checks[]` (~50 objects, some with large stringified JSON in `details`)
- `warnings[]` (variable)
- `violations[]` (variable)
- `architecture_notes` (nested object)

The `checks` and `delivery_gate_results` carried **overlapping data** — every check appeared twice. Graph contract checks had `details: JSON.stringify(result)` with nested JSON objects, which when double-serialized inside `JSON.stringify(artifactContent)` produced heavily escaped strings.

If the resulting `content` string exceeded the `PublishedOutput.content` storage limit, it was silently truncated. `VerificationRecordCard` caught the JSON parse error and fell back to `content = {}`, making `content.delivery_gate_results` undefined → `gateResults = {}` → `totalTests = 0, passedTests = 0` → **"Delivery Gates: 0 / 0"**.

## Files Changed

| File | Change |
|------|--------|
| `functions/verifyLatestBuild.ts` | See detailed changes below |

No other files were modified.

## Detailed Changes in `verifyLatestBuild.ts`

### 1. Compact artifact content (lines 573-588)

Removed `checks`, `warnings`, `violations`, and `architecture_notes` from the stored artifact content. These arrays remain in the API response (returned to the dashboard) — they are just not duplicated in the persisted artifact. The stored artifact now carries only:
- `build_label`
- `success`
- `generated_at`
- `verification_mode`
- `contract_registry` (summary counts only)
- `delivery_gate_results` (the gate data `VerificationRecordCard` reads)
- `summary` (compact counts including gate totals)
- `changed_files_summary`

### 2. Evidence string cap (lines 545-561)

Each gate entry's `evidence` string is capped at 200 characters. Graph contract and artifact contract checks previously had evidence strings containing `JSON.stringify(result)` — hundreds or thousands of characters of serialized JSON. These are now truncated with `...` suffix if they exceed 200 chars.

### 3. Dynamic product_version (lines 590-592, 601)

Replaced hardcoded `'v0.6.0'` with `buildIdentity.product_version` (falling back to `'v0.6.0'` only if the resolved version is `'UNKNOWN'`).

### 4. Gate counts in summary field (line 606)

The artifact's `summary` text field now reads:
```
{build_label}: {passed}/{total} delivery gates passed, {warnings} warnings, {violations} violations
```
This makes gate pass rate visible in any view that shows the summary text, without requiring JSON parsing of the content field.

### 5. Console.log diagnostic (line 566)

Added `console.log` before publish confirming gate count:
```
[verifyLatestBuild] delivery_gate_results: X/Y gates passed
```

## Verification Checklist

| Check | Status |
|-------|--------|
| `delivery_gate_results` constructed from real checks | Confirmed — built from `checks[]` and `violations[]` after all 5 contract categories execute |
| `delivery_gate_results` included in `PublishedOutput.create()` `content` field | Confirmed — via `artifactContent.delivery_gate_results` at line 579 |
| API response includes `delivery_gate_results` | Confirmed — at line 661 |
| `VerificationRecordCard` reads `content.delivery_gate_results` | Confirmed — at card lines 42-54, same format (`{ status: 'pass'\|'fail', evidence: '...' }`) |
| Upgrade ID NW-UPGRADE-046C used in docs | Confirmed |
| No unrelated files changed | Confirmed — only `functions/verifyLatestBuild.ts` |
| Contract logic not modified | Confirmed — all 25 contracts execute identically |
| ChangeLog filters not modified | Confirmed |
| Unrelated UI/pages not modified | Confirmed |

## Expected Result After Deployment

The next build verification run should produce an artifact where:
- `content.delivery_gate_results` has ~30-50 entries (one per contract check)
- `VerificationRecordCard` displays: **X / X tests passed** (where X = total checks)
- The artifact `summary` field shows: **{build}: X/Y delivery gates passed**
- Console log confirms: `[verifyLatestBuild] delivery_gate_results: X/Y gates passed`

## Remaining Risks

1. **Old artifacts** created before this fix will still show 0/0. Only new artifacts will have correct gate data.
2. If Base44's `content` field limit is very small (<5KB), even the compact content could be truncated. The current compact format should be well under any reasonable limit (~3-4KB estimated).
