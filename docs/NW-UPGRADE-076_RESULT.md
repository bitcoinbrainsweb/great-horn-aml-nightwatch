# NW-UPGRADE-076 — Auth System Replacement — RESULT

## Upgrade ID

**NW-UPGRADE-076** — Auth System Replacement Review. This step is **review/design only**; **no code was implemented**.

---

## 1. Recommended Implementation Path

- **Phased, human-led with Cursor assistance.** Do not treat this as Cursor-only implementation; security-critical auth should be human-reviewed.
- **Phase 1a**: Backend auth boundary — session-based login (email/password, bcrypt), GET me, POST logout, session middleware, User store (with password_hash, role, status), AuthEvent (append-only), smoke user creation path.
- **Phase 1b**: Frontend — AuthContext and Layout use Nightwatch auth API and session (cookie); remove Base44 auth and invitation gate; keep role-based UI.
- **Phase 1c**: Backend functions — resolve user from request (session) instead of Base44; same role checks.
- **Phase 1d**: Admin user management — create/edit/disable users, trigger password reset; view auth activity.
- **Phase 1e**: Password reset flow (admin-triggered; optional user-facing “forgot password” in Phase 2).
- **Phase 1f**: Google OAuth — authorization code flow; email match to existing User only; no auto-provisioning; set oauth_provider/oauth_provider_id after match.
- **Phase 2**: MFA, org_id, advanced OAuth, full Base44 entity migration (if applicable).

---

## 2. Affected Files / Surfaces

- **New**: Backend auth module (login, logout, me, password reset, session middleware, AuthEvent writer); Session, PasswordResetToken, AuthEvent (and extended User) persistence; Nightwatch login page or route.
- **Frontend**: `src/lib/AuthContext.jsx`, `src/components/Layout.jsx`, `src/App.jsx`, `src/api/base44Client.js` (or new auth client), `src/lib/app-params.js`; all pages/components that call `base44.auth.me()` or use `user` for role (AdminUsers, AdminInvitations, Clients, Engagements, etc. — see REVIEW).
- **Backend**: All Deno functions that use `createClientFromRequest` and `base44.auth.me()` for identity/role (40+ files); new middleware to attach `req.user` from session.
- **Config**: Login URL / app_base_url pointing to Nightwatch auth.

---

## 3. Migration Plan

1. Deploy new auth stack (User, Session, PasswordResetToken, AuthEvent) and auth API alongside existing Base44 auth; no traffic switch.
2. Migrate users: export from Base44 User (or UserInvitation + known roles); create Nightwatch User per email with same full_name, role; set status active; set password to “must change” or one-time reset link (no plaintext password migration).
3. Create smoke user: e.g. tester@nightwatch.internal, role viewer, status active, deterministic password (bcrypt) set by admin; no email delivery.
4. Cutover: feature flag or deploy to use Nightwatch login and session; frontend uses Nightwatch /auth/me and session cookie; backend uses session middleware; Base44 auth path disabled.
5. Users set password (or use reset) on first login; Google users use same email so OAuth match works.
6. Retain Base44 User/UserInvitation read-only until Nightwatch auth is stable; then deprecate.

---

## 4. Rollback Plan

- **Feature flag** (e.g. `USE_NIGHTWATCH_AUTH`): when false, frontend and backend use Base44 auth and existing User/UserInvitation.
- **If cutover fails**: set flag to false, redeploy; users log in again via Base44; new auth tables remain for future retry.
- Do not delete Base44 auth data until new system is proven in production.

---

## 5. Verification Plan

- Unit/integration tests: login (success/failure), logout, GET me with valid/expired/invalid session, role checks on protected endpoints, lockout after N failures, password reset (request + confirm), OAuth email-match (existing user vs. unknown email).
- Security review: no plaintext password/token storage; session in cookie or header only; rate limits on login/reset; auth log append-only; authorization from server session only.
- Smoke: create tester@nightwatch.internal, log in with deterministic password, run existing smoke flows.
- Regression: all role-gated pages and backend functions behave as before with new session source.

---

## 6. Cursor-Only Implementation?

**Recommendation: No.** Use Cursor for design, review docs, and targeted code edits (e.g. swapping base44.auth.me() for new getCurrentUser(req), drafting migration scripts). Implementation of login, session issuance, password hashing, token hashing, rate limiting, and OAuth should be human-led with human security review.

---

## 7. Explicit Confirmations

### Auth boundary recommendation

- **Single server-side boundary**: Nightwatch backend owns User, Session, and auth events. Every protected request is validated by session middleware; `req.user` is the only source of identity and role. Frontend does not send or trust role; it only displays what the backend returns for the current user.

### Session handling approach

- **Server-side sessions**: On login, create a Session row (token_hash, user_id, expires_at, ip_address, user_agent). Return session identifier in an **httpOnly cookie** (or secure header). Validate each request by cookie → hash → Session lookup → User; never store or transmit plaintext token. Logout revokes session (revoked_at) and clears cookie.

### Password hashing approach

- **bcrypt only**: Store only User.password_hash; cost ≥10. Never store or log plaintext. Login and password-set flows use bcrypt compare and bcrypt hash respectively.

### Auth event integrity approach

- **Append-only AuthEvent table**: Insert-only for login, logout, failed_login, password_reset, role_changed, user_created, user_disabled, oauth_linked. No update/delete API. Used for audit and for lockout/failed_login_count.

### Google OAuth email-match-only logic

- **No auto-provisioning**: After OAuth code exchange, extract email from IdP; look up User by email. If no User → reject login. If User exists and is active → create Session and optionally set oauth_provider and oauth_provider_id; do not create new users from OAuth.

### Smoke-user creation path after replacement

- **Deterministic admin-created user**: Admin (or bootstrap script) creates User with email e.g. tester@nightwatch.internal, role viewer, status active, password_hash from bcrypt of admin-chosen deterministic password. No invitation; no email delivery. Smoke tests log in with that email and password; no dependency on Base44 or email service.

---

## 8. Before Finishing — Checklist

| Item | Status |
|------|--------|
| Upgrade ID consistency (NW-UPGRADE-076) | Yes |
| This step did not implement any code | Yes |
| Auth boundary recommendation explicit | Yes (§7) |
| Session handling approach explicit | Yes (§7) |
| Password hashing approach explicit | Yes (§7) |
| Auth event integrity approach explicit | Yes (§7) |
| Google OAuth email-match-only logic explicit | Yes (§7) |
| Smoke-user creation path after replacement explicit | Yes (§7) |

---

**End of NW-UPGRADE-076 RESULT.**
