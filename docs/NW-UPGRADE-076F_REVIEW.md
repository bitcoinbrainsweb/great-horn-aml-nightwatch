# NW-UPGRADE-076F — Base44 Auth Sunset + CSRF Protection (REVIEW)

**Status:** REVIEW ONLY — no implementation in this artifact.  
**Branch:** `nw-upgrade-076f-auth-sunset-review`

---

## 1. Base44 auth removal plan

### 1.1 Base44 login button

| Location | Description |
|----------|-------------|
| **`src/pages/Login.jsx`** | Single Base44 entry: "Sign in with Base44" button. `handleBase44Login()` calls `navigateToLogin()` (AuthContext). |

**Removal:** Remove the button and the `handleBase44Login` handler; optionally remove the "or" divider above it. Login page becomes Nightwatch-only.

---

### 1.2 Base44 fallback logic in AuthContext

| Location | Description |
|----------|-------------|
| **`src/lib/AuthContext.jsx`** | After Nightwatch `getCurrentUser()` returns no user, `if (appParams.token)` triggers `checkUserAuth()` which calls `base44.auth.me()` and sets `authSource: 'base44'`. |
| **`src/lib/AuthContext.jsx`** | `navigateToLogin()` calls `base44.auth.redirectToLogin(window.location.href)` — used by Login page for Base44 and by any code that redirects to IdP. |
| **`src/lib/AuthContext.jsx`** | `logout()`: when `authSource === 'base44'`, calls `base44.auth.logout()` (with or without redirect). |

**Removal:**

- Remove `checkUserAuth()` and all calls to it.
- Remove the branch that checks `appParams.token` and sets `authSource: 'base44'`; after Nightwatch check fails, set `auth_required` only.
- Remove or repurpose `navigateToLogin()` (e.g. redirect to `/login` only, no Base44 redirect).
- In `logout()`, remove the Base44 branch; keep only Nightwatch logout and redirect to `/login`.

**Dependencies:** `createAxiosClient` and `appClient.get(public-settings)` currently use `token: appParams.token`. After sunset, public settings may need to be fetched without token or with a different contract (document in implementation phase).

---

### 1.3 Base44 auth flow usage

| Area | Usage |
|------|--------|
| **Auth bootstrap** | `checkAppState()`: (1) fetch public settings with `appParams.token`, (2) Nightwatch `getCurrentUser()`, (3) if no NW user and `appParams.token`, `checkUserAuth()` (Base44). |
| **Login entry** | `Login.jsx`: Base44 button → `navigateToLogin()` → `base44.auth.redirectToLogin()`. |
| **Logout** | `AuthContext.logout()`: Base44 branch calls `base44.auth.logout()`. |
| **Layout loadUser** | When `authSource === 'base44'`: `base44.auth.isAuthenticated()`, `base44.auth.me()`, domain allowlist, `UserInvitation.filter/update`, `base44.auth.updateMe()`, `base44.auth.me()` again. |

**Removal:** Remove Base44 branch in Layout `loadUser()` entirely. Layout should rely on AuthContext user for all authenticated users (Nightwatch-only post-sunset). Remove or refactor domain allowlist and UserInvitation checks if they are Base44-only (see 1.4).

---

### 1.4 Base44-only user paths

| Path | Description | Post-sunset |
|------|-------------|------------|
| **Domain allowlist** | `Layout.jsx`: `allowed = ['greathornaml.com', 'libertylabs.ca', 'bitcoinbrains.com', 'nightwatch.test']`; if Base44 user's domain not in list → access denied. | Nightwatch users are already in NwAuthUser; domain check is redundant for NW. Remove or move to backend (e.g. NwAuthUser or config) if still required. |
| **UserInvitation** | `Layout.jsx`: For Base44, `base44.entities.UserInvitation.filter({ email: me.email })`; must have Pending/Active invite; activate if Pending; role from invite or `updateMe()`. | Post-sunset, access control is by NwAuthUser (and role). Decide whether to keep UserInvitation for “invite to workspace” semantics with Nightwatch users (separate migration) or remove. |
| **base44.auth.updateMe()** | `Layout.jsx`: Auto-assign role on first Base44 login from invite. | No longer used; role lives in NwAuthUser (Admin Users / nwAuthUpdateUser). |
| **base44.auth.me()** | Used in many pages for “current user” (Dashboard, Engagements, Admin, ControlTests, FeedbackModal, etc.). | Replace with `useAuth().user` (or equivalent) so all pages use context user (Nightwatch). |
| **base44.entities.User** | `User.list()`, `User.update()`, `User.delete()` in AdminUsers, Engagements, ClientDetail, etc. | Post-sunset: either use NwAuthUser + nwAuthListUsers/nwAuthUpdateUser and frontend adapts to “Nightwatch users only,” or keep Base44 User entity for platform-only use (out of scope for this review). |
| **base44.entities.UserInvitation** | AdminInvitations, Layout (invite check). | See UserInvitation above; migration of “invitations” to Nightwatch model or removal. |
| **base44.auth.resetPasswordRequest** | `AdminUsers.jsx`: “Send reset” for a user. | Base44-only; post-sunset replace with Nightwatch password reset flow (e.g. backend endpoint + email) or remove feature until implemented. |
| **Notifications** | `Layout.jsx`: `base44.entities.Notification.filter({ user_email, status: 'unread' })`, `Notification.update()`. | If Notifications are Base44 entity, either keep read/write via service role from backend for Nightwatch users or migrate notification model. |

