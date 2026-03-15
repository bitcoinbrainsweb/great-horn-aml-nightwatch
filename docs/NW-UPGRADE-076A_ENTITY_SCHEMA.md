# NW-UPGRADE-076A — Nightwatch Auth Entity Schema

Create these **Base44 custom entities** (or equivalent tables in a Nightwatch-owned database) so the nwAuth* functions can persist data. Entity names are prefixed to avoid clashing with Base44 built-in `User`.

## NwAuthUser

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| id | string | (auto) | Primary key |
| email | string | yes | Lowercase, unique |
| password_hash | string | no | Nullable; never expose in API/UI |
| full_name | string | no | |
| role | string | yes | admin, super_admin, compliance_admin, analyst, reviewer, viewer, test_automation |
| org_id | string | no | |
| status | string | yes | pending, active, disabled |
| mfa_enabled | boolean | no | Default false |
| mfa_secret | string | no | Never expose |
| oauth_provider | string | no | |
| oauth_provider_id | string | no | |
| created_by | string | no | |
| created_at | string (ISO) | no | |
| last_login_at | string (ISO) | no | |
| password_changed_at | string (ISO) | no | |
| failed_login_count | number | no | Default 0 |
| locked_until | string (ISO) | no | |
| session_version | number | no | Default 0 |

## NwAuthSession (schema only; no live issuance in 076A)

| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| user_id | string | |
| token_hash | string | Only hash stored |
| created_at | string (ISO) | |
| expires_at | string (ISO) | |
| ip_address | string | |
| user_agent | string | |
| revoked_at | string (ISO) | Nullable |
| session_version_snapshot | number | |

## NwAuthPasswordResetToken (schema only; no reset flow in 076A)

| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| user_id | string | |
| token_hash | string | Only hash stored |
| expires_at | string (ISO) | |
| created_at | string (ISO) | |
| used_at | string (ISO) | Nullable |
| ip_address | string | |

## NwAuthEvent (append-only; no update/delete in application code)

| Field | Type | Notes |
|-------|------|--------|
| id | string | |
| user_id | string | Subject of event |
| event_type | string | user_created, role_changed, user_disabled, user_status_changed, user_updated, etc. |
| performed_by | string | |
| ip_address | string | |
| timestamp | string (ISO) | |
| metadata | object/JSON | Event-specific context |
