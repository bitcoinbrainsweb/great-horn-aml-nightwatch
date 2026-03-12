# NW-UPGRADE-037 — Control Coverage Map (Result)

This document summarizes the implementation of NW-UPGRADE-037.

---

## Files created or modified

| File | Action |
|------|--------|
| `functions/verifyControlCoverage.ts` | **Created** |

No other application files were created or modified for this upgrade.

---

## Summary of logic implemented

The `verifyControlCoverage` function is a **read-only** backend utility that computes a basic **risk→control coverage map**. It:

- Loads risks from `RiskLibrary`.
- For each risk, determines how many controls reference it (via mappings or linked ids).
- Aggregates overall coverage statistics:
  - `total_risks`
  - `covered_risks` (risks with ≥1 control)
  - `uncovered_risks` (risks with 0 controls)
  - `coverage_percentage` (integer percentage, rounded)
- Returns:
  - The summary object, and
  - A list of `uncovered_risk_ids` for further analysis.

The function does **not** mutate any data; it only reads and reports.

---

## Auth behavior

- Requires an **authenticated user** via `base44.auth.me()`.
- If the user is not authenticated:
  - Returns HTTP 401 with body:
    ```json
    {
      "success": false,
      "error": "Unauthorized",
      "summary": null,
      "uncovered_risk_ids": []
    }
    ```
- The function can be further restricted to admin roles if desired, but by default only checks that a user is present.

---

## Fallback behavior

For each risk:

- **Primary path**:
  - Attempts to load mappings via:
    - `RiskControlMapping.filter({ risk_id: risk.id })`
  - Uses `mappings.length` as the number of controls referencing the risk.
- **Fallback path**:
  - If the mapping query throws (e.g., entity not available or permission issue), it falls back to:
    - `risk.linked_control_ids`
  - When `linked_control_ids` is an array, uses its `length` as the control count; otherwise treats it as zero.

This ensures the function can still provide a coverage snapshot even if formal mapping entities are not available or fully configured.

---

## Response shape

On success, the function returns:

```json
{
  "success": true,
  "summary": {
    "total_risks": 0,
    "covered_risks": 0,
    "uncovered_risks": 0,
    "coverage_percentage": 100
  },
  "uncovered_risk_ids": []
}
```

Where:

- `total_risks`: Number of risks loaded from `RiskLibrary`.
- `covered_risks`: Count of risks with at least one control referencing them.
- `uncovered_risks`: Count of risks with zero controls.
- `coverage_percentage`:
  - `100` when `total_risks === 0` (empty library treated as fully covered).
  - Otherwise `Math.round((covered_risks / total_risks) * 100)`.
- `uncovered_risk_ids`: Array of risk ids with `controlCount === 0`.

On unexpected error, the function returns:

```json
{
  "success": false,
  "error": "error message",
  "summary": null,
  "uncovered_risk_ids": []
}
```

---

## Confirmation the function is read-only

- Uses only **read** operations:
  - `RiskLibrary.list(...)`
  - `RiskControlMapping.filter({ risk_id })` (when available)
  - In-memory inspection of `risk.linked_control_ids`.
- Does **not** call any mutating APIs:
  - No `create`, `update`, or `delete` calls on any entity.
- There are **no writes** to the database or storage and no side effects besides logging and returning the JSON result.

---

## Confirmation no architecture rules were violated

- **Release Controller**
  - `functions/releaseController.ts` was not modified.
  - The control coverage function does not participate in upgrade lifecycle or artifact creation.

- **ChangeLog**
  - No changes to `ChangeLog.jsx` or `ChangeLogQuery.jsx`.
  - The function does **not** read or write `PublishedOutput` and does not affect ChangeLog visibility.

- **Artifact writers**
  - The function does not invoke `PublishedOutput.create`, `PublishedOutput.update`, or any other artifact writer.
  - It operates only on risk/control entities and in-memory counts.

- **Artifact classifications**
  - The function does not read or change artifact `classification` values.
  - Canonical classification rules remain enforced elsewhere and are untouched.

- **Verification downloads**
  - No download logic or file fields were changed.
  - Verification artifacts, their classifications, and download behavior remain unchanged.

Overall, NW-UPGRADE-037 introduces a **read-only control coverage utility** that does not alter existing upgrade, artifact, or ChangeLog behavior.

