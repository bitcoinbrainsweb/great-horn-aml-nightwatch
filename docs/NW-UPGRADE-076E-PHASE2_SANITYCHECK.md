# NW-UPGRADE-076E-PHASE2 — Sanity check

Frontend Nightwatch login bridge: Nightwatch login path + Base44 fallback.

## Scope

- Nightwatch login (POST `/prod/nwAuthLogin`, cookie session)
- Frontend detects Nightwatch session, then falls back to Base44
- Login page: default Nightwatch, Base44 as fallback
- Session expiry modal on 401

## Sanity checks

Confirm the following.

### 1. Nightwatch login works

- [ ] Open app unauthenticated → redirect to `/login`.
- [ ] Enter valid Nightwatch email/password → submit.
- [ ] Response is success; user is redirected into the app (e.g. Dashboard).
- [ ] No console errors; user name/role shown in layout.

### 2. Cookie session persists across reload

- [ ] After logging in via Nightwatch, note current page.
- [ ] Refresh the page (F5 or reload).
- [ ] User remains authenticated; no redirect to login.
- [ ] Layout still shows the same user.

### 3. Protected routes accessible

- [ ] With Nightwatch session, open several protected routes (e.g. Dashboard, Engagements, Admin).
- [ ] All load without 401 and without redirect to login.
- [ ] Data loads as expected (lists, detail pages).

### 4. Logout clears session

- [ ] While logged in via Nightwatch, click Sign out (sidebar or access-denied screen).
- [ ] Redirect to `/login`.
- [ ] Reload or navigate to `/Dashboard` → redirect back to `/login`.
- [ ] No Nightwatch session cookie (or cookie cleared) after logout.

### 5. Base44 login still works

- [ ] From `/login`, click “Sign in with Base44”.
- [ ] Complete Base44 OAuth flow.
- [ ] Return to app authenticated via Base44.
- [ ] Protected routes work; logout (Base44) behaves as before.

### 6. Session expired modal

- [ ] If any auth check or API returns 401, modal appears: “Session expired — please log in again.”
- [ ] Dismissing (OK) sends user to `/login`.

## Notes

- Backend: `nwAuthMe` (GET/POST) returns current user from cookie or Bearer; middleware and `nwAuthLogout` accept cookie.
- Frontend: `auth/nightwatchAuth.js` (`login`, `logout`, `getCurrentUser`); AuthContext checks Nightwatch first, then Base44; `/login` page with Nightwatch form + Base44 fallback.
