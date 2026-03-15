# NW-UPGRADE-076G — Full Nightwatch Auth System Validation (Sanity Check)

Confirm Nightwatch authentication works across the entire application.

## Prerequisites

- App running (e.g. `npm run dev`) or deployed URL.
- Valid Nightwatch credentials (e.g. `NW_TEST_EMAIL`, `NW_TEST_PASSWORD`).

## Automated script

Run the full validation script:

```bash
BASE_URL=http://localhost:5173 NW_TEST_EMAIL=user@example.com NW_TEST_PASSWORD=secret npm run test:auth-full
```

Or:

```bash
npx tsx tests/fullAuthSystemValidation.ts
```

Environment:

- `BASE_URL` — App origin (default: `http://localhost:5173`).
- `NW_TEST_EMAIL` — Nightwatch user email.
- `NW_TEST_PASSWORD` — Nightwatch user password.

## Manual checklist

Use this list to confirm behavior in the browser and API.

### 1. Login flow

- [ ] **Login with Nightwatch credentials** — Use email/password on `/login`; submit.
- [ ] **Session cookie issued** — Response sets `nw_session` (and optionally `nw_csrf_token`) cookie.
- [ ] **Redirect to dashboard** — After successful login, user is redirected to dashboard (or intended landing page).

### 2. Session persistence

- [ ] **Reload browser** — Refresh the page while on a protected route.
- [ ] **Still authenticated** — User remains logged in; no redirect to `/login`.

### 3. Protected routes

- [ ] **Dashboard** — Open Dashboard; loads without unauthorized access.
- [ ] **Engagements** — Open Engagements; loads without unauthorized access.
- [ ] **Risks** — Open Risks; loads without unauthorized access.
- [ ] **Controls** — Open Controls; loads without unauthorized access.
- [ ] **No unauthorized access** — Unauthenticated access to these routes redirects to `/login` or shows auth required.

### 4. Write operations (CSRF)

- [ ] **Create engagement** — Create a new engagement; request succeeds (CSRF token accepted).
- [ ] **Create risk** — Create a risk (e.g. under an engagement); request succeeds.
- [ ] **Update risk** — Update an existing risk; request succeeds.
- [ ] **CSRF protection active** — State-changing requests without a valid `X-CSRF-Token` (or with wrong token) return 403.

### 5. Logout

- [ ] **Logout clears session** — After logout, session cookie cleared or invalidated.
- [ ] **Redirect to /login** — User is redirected to `/login` after logout.
- [ ] **Protected routes blocked** — After logout, navigating to a protected route requires login again.

### 6. Session expiry

- [ ] **Invalid session redirect** — Simulate invalid/expired session (e.g. clear cookie or use invalid token); app redirects to login or shows session expired.

## Confirmation summary

| Check                    | Status |
|--------------------------|--------|
| Login works              |        |
| Session persists         |        |
| CSRF protection active   |        |
| Protected routes enforced|        |
| Logout clears session    |        |

## Branch

`nw-upgrade-076g-full-auth-validation`
