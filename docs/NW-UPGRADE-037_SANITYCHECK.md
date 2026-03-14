## NW-UPGRADE-037 — Control Coverage Map (Sanity Check)

This document captures the **sanity check and implementation plan** for NW-UPGRADE-037 before implementation.

---

### 1. Minimal implementation approach

- **New backend utility function**
  - Add a single new function file under `functions/`:
    - `functions/verifyControlCoverage.ts`
  - Implement it as a **read-only** Deno function using the Base44 SDK:
    - Accepts a simple POST (no required request body).
    - Restricted to authenticated users (optionally Technical Admin roles if desired).
    - Returns JSON in the shape:
      ```json
      {
        "success": true,
        "summary": {
          "total_risks": number,
          "covered_risks": number,
          "uncovered_risks": number,
          "coverage_percentage": number
        },
        "uncovered_risk_ids": [ "..." ]
      }
      ```
- **Behavior**
  - Reads risk and control relationship data to compute a **basic control coverage map**:
    - Loads all risks (e.g. via `RiskLibrary.list(...)`).
    - For each risk, counts how many controls reference it:
      - Primary: `RiskControlMapping.filter({ risk_id })`.
      - Fallback: `risk.linked_control_ids?.length` if the mapping entity is unavailable.
  - Aggregates:
    - `total_risks`
    - `covered_risks` (risks with ≥1 control)
    - `uncovered_risks` (risks with 0 controls)
    - `coverage_percentage` (rounded integer)
  - Returns the summary plus `uncovered_risk_ids` for downstream analysis.
  - **Read-only** by design: no calls to `create`, `update`, or other mutating methods.

---

### 2. Exact files that would change

If/when NW-UPGRADE-037 is implemented as planned, the **only required code change** is:

- **New file**
  - `functions/verifyControlCoverage.ts`
    - Contains the `verifyControlCoverage` Deno function.
    - Uses the existing Base44 client to read:
      - `RiskLibrary` (or equivalent risk entity).
      - `RiskControlMapping` (for control relationships), with a fallback to `risk.linked_control_ids`.

No other files need to change for this upgrade, as long as the utility remains purely read-only and self-contained.

---

### 3. Pre-Commit Risk Flag

**Pre-Commit Risk Flag: SAFE**

- **Scope**
  - The function is a **read-only control coverage tool** only.
  - It does not modify the database, alter upgrade lifecycle behavior, or touch UI components.
- **Behavior**
  - Read-only queries against `RiskLibrary` and `RiskControlMapping` (plus in-memory fallback to `linked_control_ids` when needed).
  - No side effects; it only returns a structured coverage report.
- **Invocation**
  - Runs only when explicitly called (e.g., via a function invocation).
  - Not wired into any critical path like `ReleaseController`, ChangeLog, or verification flows.

Given these constraints, implementing `verifyControlCoverage` as described is low risk.

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
  - The coverage utility does **not** read or modify `PublishedOutput` and does not interact with ChangeLog.
  - Therefore, ChangeLog behavior and tab visibility remain unchanged.

- **Artifact writers**
  - The utility does not call any artifact writers (`PublishedOutput.create`, `PublishedOutput.update`, or other mutators).
  - It operates entirely on risk/control entities (`RiskLibrary`, `RiskControlMapping`, or `linked_control_ids`).

- **Artifact classifications**
  - The function does not read or update `PublishedOutput.classification`.
  - Canonical artifact classification rules remain unchanged and enforced elsewhere.

- **Verification downloads**
  - No changes to any download-related logic or fields.
  - The coverage function does not interact with verification artifacts or file storage.

