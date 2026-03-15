# NW-UPGRADE-076C — Nightwatch Auth Middleware — RESULT

## Upgrade ID

**NW-UPGRADE-076C** — Nightwatch Auth Middleware. Adds server-side session validation and request user injection for Nightwatch routes. **Does not replace Base44 authentication.** No existing routes were modified.

---

## 1. Middleware Created

**functions/auth-nw-middleware.ts**

| Export | Purpose |
|--------|---------|
| **getSessionUser(token, req)** | Shared validation: hash token, lookup NwAuthSession by token_hash, check not revoked/expired, load NwAuthUser, check session_version. Returns `{ ok: true, user }` or `{ ok: false, error, reason?, userId? }`. |
| **nwAuthMiddleware(req, options?)** | Reads `Authorization: Bearer <token>`, calls getSessionUser. If valid: returns `{ authenticated_user }`. If invalid: optionally writes AuthEvent `session_invalid` (when reason is revoked or expired), returns `{ error: Response }` (401 JSON). |
| **requireAuth(auth)** | Takes the result of nwAuthMiddleware. If `auth.error` or missing `auth.authenticated_user`, returns 401 Response; otherwise returns null (caller may proceed). |

---

## 2. Validation Working

- Token is read from `Authorization: Bearer <token>`.
- Validation reuses the same logic as the nwAuthValidateSession endpoint (nwAuthValidateSession now calls getSessionUser).
- Invalid tokens (missing, not found, revoked, expired, version mismatch) yield 401 with a JSON error body.

---

## 3. Request User Injection

- Middleware does not mutate the Request object (Request is immutable). Instead it returns a result object:
  - **Success:** `{ authenticated_user: user }` — the route handler uses this as the request user.
  - **Failure:** `{ error: Response }` — the route handler returns this Response (401).

**Usage pattern:**

```ts
const auth = await nwAuthMiddleware(req);
const err = requireAuth(auth);
if (err) return err;
// auth.authenticated_user is set
```

---

## 4. Optional Auth Event

- When session validation fails because the session is **revoked** or **expired**, the middleware can write an AuthEvent with `event_type: session_invalid` (metadata includes `reason`).
- Enable by calling `nwAuthMiddleware(req, { writeSessionInvalidEvent: true })`.
- Event is append-only; no update/delete.

---

## 5. No Existing Routes Modified

- Base44 authentication: not modified.
- UI login: not modified.
- Existing route handlers: not modified. Middleware is opt-in; routes that want Nightwatch session validation call nwAuthMiddleware and requireAuth.

---

## 6. Before Finishing — Checklist

| Item | Status |
|------|--------|
| Middleware validates tokens | Yes (via getSessionUser) |
| authenticated_user injected (via return object) | Yes |
| Invalid tokens rejected with 401 | Yes |
| RESULT file generated | Yes |

---

**End of NW-UPGRADE-076C RESULT.**
