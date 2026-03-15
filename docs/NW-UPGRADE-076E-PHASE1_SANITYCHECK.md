# NW-UPGRADE-076E-PHASE1 — Nightwatch Login Endpoint — SANITYCHECK

## Objective

Create the **Nightwatch login endpoint** that authenticates users and issues a session cookie. No frontend changes in this upgrade.

## Scope

- **Function:** nwAuthLogin (enhance existing 076B implementation).
- **Behavior:** POST { email, password } → validate NwAuthUser (email, password_hash, status active) → create NwAuthSession (token hashed) → set cookie `nw_session=<token>` with HttpOnly, Secure, SameSite=Strict, Path=/ → return JSON { user: { id, email, role }, session_expires_at }.
- **Security:** Never return password_hash; token stored hashed in DB; cookie HttpOnly; reject disabled users.

## Validation (Confirm)

1. **Valid credentials return session cookie**
   - POST with valid email + password for an active NwAuthUser with password_hash set.
   - Response must include `Set-Cookie: nw_session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/` and 200 JSON { user, session_expires_at }.

2. **Invalid password returns 401**
   - POST with correct email and wrong password.
   - Response 401, no session cookie, no session row created.

3. **Disabled user rejected**
   - POST with email/password for user with status = disabled.
   - Response 403 (or 401), no cookie, no session.

4. **Session row created**
   - On successful login, NwAuthSession row exists with token_hash (not plaintext), user_id, expires_at.

## Do Not Modify

- Middleware (auth-nw-middleware.ts).
- Base44 auth.
- Frontend login UI.

## Risk

- **Low.** Cookie is additive to existing login response; existing session_token-in-body behavior can remain for backward compatibility or be limited to cookie-only per spec. No change to middleware or Base44.

## Verdict

Proceed to add Set-Cookie to nwAuthLogin success response and return the specified JSON shape.
