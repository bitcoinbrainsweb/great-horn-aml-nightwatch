# NW-FIX — AdminAuditTemplates runtime error

## Error

```
ReferenceError: showScheduleDialog is not defined
```

## Root Cause

`src/pages/AdminAuditTemplates.jsx` contained an orphaned "Schedule Dialog" block (lines 169-210) that was copy-pasted from `AdminAuditPrograms.jsx`. This dialog referenced 6 undefined variables:

- `showScheduleDialog` / `setShowScheduleDialog` — no state declared
- `selectedProgram` — not declared
- `handleScheduleSubmit` — not defined
- `scheduleFormData` / `setScheduleFormData` — no state declared
- `engagements` — not queried

It also used `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` components that were not imported.

Schedule functionality belongs on `AdminAuditPrograms`, not `AdminAuditTemplates`. The entire block was dead code.

## Fix

Removed the orphaned Schedule Dialog block from `AdminAuditTemplates.jsx`. The Template Dialog (which is the actual dialog for this page) is unaffected and works correctly.

## File Changed

`src/pages/AdminAuditTemplates.jsx` — removed 42 lines of dead code (orphaned Schedule Dialog)

## Validation

- Page loads without runtime errors
- Template Dialog (create template) remains functional
- Zero linter errors
- No unrelated files changed