**Summary:** All “current user” reads should use AuthContext (Nightwatch user). Base44-specific entities (User, UserInvitation, Notification) and actions (resetPasswordRequest, updateMe) must be migrated, replaced, or removed before full sunset.

---

## 2. User migration check (verification step)

**Goal:** Detect if any active users exist in Base44 auth but do **not** exist in NwAuthUser. If such users exist → mark **migration required** before Base44 removal.

### 2.1 Data sources

- **Base44 users:** From platform/app: e.g. `base44.entities.User.list()` (app-level users) and/or any platform auth user list the SDK or backend can expose. If the app only has “User” entity populated via Base44 login/invites, that list is the set of Base44 users who have used the app.
- **NwAuthUser:** Backend entity; list via existing `nwAuthListUsers` (or direct `NwAuthUser.list()` in a service-role script).

### 2.2 Verification step (to be implemented)

1. **Obtain Base44 user list**  
   - Option A: Backend function (service role) that calls Base44 User entity list (if available in backend context).  
   - Option B: One-time script or admin tool that uses an existing Base44 token to call `User.list()` and export emails.  
   - Option C: Platform API or export from Base44 dashboard if available.  
   Define “active” (e.g. last_login_at in last N days, or status not disabled).

2. **Obtain NwAuthUser list**  
   - Backend: `NwAuthUser.list()` (or invoke `nwAuthListUsers`) and collect emails (or ids).

3. **Compare**  
   - Set of Base44 user emails (or ids) vs set of NwAuthUser emails (or ids).  
   - **Migration required** = there exists at least one Base44 (active) user whose email (or id) is not in NwAuthUser.

4. **Output**  
   - Report: “Migration required: yes | no.”  
   - If yes: list of Base44 emails (or ids) not in NwAuthUser (and optionally list of NwAuthUser-only for reference).  
   - Store or display in a way that blocks or gates the 076F implementation until migration is done (e.g. admin dashboard, CI check, or pre-deployment checklist).

### 2.3 Migration required actions

If migration is required:

- Create NwAuthUser records (and set passwords or send set-password links) for each Base44-only user, **or**
- Mark those users as “no longer active” and communicate, **or**
- Provide a self-service “claim account” / “set Nightwatch password” flow before sunset.

Do not remove Base44 auth until migration status is “not required” or explicitly accepted by product/security.

---

## 3. CSRF protection design (for Nightwatch sessions)

**Requirements (from scope):** CSRF token issued at login; stored in cookie or response header; all state-changing requests require CSRF token; middleware validates token; document generation, storage, validation flow, failure behavior.

### 3.1 Token generation

- **When:** On successful Nightwatch login (in `nwAuthLogin` or immediately after session creation).
- **How:** Cryptographically secure random value (e.g. 32 bytes hex or base64). Optionally bind to session: store hash of token in `NwAuthSession` (e.g. `csrf_token_hash`) or in a separate short-lived store keyed by session id.
- **Uniqueness:** One CSRF token per session; re-issue on login (and optionally on privilege change if needed later).

### 3.2 Token storage

- **Option A (cookie):** Set a second cookie, e.g. `nw_csrf_token=<value>; Path=/; SameSite=Strict; Secure` (not HttpOnly so the frontend can read and send it in a header).  
- **Option B (response header + cookie):** Return token in login response body or header (e.g. `X-CSRF-Token`) and also set a cookie so that same-origin pages can read it from cookie for sending in header.  
- **Option C (response body only):** Return token in login JSON; frontend stores in memory (e.g. React state/context) and sends in header on every state-changing request; no cookie.  

**Recommendation:** Option A or B so that the token is available after full page reload (cookie or cookie + header). If cookie is not HttpOnly, frontend reads `nw_csrf_token` and sends it in header (e.g. `X-CSRF-Token` or `X-CSRF-Token: <value>`) on POST/PUT/PATCH/DELETE (and any other state-changing method).

### 3.3 Validation flow

