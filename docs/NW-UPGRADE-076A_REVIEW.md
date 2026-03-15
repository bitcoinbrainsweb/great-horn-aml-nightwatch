# NW-UPGRADE-076A — Auth Data Layer + Admin User Foundation — REVIEW

## 1. Exact Schema (Nightwatch Auth Models)

Storage: **Base44 custom entities** with prefixed names so they do not conflict with built-in `User`. Create in Base44 dashboard (or via `base44/entities/` if the project uses that). Field names and types below; IDs are Base44-managed unless otherwise noted.

### NwAuthUser (maps to User model)

| Field | Type | Notes |
|-------|------|--------|
| id | string | Base44-managed |
| email | string | Lowercase, unique |
| password_hash | string | Nullable (pending users); never expose in API/UI |
| full_name | string | Nullable |
| role | string | Enum: admin, super_admin, compliance_admin, analyst, reviewer, viewer, test_automation |
| org_id | string | Nullable (Phase 2) |
| status | string | Enum: pending, active, disabled |
| mfa_enabled | boolean | Default false |
| mfa_secret | string | Never expose; Phase 2 |
| oauth_provider | string | Nullable |
| oauth_provider_id | string | Nullable |
| created_by | string | Email or user id of creator |
| created_at | string (ISO) | |
| last_login_at | string (ISO) | Nullable |
| password_changed_at | string (ISO) | Nullable |
| failed_login_count | number | Default 0 |
| locked_until | string (ISO) | Nullable |
| session_version | number | Default 0 |

### NwAuthSession (schema only this phase)

| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| user_id | string | |
| token_hash | string | Only hash stored |
| created_at | string (ISO) | |
| expires_at | string (ISO) | |
| ip_address | string | Nullable |
| user_agent | string | Nullable |
| revoked_at | string (ISO) | Nullable |
| session_version_snapshot | number | |

### NwAuthPasswordResetToken (schema only this phase)

| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| user_id | string | |
| token_hash | string | Only hash stored |
| expires_at | string (ISO) | |
| created_at | string (ISO) | |
| used_at | string (ISO) | Nullable |
| ip_address | string | Nullable |

### NwAuthEvent (append-only)

| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| user_id | string | Subject of the event |
| event_type | string | user_created, role_changed, user_disabled, user_status_changed, user_updated, etc. |
| performed_by | string | Email or id of actor |
| ip_address | string | Nullable |
| timestamp | string (ISO) | |
| metadata | object/JSON | Event-specific context |

Application code must **never** update or delete AuthEvent rows; insert only.

---

## 2. Centralized Enums

- **User role enum**: admin, super_admin, compliance_admin, analyst, reviewer, viewer, test_automation (single source of truth in code).
- **User status enum**: pending, active, disabled (single source of truth in code).

---

## 3. Admin User-Management UI Changes

- **Location**: Extend **Admin Users** page with a second section: **Nightwatch users** (or "Access control (Nightwatch)").
- **Data source**: New backend functions (nwAuthListUsers, nwAuthCreateUser, nwAuthUpdateUser, nwAuthDisableUser, nwAuthListAuthEvents). **Do not** replace or remove the existing Base44 User table or invite flow.
- **Actions**:
  - **List**: Table of Nightwatch users (email, full_name, role, status); no password_hash, no mfa_secret.
  - **Create user**: Button opens dialog; fields: email (lowercase), full_name, role, status (pending/active/disabled). On save call nwAuthCreateUser. No invitation; password_hash can be null for pending.
  - **Edit**: Edit full_name, role, status (and status change to disabled triggers user_disabled semantics).
  - **Disable**: Set status to disabled; record AuthEvent user_disabled (or user_status_changed with metadata).
  - **View auth events**: Button or link per user opens a list of AuthEvent rows for that user (event_type, performed_by, timestamp, metadata).
- **Authorization**: All new functions require current Base44 user to be admin/super_admin (base44.auth.me() + role check). No change to who can open Admin Users page (existing role check).

---

## 4. Event Logging Plan

- **user_created**: On NwAuthUser create; performed_by = current admin email; metadata may include role, status.
- **role_changed**: When role is updated and previous role ≠ new role; performed_by, metadata.old_role, metadata.new_role.
- **user_disabled**: When status is set to disabled; performed_by.
- **user_status_changed**: When status changes and not already covered by user_disabled (e.g. pending → active); performed_by, metadata.old_status, metadata.new_status.
- **user_updated**: For other meaningful admin edits (e.g. full_name change) if we want an audit trail; performed_by, metadata with changed fields.

All events: append-only insert into NwAuthEvent; no update/delete in application code.

---

## 5. Rollback Path for This Sub-Phase

- **Code rollback**: Remove or feature-flag the "Nightwatch users" section and the new Deno functions (nwAuth*). Revert AdminUsers.jsx to only Base44 User + invitations. No change to live auth, so rollback is low risk.
- **Data**: New entities (NwAuthUser, NwAuthSession, NwAuthPasswordResetToken, NwAuthEvent) can remain in Base44; they are not used by live auth until cutover. Optionally archive or leave in place for future use.

---

## 6. Smoke-User Readiness

- Data model and admin flow must support later creation of:
  - email: tester@nightwatch.internal (or equivalent)
  - role: viewer
  - status: active
  - deterministic password set in a later phase (password_hash set by admin/bootstrap)
- This phase does **not** create the smoke user unless needed for testing; it only ensures the NwAuthUser model and admin "Create user" path support it.

---

## 7. Implementation Order

1. Define centralized role/status enums (shared constant file).
2. Document or add Base44 entity schemas for NwAuthUser, NwAuthSession, NwAuthPasswordResetToken, NwAuthEvent (create in dashboard or via base44/entities/).
3. Implement backend: nwAuthListUsers, nwAuthCreateUser, nwAuthUpdateUser, nwAuthDisableUser, nwAuthListAuthEvents; AuthEvent writes on create/update/disable; never return password_hash or mfa_secret.
4. Extend Admin Users page with Nightwatch users section and wire to new functions.
5. Verify existing Base44 User list, edit, delete, ensure smoke user, and invite flow still work unchanged.
