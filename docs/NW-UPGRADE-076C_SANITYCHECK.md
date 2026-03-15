# NW-UPGRADE-076C — Nightwatch Auth Middleware — SANITYCHECK

## Objective

Add authentication middleware that validates Nightwatch sessions and attaches the authenticated user to requests. **Does not replace Base44 authentication.** Enables server-side session validation for Nightwatch routes only.

## Verification

| Requirement | Status |
|-------------|--------|
| nwAuthValidateSession exists | Yes — functions/nwAuthValidateSession.ts |
| NwAuthSession entity exists | Yes — base44/entities/NwAuthSession.json |
| NwAuthUser entity exists | Yes — base44/entities/NwAuthUser.json |

All three are present. Validation logic can be shared between the existing endpoint and the new middleware.

## Risk Assessment

| Risk | Level | Mitigation |
|------|--------|------------|
| Middleware used on wrong routes | Low | Middleware is opt-in; no existing routes modified. |
| Token handling bugs | Low | Reuse same validation as nwAuthValidateSession. |
| Base44 auth affected | None | No changes to Base44 auth or UI. |

**Overall: Low.**

## Scope Limits

- **No** modification to Base44 authentication.
- **No** UI login changes.
- **No** changes to existing routes.
- **Only**: New middleware (and optional helper/event); routes that opt in can use it.

## Verdict

Proceed: create auth-nw-middleware.ts (read Bearer token, validate session, attach user or return 401), optional requireAuth helper, optional session_invalid AuthEvent.
