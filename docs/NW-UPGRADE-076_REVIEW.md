# NW-UPGRADE-076 — Auth System Replacement — REVIEW

## 1. Current Auth Boundary Map

### 1.1 Token and Login Flow

| Layer | Mechanism |
|-------|-----------|
| Token source | `appParams.token` from URL (`access_token`) or storage (`base44_access_token`). |
| Login entry | Base44-hosted login (redirect via `base44.auth.redirectToLogin(fromUrl)`). |
| Post-login | Base44 redirects back with token; app reads token, SDK attaches to requests. |
| Who validates token | Base44 backend (not Nightwatch code). |

### 1.2 Frontend Surfaces That Depend on Auth

| File | Usage |
|------|--------|
| `src/lib/AuthContext.jsx` | `checkAppState` → app public settings; `checkUserAuth` → `base44.auth.me()`; `logout` → `base44.auth.logout()`; `navigateToLogin` → `base44.auth.redirectToLogin()`. Handles `auth_required`, `user_not_registered`. |
| `src/components/Layout.jsx` | `base44.auth.isAuthenticated()`, `redirectToLogin()`, `auth.me()`, domain allowlist, UserInvitation filter, `UserInvitation.update`, `auth.updateMe({ role })`, `auth.me()` again, `auth.logout()`. Primary gate for who gets in. |
| `src/App.jsx` | `AuthProvider`; on `auth_required` calls `navigateToLogin()`; on `user_not_registered` shows `UserNotRegisteredError`. |
| `src/api/base44Client.js` | `createClient({ appId, token, appBaseUrl, ... })`. Token is passed into SDK; all entity/function calls use this client. |
| `src/lib/app-params.js` | Reads `app_id`, `access_token`, `app_base_url` from URL or env. |

### 1.3 Frontend Role Checks (all derive from `base44.auth.me()` or `user` from it)

- **Layout.jsx**: `me.role === 'admin'`, `!me.role || me.role === 'user'`, `user?.role === 'admin'`, `['admin','super_admin','test_automation'].includes(user?.role)`, role display map.
- **AdminInvitations.jsx**: `canManage = ['super_admin','compliance_admin','admin'].includes(user?.role)`.
- **AdminUsers, Clients, Engagements, EngagementDetail, ReportTab, ReviewTab, EngagementLockBanner, ChangeLog, ArtifactDiagnostics, Admin, AdminRiskProposals, AdminTestScenarios, LibraryReviewDashboard, PageInventoryAudit, RegressionTestDashboard, ReportPublicationDebug**: similar `isAdmin` / `allowed` / role checks.
- **auditLog.jsx**: `base44.auth.me()` for `userEmail` in log.

### 1.4 Backend Functions That Perform Auth/Role Checks

All use `createClientFromRequest(req)` and then `base44.auth.me()` (or equivalent) and check role. Examples:

- **ensureSmokeUser.ts**, **repairArtifactClassificationsNW034.ts**, **verifyRiskControlIntegrity.ts**, **verifyEngagementAuditFoundation.ts**, **exportArchitectureWithFiles.ts**, **architectureExporter.ts**, **backendInfrastructureVerification.ts**, **createVerificationArtifact.ts**, **completeUpgradeNW016A.ts**, **NormalizeVerificationReports.ts**, **migrateWorkflowStates.ts**, **executeMigration.ts**, **deliveryGateNW010/NW010A/NW011/NW012**, **publishNW010BReport.ts**, **analyzeAIInputNeed.ts**, **initializeSystemConfigs.ts**, **VerifyNW012Implementation.ts**, **comprehensiveSystemAudit.ts**, **auditPageArchitecture.ts**, **backfillLibraryReviewState.ts**, **backfillReviewStateFast.ts**, **verifyHistoricalNormalization.ts**, **normalizeHistoricalVersioning.ts**: admin or super_admin guard.

- **transitionState.ts**: `requiredRoles` + `userRole === 'admin'`.
- Other functions (e.g. **createEngagementSnapshots.ts**, **controlEvidenceEvaluator.ts**, **recommendationEngine.ts**, **systemEventLogger.ts**, **controlScoringEngine.ts**, etc.): call `auth.me()` for actor identity; some do not enforce role (rely on Base44 or route protection).

### 1.5 Entity Usage

- **User**: `User.list()`, `User.update(id, { role, full_name })`, `User.delete(id)` (AdminUsers); `User.filter` in backend (e.g. ensureSmokeUser, transitionState). Base44-owned; no direct password or session in Nightwatch.
- **UserInvitation**: `list`, `filter`, `create`, `update` (Layout, AdminInvitations, ensureSmokeUser). Core to current “who can log in” and role assignment.