- **Where:** In the same middleware that validates the session (e.g. `auth-nw-middleware.ts`) or in a dedicated CSRF middleware that runs after session is established.
- **When:** For **state-changing** requests: POST, PUT, PATCH, DELETE (and any custom method that mutates data). GET/HEAD/read-only requests typically exempt.
- **How:**  
  1. Resolve session (cookie or Bearer) and get session id / user.  
  2. For state-changing requests: read CSRF token from request header (e.g. `X-CSRF-Token`) or from body/query if design uses that.  
  3. Retrieve expected token for that session (from session record or from cookie `nw_csrf_token`).  
  4. Compare using constant-time comparison. If missing or mismatch → failure (see 3.4).  
  5. If valid, attach user and proceed.

- **Double-submit cookie pattern:** If token is in a cookie, client sends the same value in a header; server compares header value to cookie value (both must be present and equal). No server-side storage of token needed beyond cookie.

### 3.4 Failure behavior

- **Response:** 403 Forbidden with a clear body (e.g. `{ "error": "Invalid or missing CSRF token" }`).
- **Logging:** Log failure (session id if available, no token value) for security monitoring.
- **Session:** Do not invalidate the session on CSRF failure (to avoid DoS that logs users out). Optionally rate-limit or alert on repeated CSRF failures per session.
- **Frontend:** On 403 with this error, show a message (e.g. “Request rejected; please refresh and try again”) and optionally refresh the CSRF token (e.g. call a “refresh CSRF” endpoint that re-issues token for current session) or redirect to login only if session is also invalid.

### 3.5 Summary table

| Aspect | Design |
|--------|--------|
| Generation | Secure random token at login; optionally store hash in session. |
| Storage | Cookie `nw_csrf_token` (not HttpOnly) and/or response header; frontend sends value in `X-CSRF-Token` header. |
| Validation | Middleware for POST/PUT/PATCH/DELETE; compare header (or body) token to cookie/session token; constant-time. |
| Failure | 403, log, do not revoke session; frontend shows message and/or refreshes token. |

---

## 4. Post-sunset smoke test (definition)

Automated smoke tests to run **after** Base44 removal (and after CSRF is implemented):

| # | Test | Pass criteria |
|---|------|----------------|
| 1 | **Nightwatch login** | POST `/prod/nwAuthLogin` → 200, session cookie set; optional CSRF token in response; frontend login form → app load and session persists on reload. |
| 2 | **Protected routes** | With session cookie (and CSRF when required): GET `/prod/nwAuthMe` → 200; POST read-only protected endpoint → non-401. |
| 3 | **Write operations** | With session + valid CSRF token: POST/PUT state-changing endpoint → success. With session but invalid/missing CSRF: state-changing request → 403. |
| 4 | **Logout** | POST `/prod/nwAuthLogout` with cookie → 200, cookie cleared; subsequent nwAuthMe → 401. |
| 5 | **Session expiry modal** | When a protected or auth endpoint returns 401, UI shows “Session expired — please log in again.” and user is redirected to `/login`. |

Implementation can extend `tests/authBridgeSmokeTest.ts` (add CSRF header for state-changing calls and assert 403 when token missing/invalid). See `docs/NW-UPGRADE-076F_SANITYCHECK.md` for checklist.

---

## 5. Rollback plan (if auth breaks)

1. **Feature flag / config**  
   - Before removal, introduce a flag (e.g. `ENABLE_BASE44_FALLBACK` or env) that re-enables Base44 login and AuthContext fallback. Default off after sunset, on during rollback.

2. **Code rollback**  
   - Keep Base44 removal in a single branch/PR so that reverting the PR (or re-adding the Base44 button and `checkUserAuth()` path) restores the previous behavior. Document the exact commits/files for “Base44 removal” and “CSRF” so they can be reverted independently if needed.

3. **Immediate rollback steps**  
   - Re-enable feature flag or deploy previous release that still has Base44 fallback.  
   - Restore Login page “Sign in with Base44” and AuthContext logic that checks `appParams.token` and calls `base44.auth.me()`.  
   - Communicate to users to use Base44 login if Nightwatch login is broken.

4. **Data**  
   - No destructive migration of Base44 User/NwAuthUser in 076F scope; rollback does not require DB restore for auth. If CSRF table/store was added, it can be ignored on rollback.

5. **Verification**  
   - After rollback, run existing auth bridge smoke test (076E) with Base44 path re-enabled to confirm Base44 login and protected routes work again.

---

## 6. Document index

| Document | Purpose |
|----------|---------|
| **docs/NW-UPGRADE-076F_SANITYCHECK.md** | Pre- and post-sunset sanity checks; post-sunset smoke test definition. |
| **docs/NW-UPGRADE-076F_REVIEW.md** | This document: removal plan, migration check, CSRF design, smoke test definition, rollback plan. |

**Next step:** After review approval and migration check shows “migration not required” (or migration completed), implement in a separate change set. Do not implement as part of this REVIEW artifact.
