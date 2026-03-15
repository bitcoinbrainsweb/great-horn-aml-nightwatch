# NW-UPGRADE-076D-PHASE2 — Apply Nightwatch Auth Middleware (Operator Read Routes) — SANITYCHECK

## Objective

Apply Nightwatch auth middleware to real operator workflow read routes: listEngagements, listRisks, listControls. These are read-only endpoints used during normal operator workflows.

## Phase 1 Validation (Prerequisite)

Before implementing Phase 2, confirm the following. **Abort if validation fails.**

### Smoke test user can:

1. **Authenticate via nwAuthLogin**
   - Create or use an NwAuthUser (e.g. tester@nightwatch.internal or smoke user) with status active and a known password (password_hash set via admin).
   - POST to nwAuthLogin with `{ email, password }`.
   - Expect 200 with `{ session_token, expires_at, user }`.

2. **Receive session token**
   - Response must include `session_token` (opaque string) and `expires_at`.

3. **Call Phase 1 routes successfully**
   - With `Authorization: Bearer <session_token>`, call:
     - verifyRiskControlIntegrity
     - verifyInfrastructureLayer
     - auditReportPublicationArchitecture
   - Expect 200 (and for admin/super_admin user, valid JSON body). If user role is insufficient, expect 403.

4. **Receive 401 on invalid token**
   - Call any Phase 1 route with `Authorization: Bearer invalid-token` or with no Authorization header.
   - Expect 401 with JSON error.

### How to validate

- Manually: use curl or Postman to nwAuthLogin, then use the returned session_token in Authorization header for Phase 1 routes.
- Or run an automated smoke script that performs the four checks above.
- If any check fails, do not proceed with Phase 2 implementation until Phase 1 is fixed.

## Scope

- **Routes to protect:** listEngagements, listRisks, listControls (read-only operator workflows).
- **Implementation:** Backend currently uses Base44 SDK from frontend for Engagement.list(), RiskLibrary.list(), ControlLibrary.list(). Phase 2 will add **new** Deno functions listEngagements, listRisks, listControls that perform the same list operations server-side and apply nwAuthMiddleware + requireAuth. These can be used when the frontend is switched to call them (or for API consumers).
- **Do not modify:** login UI, Base44 auth, write routes.

## Risk Assessment

- **Low.** Read-only routes only; no write endpoints modified. Base44 auth unchanged. New or wrapped list endpoints only.

## Verdict

Proceed to implement listEngagements, listRisks, listControls with middleware. Ensure SANITYCHECK validation (smoke test user + Phase 1 + 401) is documented and can be run before/after.
