# NW-UPGRADE-076B — Nightwatch Authentication Engine — RESULT

## Upgrade ID

**NW-UPGRADE-076B** — Nightwatch Authentication Engine. This upgrade implements the **parallel** auth system (password auth, session issuance, validation, logout, lockout, auth events). It does **not** replace the existing Base44 authentication flow. No UI changes.

---

## 1. Functions Created

| Function | Purpose |
|----------|---------|
| **nwAuthLogin** | POST; body `{ email, password }`. Normalizes email, looks up NwAuthUser, rejects if disabled or locked, verifies password with bcrypt. On failure: increments failed_login_count, locks after 5 failures for 15 min, writes login_failure and account_locked. On success: resets failed_login_count and locked_until, updates last_login_at, creates NwAuthSession (token_hash only), writes login_success and session_created. Returns `{ session_token, expires_at, user }`. |
| **nwAuthValidateSession** | POST; body `{ session_token }` or header `Authorization: Bearer <token>`. Hashes token, finds NwAuthSession by token_hash, checks not revoked and not expired, loads user, checks session_version_snapshot matches user.session_version. Returns `{ authenticated: true, user }`. |
| **nwAuthLogout** | POST; body `{ session_token }` or Bearer header. Hashes token, finds session, sets revoked_at, writes AuthEvent logout. Returns `{ success: true }`. |
| **auth-nw-helpers.ts** | Shared: generateSessionToken, hashSessionToken (SHA-256), sessionExpiresAt (7 days), lockedUntil (15 min), LOCKOUT_THRESHOLD (5), LOCKOUT_MINUTES (15), SESSION_EXPIRY_DAYS (7). |

---

## 2. Session Issuance

- On successful login, a secure random token (32 bytes, base64url) is generated and returned to the client as `session_token`.
- Only the **hash** (SHA-256) of the token is stored in NwAuthSession (`token_hash`).
- Session record includes: user_id, token_hash, created_at, expires_at, ip_address, user_agent, revoked_at (null), session_version_snapshot.
- Session expiry: 7 days from creation.

---

## 3. Login Protection (Lockout)

- **5 failed logins** → account locked.
- **Lock duration**: 15 minutes (`locked_until`).
- On each failed attempt: `failed_login_count` incremented; if count ≥ 5, `locked_until` set to now + 15 minutes.
- On successful login: `failed_login_count` and `locked_until` reset.
- Rejections: status disabled → 403; currently locked → 403; invalid password → 401 (after updating count and possibly locking).

---

## 4. Auth Event Logging

AuthEvent rows are **append-only** (insert only; no update/delete in code).

| Event type | When |
|------------|------|
| login_success | After successful password verification and before returning session. |
| login_failure | After invalid password; metadata includes failed_login_count. |
| account_locked | When login rejected because locked_until is in future; or when failed_login_count reaches threshold. |
| session_created | After creating NwAuthSession on successful login. |
| logout | When nwAuthLogout sets revoked_at on session. |

---

## 5. No Existing Auth Flow Modified

- Base44 User model: not modified.
- Base44 login flow: not modified.
- Frontend UI: not modified.
- Unrelated functions: not modified.
- New logic is **parallel** only: nwAuthLogin, nwAuthValidateSession, nwAuthLogout are new endpoints; no routes or UI were switched to them in this upgrade.

---

## 6. Before Finishing — Checklist

| Item | Status |
|------|--------|
| Login works via nwAuthLogin | Yes (email + password → session_token + user) |
| Sessions stored in NwAuthSession | Yes (token_hash only) |
| Session validation works (nwAuthValidateSession) | Yes |
| Logout works (nwAuthLogout) | Yes (revoked_at set; logout event written) |
| Lockout protection works | Yes (5 failures → 15 min lock) |
| AuthEvent rows created | Yes (login_success, login_failure, account_locked, session_created, logout) |
| No Base44 auth replaced | Yes |
| No UI changes | Yes |

---

**End of NW-UPGRADE-076B RESULT.**
