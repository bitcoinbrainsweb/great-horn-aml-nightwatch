# NW-UPGRADE-076E-PHASE1 — Nightwatch Login Endpoint — RESULT

## Upgrade ID

**NW-UPGRADE-076E-PHASE1** — Nightwatch login endpoint that authenticates users and issues a session cookie. No frontend changes. Middleware and Base44 auth unchanged.

---

## 1. Login Endpoint Working

**Function:** `nwAuthLogin` (functions/nwAuthLogin.ts)

- **POST** body: `{ email, password }`.
- Validates: lookup NwAuthUser by email, verify password with bcrypt, ensure status = active (rejects disabled and locked).
- Creates NwAuthSession with **hashed** token only (no plaintext in DB).
- Sets **Set-Cookie** with session token and returns JSON.

---

## 2. Cookie Issued

On successful login the response includes:

- **Set-Cookie:** `nw_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<seconds>`
  - **HttpOnly** — not accessible to JavaScript.
  - **Secure** — sent only over HTTPS (when applicable).
  - **SameSite=Strict** — not sent on cross-site requests.
  - **Path=/** — sent for all paths on the origin.
  - **Max-Age** — matches session expiry (e.g. 7 days in seconds).

Token is **not** returned in the response body when the cookie is set (reduces exposure).

---

## 3. Session Stored

- Session record is created in **NwAuthSession** with:
  - `user_id`, `token_hash` (only the hash is stored), `created_at`, `expires_at`, `ip_address`, `user_agent`, `revoked_at` (null), `session_version_snapshot`.
- Plaintext token exists only in the cookie (and in memory on the server when generating); it is never stored in the DB.

---

## 4. Response Shape

Success (200):

```json
{
  "user": { "id": "<user_id>", "email": "<email>", "role": "<role>" },
  "session_expires_at": "<ISO date string>"
}
```

- **password_hash** and **mfa_secret** are never returned.
- Disabled user: 403, no cookie, no session.
- Invalid password: 401, no cookie, no session (failed_login_count/lockout logic unchanged from 076B).

---

## 5. Security Requirements Met

| Requirement | Status |
|-------------|--------|
| Never return password_hash | Yes (user object has id, email, role only) |
| Token stored hashed in DB | Yes (NwAuthSession.token_hash only) |
| Cookie HttpOnly | Yes |
| Reject disabled users | Yes (status === 'disabled' → 403) |

---

## 6. Do Not Modify (Confirmed)

- **Middleware** — auth-nw-middleware.ts unchanged.
- **Base44 auth** — unchanged.
- **Frontend login UI** — unchanged.

---

## 7. Before Finishing — Checklist

| Item | Status |
|------|--------|
| Login endpoint working | Yes |
| Cookie issued (nw_session, HttpOnly, Secure, SameSite=Strict) | Yes |
| Session stored (NwAuthSession, token_hash only) | Yes |
| RESULT file generated | Yes |

---

**End of NW-UPGRADE-076E-PHASE1 RESULT.**

**Branch:** nw-upgrade-076e-phase1-login-endpoint
