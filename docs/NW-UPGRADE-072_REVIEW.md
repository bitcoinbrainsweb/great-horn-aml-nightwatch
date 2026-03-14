# NW-UPGRADE-072 — Comprehensive Code Audit (Review)

**Upgrade ID:** NW-UPGRADE-072  
**Risk:** MEDIUM

---

## Files to Change

| File | Change |
|---|---|
| `src/pages/AdminAudits.jsx` | Fix engagement dropdown: add display fallback + empty-state |
| `src/pages/AdminAuditPrograms.jsx` | Same engagement dropdown fix for consistency |
| `functions/verifyLatestBuild.ts` | Remove stale hardcoded metadata, make dynamic |

---

## Findings by Severity

### FIX NOW

| # | Finding | File | Fix |
|---|---|---|---|
| 1 | Engagement dropdown shows blank items when `engagement_name` is null | AdminAudits.jsx L271 | Add display fallback: `e.engagement_name \|\| e.engagement_type \|\| 'Unnamed Engagement'` |
| 2 | No empty-state when zero engagements exist | AdminAudits.jsx L269 | Add empty-state message in dropdown |
| 3 | Same dropdown issue in AdminAuditPrograms | AdminAuditPrograms.jsx | Same fix pattern |
| 4 | `changed_files_summary` frozen to NW-UPGRADE-047 | verifyLatestBuild.ts L486-490 | Replace with dynamic build label reference |
| 5 | `generateResultMarkdown` hardcodes NW-047/066 text | verifyLatestBuild.ts L1044-1058 | Remove hardcoded section, use dynamic label |
| 6 | Product version fallback hardcodes 'v0.6.0' | verifyLatestBuild.ts L932 | Change to 'unknown' |

### DEFER

| # | Finding | Reason |
|---|---|---|
| 7 | 15+ orphaned components in src/components/ | Each needs individual import validation; risk of breaking dynamic/conditional imports |
| 8 | Import path inconsistency (`@/` vs `../`) | Cosmetic only, no runtime impact |
| 9 | Help system orphaned components (PageHelpPanel, ContextHelpPanel, etc.) | Part of incomplete 069A/069B rollout — may be used in future help expansion |

### MONITOR

| # | Finding | Note |
|---|---|---|
| 10 | `engagement_name` verification warning for old records | Contract is correct; old data is incomplete. Warning is informational and accurate. |
| 11 | V1 vs V2 engagement_name format divergence | V1 auto-generates "Client - Type", V2 uses user input. Both produce the field. |

---

## Root Cause: Engagement Dropdown

The `<Select>` dropdown in AdminAudits.jsx renders `{e.engagement_name}` as the display text. For engagements created before NW-UPGRADE-068 added the `engagement_name` field to V1 create, this value is null/undefined, producing invisible SelectItems.

**Fix:** Add a computed display name fallback and an empty-state message when no engagements exist.

---

## Root Cause: Engagement Field Warning

The verification contract correctly requires `engagement_name`. Base44 may omit null/undefined fields from API responses, so older engagements created without this field would trigger the `'engagement_name' in firstRecord` check failure. The contract is correct — the data is incomplete for old records. This is informational and should remain a WARNING (not escalated to a violation or removed).

---

## Rollback

All changes are isolated. Revert individual file changes independently. No data model impact.
