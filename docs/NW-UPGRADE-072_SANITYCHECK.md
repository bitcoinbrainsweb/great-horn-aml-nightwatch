# NW-UPGRADE-072 — Comprehensive Code Audit (Sanity Check)

**Upgrade ID:** NW-UPGRADE-072  
**Risk:** MEDIUM — multiple targeted fixes across UI and verification logic

---

## Major Risk Areas

### 1. Engagement Dropdown (AdminAudits — New Audit Modal)
- **Root cause:** The dropdown renders `e.engagement_name` which may be null/empty for engagements created before NW-UPGRADE-068's V1 fix
- **Impact:** Blank/invisible dropdown items make it impossible to select an engagement
- **No empty-state message** when zero engagements exist — just a blank dropdown

### 2. Engagement Field Mismatch Warning
- **Root cause:** Verification checks `'engagement_name' in firstRecord` — if Base44 omits null fields from API responses, engagements created without the field will trigger the warning
- **Assessment:** This is a REAL entity gap for pre-068 records, not a stale contract. The contract is correct; old data is incomplete.

### 3. Stale Verification Metadata
- `changed_files_summary` hardcodes 4 NW-UPGRADE-047 entries (frozen since that release)
- `generateResultMarkdown` hardcodes NW-UPGRADE-047/066 text in every report regardless of build
- `product_version` fallback hardcodes `'v0.6.0'`

### 4. Dead Components (15+)
- 15+ orphaned components in src/components/ never imported anywhere
- Includes: CoverageBadge, RiskCoverageDetail, LiveReportPanel, multiple evidence/admin/help components
- Help system components PageHelpPanel, NextStepPanel, ContextHelpPanel are all orphaned (only NextStepGuidance is used)

### 5. Inconsistent Import Paths
- NextStepGuidance imported via `@/` alias (admin pages) vs `../` relative (workflow pages)
- Cosmetic only — not a runtime issue

---

## Audit Boundaries

| Area | Action |
|---|---|
| Engagement dropdown | Fix now |
| engagement_name display resilience | Fix now |
| Stale verification metadata | Fix now |
| Dead components | Defer (needs careful per-component validation) |
| Import path inconsistency | Defer (cosmetic) |
| Route integrity | Already fixed in 068C — verified clean |
| Help system integration | Healthy — NextStepGuidance is the active system |

---

## Risk Level

**MEDIUM** — targeted fixes to UI display logic and verification metadata. No data model changes. REVIEW required.
