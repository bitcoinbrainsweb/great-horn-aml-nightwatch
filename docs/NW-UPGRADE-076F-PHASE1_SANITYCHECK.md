# NW-UPGRADE-076F-PHASE1 — Sanity check

Migration check and CSRF backend (double-submit cookie).

## Part A — Migration check

- [ ] **Migration check runs**  
  From project root, with admin token and app config:
  ```bash
  BASE44_APP_ID=... BASE44_APP_BASE_URL=... BASE44_ACCESS_TOKEN=... npx tsx scripts/checkUserMigration.ts
  ```
  Script fetches Base44 `User.list()` and Nightwatch users via `nwAuthListUsers`, compares emails, writes `docs/NW-UPGRADE-076F-MIGRATIONCHECK_RESULT.md` with `migration_required` and `missing_users`. If `migration_required` is true, script exits with code 1.

- [ ] **Result doc present**  
  `docs/NW-UPGRADE-076F-MIGRATIONCHECK_RESULT.md` exists and states `migration_required` and `missing_users`.

## Part B — CSRF

- [ ] **CSRF token issued at login**  
  After successful POST to `nwAuthLogin`, response includes:
  - `Set-Cookie: nw_session=...` (existing)
  - `Set-Cookie: nw_csrf_token=<token>; SameSite=Strict; Secure; Path=/`  
  Cookie is not HttpOnly so the frontend can read it and send the same value in `X-CSRF-Token` header.

- [ ] **Valid CSRF allows write request**  
  For a protected state-changing endpoint (e.g. POST to a route using `nwAuthMiddleware`):
  - Send session cookie (e.g. `nw_session`) and `X-CSRF-Token` header equal to the `nw_csrf_token` cookie value.
  - Request returns success (e.g. 200), not 403.

- [ ] **Invalid CSRF returns 403**  
  For the same endpoint:
  - Omit `X-CSRF-Token` or send a wrong value → response 403 with body `{ "error": "Invalid or missing CSRF token" }`.
  - Session is not invalidated (subsequent read or valid write still works with same session).

## Notes

- NwAuthSession schema includes `csrf_token_hash`; login stores hash with the session.
- Middleware validates CSRF only for POST / PUT / PATCH / DELETE; GET (and other methods) are not checked.
- Frontend must send `X-CSRF-Token` header (value from `nw_csrf_token` cookie) on all state-changing requests to protected endpoints; otherwise they will receive 403 until that is implemented.
