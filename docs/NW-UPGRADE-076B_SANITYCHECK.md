# NW-UPGRADE-076B — Nightwatch Authentication Engine — SANITYCHECK

## Objective

Implement the Nightwatch authentication engine using the 076A auth data layer: password authentication, session issuance, logout, session validation, account lockout, and auth event logging. **Parallel auth system only** — do not replace existing Base44 authentication flow.

## Entity Verification

| Entity | File | Required fields for 076B |
|--------|------|---------------------------|
| **NwAuthUser** | base44/entities/NwAuthUser.json | email, password_hash, status, failed_login_count, locked_until, session_version |
| **NwAuthSession** | base44/entities/NwAuthSession.json | user_id, token_hash, created_at, expires_at, revoked_at, session_version_snapshot |
| **NwAuthPasswordResetToken** | base44/entities/NwAuthPasswordResetToken.json | (schema only; not used in 076B) |
| **NwAuthEvent** | base44/entities/NwAuthEvent.json | user_id, event_type, performed_by, timestamp, metadata |

All four entity schema files exist in base44/entities/. NwAuthUser schema includes email, password_hash, status, failed_login_count, locked_until, session_version. NwAuthSession includes user_id, token_hash, expires_at, revoked_at, session_version_snapshot. NwAuthEvent includes user_id, event_type, performed_by, timestamp, metadata. Schema matches expected fields for login, session, and event logging.

## Risk Assessment

| Risk | Level | Mitigation |
|------|--------|-------------|
| New auth path used before cutover | Low | 076B does not replace Base44 auth; no UI or route changes. New functions are parallel. |
| Password/session handling bugs | Medium | Use bcrypt for passwords; store only token hash; no plaintext in DB or URLs. |
| Lockout bypass or abuse | Low | Enforce locked_until and failed_login_count server-side; log failures. |
| AuthEvent tampering | Low | Append-only; no update/delete in code. |

**Overall: Medium** — new security-sensitive code (passwords, sessions, lockout) but scoped to new functions only and no change to existing auth.

## Abort Condition

If any of the four entities were missing or schema lacked required fields (e.g. NwAuthUser without failed_login_count or locked_until), implementation would be aborted. Verified: all present and compatible.

## Scope Limits

- **No** modification to Base44 User model or Base44 login flow.
- **No** frontend UI changes.
- **No** changes to unrelated functions.
- **Only**: New functions nwAuthLogin, nwAuthValidateSession, nwAuthLogout and shared helpers; AuthEvent writes; no replacement of existing auth.

## Verdict

Proceed with implementation: password auth, session create/validate/logout, lockout, and AuthEvent logging.
