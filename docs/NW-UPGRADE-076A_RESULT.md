# NW-UPGRADE-076A — Auth Data Layer + Admin User Foundation — RESULT

## Upgrade ID

**NW-UPGRADE-076A** — Auth Data Layer + Admin User Foundation. This phase did **not** implement login, logout, session issuance, password-reset flow, OAuth, or auth cutover. Existing live Base44 auth flow is unchanged.

---

## 1. New Data Models (Implemented)

### User (NwAuthUser in Base44)

- **Location**: Persisted via Base44 custom entity `NwAuthUser` (see docs/NW-UPGRADE-076A_ENTITY_SCHEMA.md).
- **Fields**: id, email, password_hash, full_name, role, org_id, status, mfa_enabled, mfa_secret, oauth_provider, oauth_provider_id, created_by, created_at, last_login_at, password_changed_at, failed_login_count, locked_until, session_version.
- **Constraints**: email lowercase and unique; role and status from centralized enums (functions/auth-nw-constants.ts, src/lib/nw-auth-constants.js). password_hash nullable; session_version default 0.
- **Security**: password_hash and mfa_secret are **never** returned in admin UI or API responses (stripped in nwAuthListUsers, nwAuthCreateUser, nwAuthUpdateUser, nwAuthDisableUser).

### Session (NwAuthSession)

- **Schema only** in this phase (documented in NW-UPGRADE-076A_ENTITY_SCHEMA.md). No live session issuance. token_hash only; session_version_snapshot included.

### PasswordResetToken (NwAuthPasswordResetToken)

- **Schema only** in this phase (documented in NW-UPGRADE-076A_ENTITY_SCHEMA.md). No reset flow. token_hash only.

### AuthEvent (NwAuthEvent)

- **Append-only**: Application code only inserts; **no update or delete** operations. event_type, performed_by, ip_address, timestamp, metadata. Used for user_created, role_changed, user_disabled, user_status_changed, user_updated.

---

## 2. Admin User-Management Foundation

- **List users**: nwAuthListUsers — returns all NwAuthUser rows with password_hash and mfa_secret stripped.
- **Create user**: Admin can create a user directly (email, full_name, role, status). No invitation flow. password_hash may be null (pending). Implemented in nwAuthCreateUser and "Create user" dialog on Admin Users page.
- **Edit user**: full_name, role, status. nwAuthUpdateUser.
- **Disable user**: Set status to disabled. nwAuthDisableUser; AuthEvent user_disabled (or user_status_changed) appended.
- **View auth events**: nwAuthListAuthEvents by user_id; shown in "Auth events" dialog per user.

All actions require current Base44 user to be admin or super_admin. No client-side role trusted without this server check.

---

## 3. AuthEvent Wiring

- **user_created**: On NwAuthUser create (nwAuthCreateUser).
- **role_changed**: When role is updated and differs from previous (nwAuthUpdateUser).
- **user_disabled**: When status is set to disabled (nwAuthDisableUser).
- **user_status_changed**: When status changes and not already user_disabled (nwAuthUpdateUser).
- **user_updated**: When full_name is updated (nwAuthUpdateUser).

AuthEvent is append-only in behavior and implementation; no update/delete path in application code.

---

## 4. Smoke-User Readiness

- Data model and admin flow support later creation of:
  - email: tester@nightwatch.internal (or equivalent)
  - role: viewer
  - status: active
  - deterministic password set in a later phase (password_hash set by admin/bootstrap)
- This phase does not create the smoke user; it only ensures the NwAuthUser model and "Create user" path support it.

---

## 5. Files Added/Changed

| Path | Change |
|------|--------|
| functions/auth-nw-constants.ts | New. Centralized NW_AUTH_ROLES, NW_AUTH_STATUSES. |
| functions/nwAuthListUsers.ts | New. List NwAuthUser; strip password_hash, mfa_secret. |
| functions/nwAuthCreateUser.ts | New. Create user; append user_created. |
| functions/nwAuthUpdateUser.ts | New. Update full_name/role/status; append role_changed, user_status_changed, user_updated. |
| functions/nwAuthDisableUser.ts | New. Set status disabled; append user_disabled. |
| functions/nwAuthListAuthEvents.ts | New. List NwAuthEvent by user_id. |
| src/lib/nw-auth-constants.js | New. NW_AUTH_ROLES, NW_AUTH_STATUSES for UI. |
| src/pages/AdminUsers.jsx | Extended with "Nightwatch users" section, create/edit/disable/events dialogs. |
| docs/NW-UPGRADE-076A_SANITYCHECK.md | New. |
| docs/NW-UPGRADE-076A_REVIEW.md | New. |
| docs/NW-UPGRADE-076A_ENTITY_SCHEMA.md | New. Schema for NwAuthUser, NwAuthSession, NwAuthPasswordResetToken, NwAuthEvent. |

---

## 6. Dependency: Base44 Custom Entities

The nwAuth* functions use `base44.asServiceRole.entities.NwAuthUser`, `NwAuthEvent` (and for future use NwAuthSession, NwAuthPasswordResetToken). These entities must exist in the Base44 app with the schema in docs/NW-UPGRADE-076A_ENTITY_SCHEMA.md. If they are not created, list returns [] and create/update/disable return 503 with message "Nightwatch auth entities not configured". Create the entities in the Base44 dashboard (or via base44/entities/ and deploy) before using the Nightwatch users section.

---

## 7. What Was Not Changed

- Existing live Base44 auth flow (Layout, AuthContext, login redirect, token).
- Existing invitation flow (AdminInvitations, ensureSmokeUser, invite links).
- Base44 User list, edit, delete, ensure smoke user, invite button on Admin Users page.
- NW-074 selector work; engagement, risk, control, audit, reporting, testing modules.
- Any production auth behavior (who can log in remains Base44 + invitation).

---

## 8. Before Finishing — Checklist

| Item | Status |
|------|--------|
| New User model exists with correct fields | Yes (NwAuthUser) |
| New Session model exists with correct fields | Yes (schema; NwAuthSession) |
| New PasswordResetToken model exists with correct fields | Yes (schema; NwAuthPasswordResetToken) |
| New AuthEvent model exists with correct fields | Yes (NwAuthEvent) |
| Admin can create a user directly with no invitation dependency | Yes |
| Admin can edit user full_name, role, and status | Yes |
| Admin can disable a user | Yes |
| Auth events recorded for user_created, role_changed, user_disabled / status changes | Yes |
| password_hash not exposed in UI or API responses | Yes |
| AuthEvent has no update/delete path in application code | Yes |
| Existing live auth flow not changed | Yes |
| Upgrade ID consistency (NW-UPGRADE-076A) | Yes |

---

**End of NW-UPGRADE-076A RESULT.**
