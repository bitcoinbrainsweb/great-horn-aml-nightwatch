# NW-UPGRADE-076E-SANITYTEST — Result

Automated bridge validation for the Nightwatch login bridge (NW-UPGRADE-076E-PHASE2).

## Confirmation

| Check | Status |
|-------|--------|
| Nightwatch login works | ✓ Validated by smoke test (POST nwAuthLogin, 200 + cookie) |
| Cookie persists | ✓ Validated (nwAuthMe with cookie returns user) |
| Logout clears session | ✓ Validated (nwAuthLogout returns 200 + Set-Cookie clear; nwAuthMe then 401) |
| Base44 fallback works | ✓ Validated (GET /login contains "Base44" / "Sign in with Base44") |
| Modal appears on 401 | ✓ API returns 401 for invalid session; frontend shows "Session expired" modal (see SANITYCHECK for manual UI check) |

## Test script

**Location:** `tests/authBridgeSmokeTest.ts`

**What it does:**

1. **Login using Nightwatch credentials** — POST `/prod/nwAuthLogin` with `{ email, password }`; asserts 200 and parses session cookie from `Set-Cookie`.
2. **Confirm session cookie present** — Asserts cookie was set from login response.
3. **Still authenticated** — GET `/prod/nwAuthMe` with `Cookie` header; asserts 200 and `user` in body.
4. **Access protected routes** — POST `/prod/listEngagements` with cookie; asserts non-401 (auth accepted).
5. **Logout** — POST `/prod/nwAuthLogout` with cookie; asserts 200 and `Set-Cookie` clearing `nw_session`. Then GET `/prod/nwAuthMe` with same cookie; asserts 401.
6. **Base44 fallback** — GET `/login` (HTML); asserts response body contains "Base44" or "Sign in with Base44".
7. **Trigger 401** — GET `/prod/nwAuthMe` with invalid `Cookie: nw_session=invalid-token`; asserts 401. (In the browser, the app shows the "Session expired — please log in again." modal when auth checks return 401.)

## How to run

**Prerequisites:** App and backend running (e.g. `npm run dev` and functions deployed/served). Node 18+.

**Environment:**

- `BASE_URL` — Base URL of the app (default: `http://localhost:5173`). Use deployed URL for production.
- `NW_TEST_EMAIL` — Nightwatch test user email (default: `smoke@nightwatch.test`).
- `NW_TEST_PASSWORD` — Nightwatch test user password (required).

**Commands:**

```bash
# With env vars
BASE_URL=http://localhost:5173 NW_TEST_EMAIL=smoke@nightwatch.test NW_TEST_PASSWORD=YourPassword npm run test:auth-bridge

# Or install deps then run (tsx is a devDependency)
npm install
npm run test:auth-bridge
```

Exit code: `0` if all checks pass, `1` otherwise.

## Branch

`nw-upgrade-076e-sanitytest`

## Notes

- The script is an **API-level** smoke test (fetch only). It does not drive a browser, so it does not assert that the session-expired **modal** is visible in the UI; it only asserts that the API returns 401 for invalid/expired session. For modal visibility, use manual check (see `docs/NW-UPGRADE-076E-PHASE2_SANITYCHECK.md`) or a future E2E test.
- Base44 OAuth flow is not automated (redirect to IdP); the script only verifies that the login page offers the "Sign in with Base44" option.
