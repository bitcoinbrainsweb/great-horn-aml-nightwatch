# NW-UPGRADE-076F-PHASE1 — Result

Migration check and CSRF backend implementation.

## Confirmation

| Item | Status |
|------|--------|
| **migration_required status** | Documented in `docs/NW-UPGRADE-076F-MIGRATIONCHECK_RESULT.md`. Run `scripts/checkUserMigration.ts` with BASE44_APP_ID, BASE44_APP_BASE_URL, BASE44_ACCESS_TOKEN (admin). If `migration_required: true`, stop and migrate missing users before Base44 removal. |
| **CSRF working** | Yes. Token issued at login (cookie `nw_csrf_token`); hash stored in NwAuthSession; middleware validates double-submit (X-CSRF-Token header vs cookie) for POST/PUT/PATCH/DELETE; 403 on invalid/missing; session not invalidated. |

## Part A — Migration check

- **Script:** `scripts/checkUserMigration.ts`
  - Fetches Base44 users via `client.entities.User.list()`.
  - Fetches Nightwatch users via `client.functions.invoke('nwAuthListUsers', {})`.
  - Compares email sets; computes `missing_users` (in Base44 but not in NwAuthUser).
  - Writes `docs/NW-UPGRADE-076F-MIGRATIONCHECK_RESULT.md` with `migration_required` and `missing_users`.
  - Exits with code 1 if `migration_required` is true.

- **Result doc:** `docs/NW-UPGRADE-076F-MIGRATIONCHECK_RESULT.md` (template committed; overwritten when script runs).

## Part B — CSRF backend

- **NwAuthSession:** Added optional `csrf_token_hash` in `base44/entities/NwAuthSession.json`. Ensure the NwAuthSession entity in the running environment includes this field (schema push or dashboard) so login can store the hash.

- **nwAuthLogin** (`functions/nwAuthLogin.ts`):
  - Generates CSRF token (same shape as session token).
  - Hashes with existing `hashSessionToken`, stores in session as `csrf_token_hash`.
  - Sets cookie: `nw_csrf_token=<token>; SameSite=Strict; Secure; Path=/; Max-Age=...`.

- **Middleware** (`functions/auth-nw-middleware.ts`):
  - `validateCsrf(req)`: for POST/PUT/PATCH/DELETE, reads `X-CSRF-Token` header and `nw_csrf_token` cookie; constant-time compare; returns 403 Response if missing or mismatch.
  - `nwAuthMiddleware` calls `validateCsrf(req)` first; on 403 returns error without invalidating session.

- **Failure:** 403 JSON `{ "error": "Invalid or missing CSRF token" }`; session left valid.

## Do not modify (unchanged)

- Base44 login UI
- AuthContext
- Layout logic

## Frontend follow-up

Protected state-changing requests (POST/PUT/PATCH/DELETE) must send header `X-CSRF-Token` with value equal to the `nw_csrf_token` cookie; otherwise middleware returns 403. Adding this to the frontend (e.g. in `nightwatchAuth` or a fetch wrapper) is out of scope for this phase but required for writes to succeed.

## Branch

`nw-upgrade-076f-phase1-csrf`