### 1.6 Summary Counts

- **Frontend**: ~25+ files call `base44.auth.me()` or use `user`/`me` for role/identity; Layout is the single gate for domain + invitation + role.
- **Backend**: 40+ functions call `base44.auth.me()` and many enforce admin/super_admin.
- **Replacement impact**: Every call to `base44.auth.*` and every use of Base44 User/UserInvitation for access control must eventually go through a new auth boundary (Nightwatch session + Nightwatch User).

---

## 2. Smallest Durable Replacement Architecture

### 2.1 Auth Boundary Principle

- **Single source of truth**: Nightwatch backend owns User, Session, PasswordResetToken, AuthEvent.
- **Every API request**: Validated by Nightwatch middleware that resolves session (e.g. cookie or Bearer token) to a User; attaches `req.user` (id, email, role, etc.). No trust of client-supplied role.
- **Frontend**: No longer calls Base44 for login/me/logout. Calls Nightwatch endpoints: e.g. `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (or equivalent). Token/session stored (e.g. httpOnly cookie or memory + secure storage); sent with every request.

### 2.2 Session Handling

- **Issue on login**: Create Session row (user_id, token_hash, expires_at, ip_address, user_agent); return session identifier in httpOnly cookie (or opaque token in body for mobile). Never store plaintext token; store hash only.
- **Validation**: On each request, read cookie/token → hash → lookup Session by token_hash; check expires_at and revoked_at; load User; set req.user. Increment last_login_at on successful login.
- **Logout**: Set Session.revoked_at (or delete). Clear cookie/token on client.

### 2.3 Password Hashing

- **Storage**: User.password_hash only. bcrypt (cost ≥10). Never log or store plaintext.
- **Flow**: Login compares submitted password with bcrypt compare; force_reset / first-time setup uses same hash update after validating reset token or temporary password.

### 2.4 Auth Event Integrity

- **AuthEvent**: Append-only table. Insert on login, logout, failed_login, password_reset, role_changed, user_created, user_disabled, oauth_linked. No updates or deletes. Metadata JSON for extra context. Used for audit and lockout logic (e.g. failed_login_count, locked_until).

### 2.5 Google OAuth (Phase 1)

- **Flow**: Authorization code flow only. Exchange code for id_token / profile; extract email; look up User by email. If no user → reject (no auto-provisioning). If user exists and status active → create/link Session; optionally set oauth_provider and oauth_provider_id. No new user creation from OAuth.

### 2.6 Smoke User After Replacement

- **Creation**: Admin (or bootstrap script) creates User with email e.g. `tester@nightwatch.internal` (or keep smoke@nightwatch.test), role viewer (or as specified), status active, password_hash from bcrypt of deterministic password set by admin. No invitation; no email delivery.
- **Login**: Normal email/password or, if Phase 1 includes OAuth and that email is linked, OAuth. Session and auth events as for any user.

---

## 3. Affected Files / Surfaces (Implementation Will Touch)

### 3.1 New or Replaced

- **Backend**: New auth module (login, logout, me, password reset request/confirm, optional OAuth callback); session middleware; AuthEvent writer; User CRUD with password_hash and status; Session and PasswordResetToken and AuthEvent entities/tables. Possibly new Deno routes or integration in existing server.
- **Frontend**: AuthContext.jsx (switch to Nightwatch auth API). Layout.jsx (remove Base44 auth + invitation logic; use new me + logout + login redirect). base44Client or new api client: attach session (cookie or header) and call Nightwatch auth endpoints. AdminUsers: create user with initial password (or force-reset); no invitation dependency. Remove or repurpose AdminInvitations for “invite” as “create user and send reset link” only.
- **Config**: app_base_url / login URL points to Nightwatch login page (or hosted auth app owned by Nightwatch).

### 3.2 Modified (Behavior Preserved, Data Source Changed)

- Every page/component that calls `base44.auth.me()` or uses `user`: switch to new “current user” source (e.g. from AuthContext that calls GET /auth/me). Role checks stay; only the source of `user`/`me` changes.
- Backend functions: replace `createClientFromRequest` + `base44.auth.me()` with Nightwatch request context that provides `req.user` (from session middleware). Role checks become `['admin','super_admin'].includes(req.user.role)` (or equivalent). Entity access: User list/update/delete come from Nightwatch User store, not Base44.

### 3.3 Removed or Deprecated

- Reliance on Base44 for login, me, logout, User entity, UserInvitation for access control. Base44 may remain for non-auth entities (if applicable) or those too are migrated; that is a larger decision.

---

## 4. Security Risks and Explicit Guards

| Risk | Guard |
|------|--------|
| Plaintext password storage | Code review + schema: only password_hash; no plaintext column. |
| Plaintext session/reset token | Store only hashes; issue opaque token; validate by hash lookup. |
| Session token in URL | Use httpOnly cookie or Authorization header only; never in query/fragment. |
| Client-supplied role | All authorization from req.user populated by server session lookup only. |
| No rate limiting | Rate limit login and password-reset endpoints by IP (and optionally by email). |
| Auth log tampering | AuthEvent append-only; no update/delete API. |
| OAuth auto-provisioning | Reject OAuth login if email not found in User table. |
| Lockout bypass | Enforce locked_until and failed_login_count on login path; log failed attempts. |

---

## 5. Phase 2 Deferrals (Recommendation)

- **MFA (mfa_enabled, mfa_secret)**: Implement in Phase 2 after Phase 1 login/session/password is stable.
- **Advanced OAuth (e.g. multiple providers, link/unlink UI)**: Phase 2; Phase 1 only “Google OAuth for pre-provisioned users”.
- **org_id multi-tenancy**: Phase 2 if not required for initial cutover.
- **Full migration of all Base44 entities off Base44**: Out of scope for “auth replacement”; can be same phase or later depending on product decision.
- **Self-service “forgot password” for end users**: Can be Phase 1 (admin-triggered reset) with user-facing “forgot password” link as Phase 2.

---

## 6. Migration Plan (High Level)

1. **Pre-cutover**: Deploy new auth module and new User/Session/PasswordResetToken/AuthEvent store alongside existing Base44 auth. No switch yet.
2. **User migration**: Export existing users (from Base44 User or from UserInvitation + first-login snapshot). For each: create Nightwatch User with same email, full_name, role; set status active; set password_hash to “must change” or send one-time reset link. Do not store original passwords (not available).
3. **Smoke/test user**: Create deterministically (e.g. tester@nightwatch.internal, password set by config/admin).
4. **Cutover**: Switch frontend to Nightwatch login and /auth/me; switch backend to session middleware and Nightwatch User. Base44 auth and invitation checks turned off (feature flag or deploy).
5. **Communication**: Users must set password (or use reset link) before first login to new system. Google users: ensure same email exists in Nightwatch User so OAuth match works.
6. **Rollback**: Keep Base44 auth code path behind flag; if cutover fails, revert to Base44 auth and re-enable invitation flow; no rollback of new User table (can run in parallel until stable).

---

## 7. Rollback Plan

- **Feature flag**: e.g. `USE_NIGHTWATCH_AUTH`. If false, frontend and backend use Base44 auth and existing User/UserInvitation as today.
- **If cutover fails**: Set flag to false; redeploy; users log in again via Base44. New auth tables can remain for retry later.
- **Data**: Do not delete Base44 User/UserInvitation data until Nightwatch auth has been stable for a defined period. Optionally keep read-only sync for audit.

---

## 8. What to Build First (Safe Auth Boundary)

1. **Backend auth module (minimal)**: POST login (email + password → bcrypt check → create Session → set cookie); GET me (session → User); POST logout (revoke session, clear cookie). Session middleware that runs on all protected routes and sets req.user.
2. **New User store**: Create/read/update User (including password_hash, role, status); no delete of last admin. Bootstrap smoke user (script or admin UI).
3. **AuthEvent**: Write login, failed_login, logout, user_created. Use for lockout and audit.
4. **Frontend**: Replace AuthContext/Layout auth with calls to new backend; use cookie for session. Remove invitation gate in Layout; keep role-based UI as-is.
5. **Backend functions**: Add a thin adapter: resolve user from request (session) instead of base44.auth.me(); keep same role checks. This can be a single “getCurrentUser(req)” that returns same shape as current me().
5. **Then**: Password reset flow, admin user CRUD, then Google OAuth (email-match only).

---

## 9. Recommendation on Cursor-Only Implementation

- **Not Cursor-only recommended.** This is a high-risk, security-critical change. Recommended path:
  - **Design and review**: Cursor + human review (this REVIEW and RESULT).
  - **Implementation**: Prefer human-led implementation with Cursor assistance (targeted edits, tests, migration scripts). Security-sensitive code (hashing, token handling, rate limiting) should be reviewed by a human.
  - **Testing**: Automated tests for login, logout, me, role checks, lockout, reset flow; security review before production.
- **Cursor-only** could be used for: generating migration scripts (read-only export), drafting adapter layers, and updating call sites from base44.auth.me() to new getCurrentUser(), if the new auth API and middleware are implemented and reviewed elsewhere.
