# NW-UPGRADE-076A-SCHEMA-RECONCILE — Auth Entity Creation & Verification — SANITYCHECK

## Objective

Ensure the Nightwatch authentication data entities (NwAuthUser, NwAuthSession, NwAuthPasswordResetToken, NwAuthEvent) exist and match the 076A schema. Create if missing; reconcile (add missing fields, do not delete) if they exist but differ. **Schema creation and verification only** — no authentication logic or UI changes.

## Entity Existence (Pre-Implementation)

| Entity | How detected |
|--------|----------------|
| **NwAuthUser** | Not defined in repo today. NW-076A functions reference `NwAuthUser` and `NwAuthEvent`; entities are expected to be created in Base44 (dashboard or via `base44/entities/` + deploy). |
| **NwAuthSession** | Not defined in repo. Schema-only in 076A. |
| **NwAuthPasswordResetToken** | Not defined in repo. Schema-only in 076A. |
| **NwAuthEvent** | Not defined in repo. NW-076A functions reference it. |

This project did not contain a `base44/` directory or entity JSON files before this upgrade. Entity existence in the Base44 app cannot be determined from the repo alone; it is determined by whether the Base44 app has been deployed with these entity definitions (or they have been created manually in the dashboard).

## Field Match to Schema

- **Source of truth**: `docs/NW-UPGRADE-076A_ENTITY_SCHEMA.md` and the exact field list in the upgrade prompt.
- **Reconciliation rule**: Add missing fields; do not delete existing fields. Log differences in RESULT.
- **Implementation**: Add canonical entity schema files under `base44/entities/` so that:
  1. The repo contains the definitive schema for all four entities.
  2. Deployment via Base44 CLI (`base44 entities push` or `base44 deploy`) can create or update entities to match.
  3. If entities already exist in Base44 with different or extra fields, pushing adds missing fields (Base44 schema flexibility); we do not remove fields from the schema files so existing data is preserved.

## Risk Assessment

| Risk | Mitigation |
|------|-------------|
| Schema push could conflict with existing app config | This upgrade only adds `base44/` and entity JSON files. If the project is not yet wired to Base44 CLI, no push runs automatically; schema is in repo for when deploy is used. |
| Existing functionality broken | Scope is schema/entity definitions only. No changes to auth logic, login flow, or frontend. No changes to existing functions except optional read-only schema verification. |
| Data loss | Reconciliation adds fields only; we do not delete fields. Existing entity records remain valid. |

## Confirmation: Schema Only

- **No** changes to Base44 authentication system.
- **No** changes to existing login flow.
- **No** changes to any frontend pages.
- **No** changes to functions unrelated to schema (optional: one verification function that only checks entity accessibility for reporting).

## Verdict

Proceed to implementation: create `base44/` structure and four entity schema files matching NW-UPGRADE-076A_ENTITY_SCHEMA.md. Produce verification steps and RESULT file.
