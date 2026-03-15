# NW-UPGRADE-076F — Sanity check

Pre- and post-sunset sanity checks for Base44 auth removal and CSRF protection (review phase only).

## Pre-implementation sanity check

Before implementing 076F, confirm current state:

- [ ] **Nightwatch login** — Unauthenticated user can sign in via `/login` with email/password; session cookie set; user reaches app.
- [ ] **Base44 fallback** — "Sign in with Base44" on `/login` triggers Base44 OAuth; return to app with Base44 token works.
- [ ] **Auth order** — AuthContext checks Nightwatch first (`getCurrentUser()`), then Base44 (`appParams.token` + `checkUserAuth()`).
- [ ] **Layout** — When `authSource === 'nightwatch'`, user from context; when `authSource === 'base44'`, domain allowlist + UserInvitation + `base44.auth.me()` apply.
- [ ] **Logout** — Nightwatch logout clears cookie and redirects to `/login`; Base44 logout uses `base44.auth.logout()`.
- [ ] **Migration check** — Run user-migration verification (NwAuthUser vs Base44 users); document result (migration required or not).

## Post-sunset smoke test (definition)

After Base44 removal and CSRF implementation, run these automated checks:

1. **Nightwatch login**
   - POST `/prod/nwAuthLogin` with valid credentials → 200, `Set-Cookie: nw_session`, optional CSRF token in body/header/cookie.
   - Frontend: submit login form → redirect to app, session persists on reload.

2. **Protected routes**
   - With session cookie (and CSRF token when required), GET `/prod/nwAuthMe` → 200, user object.
   - With session cookie, POST a protected read/list endpoint (e.g. `/prod/listEngagements`) → non-401.

3. **Write operations**
   - With session + valid CSRF token, POST a state-changing endpoint (e.g. create/update) → success (200/201).
   - With session but invalid/missing CSRF token, POST state-changing endpoint → 403 (or defined failure behavior).

4. **Logout**
   - POST `/prod/nwAuthLogout` with cookie → 200, cookie cleared; GET `/prod/nwAuthMe` → 401.

5. **Session expiry modal**
   - When an auth or protected call returns 401, frontend shows "Session expired — please log in again." and redirects to `/login`.

These can be implemented as an extended `tests/authBridgeSmokeTest.ts` (or equivalent) with CSRF steps added.

## Post-CSRF sanity check (manual)

- [ ] Login response includes CSRF token (per design: cookie or header).
- [ ] State-changing requests send CSRF token; read-only requests per design (e.g. exempt or required).
- [ ] Middleware rejects invalid/missing CSRF for protected state-changing routes with consistent failure behavior.
- [ ] Rollback plan documented and tested (see REVIEW).
