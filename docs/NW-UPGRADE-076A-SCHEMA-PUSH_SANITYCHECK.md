# NW-UPGRADE-076A-SCHEMA-PUSH — Deploy Auth Entities to Base44 — SANITYCHECK

## Objective

Deploy the four Nightwatch authentication entities (NwAuthUser, NwAuthSession, NwAuthPasswordResetToken, NwAuthEvent) from the repo to the Base44 app so they exist in the running environment. **Deployment and verification only** — no auth logic, UI, or existing functionality may be modified.

## Confirmation: Entity Schema Files Exist

| File | Status |
|------|--------|
| base44/entities/NwAuthUser.json | Present |
| base44/entities/NwAuthSession.json | Present |
| base44/entities/NwAuthPasswordResetToken.json | Present |
| base44/entities/NwAuthEvent.json | Present |

All four entity JSON files exist under `base44/entities/`.

## Confirmation: Base44 Config

| Item | Expected | Actual |
|------|----------|--------|
| base44/config.jsonc exists | Yes | Yes |
| entitiesDir | ./entities | ./entities ✓ |

Config correctly points to the entities directory (relative to the config file location).

## Risk Assessment

| Risk | Level | Mitigation |
|------|--------|------------|
| Push overwrites or breaks existing app entities | Low | Entity names are prefixed (NwAuth*); no overlap with built-in User. Push creates/updates only these four. |
| CLI not installed or not linked | Medium | Requires Base44 CLI and app link (.app.jsonc or env). If push fails, RESULT will document and recommend manual creation or linking. |
| Existing functionality broken | None | No code or UI changes in this upgrade; deployment only. |

**Overall: Low risk.** Scope is limited to running the deployment command and documenting the outcome.

## Scope Limits

- **No** changes to authentication logic.
- **No** changes to any frontend pages or UI.
- **No** changes to existing application code.
- **Only**: Run `base44 entities push` (or `base44 deploy` if required) and verify/document result.

## Verdict

Proceed to deployment step: run Base44 entity push and produce RESULT file with verification.
