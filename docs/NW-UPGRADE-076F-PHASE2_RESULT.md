# NW-UPGRADE-076F-PHASE2 — Result

Base44 authentication removed; Nightwatch auth fully active.

## Confirmation

| Item | Status |
|------|--------|
| **Base44 auth removed** | Yes. All Base44 login flows, auth checks, and session handling removed. No `base44.auth.me()`, `base44.auth.logout()`, `base44.auth.redirectToLogin()`, `base44.auth.isAuthenticated()`, `base44.auth.updateMe()`, or `base44.auth.resetPasswordRequest()`. Login page is Nightwatch-only; AuthContext uses only Nightwatch session (cookie + `getCurrentUser()`). |
| **Nightwatch auth fully active** | Yes. Session detection via Nightwatch session cookie; login redirects to `/login`; logout calls Nightwatch logout and redirects to `/login`. All protected routes rely on auth state from AuthContext (Nightwatch session). Role handling uses Nightwatch roles only: admin, operator, viewer, auditor. |

## Changes summary

- **AuthContext:** Nightwatch-only. No Base44 fallback, no `authSource`, no `checkUserAuth`. No `@base44/sdk` import; public settings fetched via native `fetch()`. `navigateToLogin` sets `window.location.pathname = '/login'`. `logout` calls `nightwatchAuth.logout()` and redirects to `/login`.
- **Login page:** Base44 button and `handleBase44Login` removed. Single Nightwatch email/password form.
- **Layout:** No Base44 branch. User comes from `useAuth().user` only. Domain allowlist and UserInvitation flow removed. Role display uses Nightwatch roles (admin, operator, viewer, auditor).
- **Pages and components:** All `base44.auth.me()` replaced with `useAuth().user`. Admin/role checks use `user?.role === 'admin'` (or operator/viewer/auditor where relevant). `base44.auth.resetPasswordRequest` removed (replaced with message that password is managed via Nightwatch).
- **Roles:** `NW_AUTH_ROLES` and UI role lists use only: admin, operator, viewer, auditor. Layout `roleName` and AdminUsers/AdminInvitations ROLES updated.
- **auditLog:** No longer calls `base44.auth.me()`; uses `userEmail`/`userName` from callers (or `'unknown'`).
- **Base44 entity access:** Kept. `base44.entities.*`, `base44.functions.invoke`, and `base44.integrations` remain in use for data and functions.

## Do not modify (unchanged)

- Entity schemas
- Audit workflow
- Compliance graph

## Branch

`nw-upgrade-076f-phase2-remove-base44-auth`

## Sanity check

See `docs/NW-UPGRADE-076F-PHASE2_SANITYCHECK.md`.
