# NW-UPGRADE-076F-PHASE2 — Sanity check

Base44 authentication removed; Nightwatch-only auth.

## Checks

- [ ] **Login works using Nightwatch**  
  Unauthenticated user is redirected to `/login`. Submit email + password → success and redirect into app (e.g. Dashboard). No "Sign in with Base44" option.

- [ ] **Protected routes require Nightwatch session**  
  Without a valid Nightwatch session (no cookie), navigating to any protected route (e.g. `/Dashboard`, `/Engagements`) redirects to `/login`. With a valid session, routes load normally.

- [ ] **Logout clears session**  
  Click Sign out (sidebar or similar) → redirect to `/login`. Reload or navigate to a protected route → redirect to `/login` again. Session cookie cleared.

- [ ] **Base44 login paths removed**  
  Login page has no "Sign in with Base44" or Base44 OAuth entry. AuthContext and Layout do not reference Base44 auth, `authSource`, or `checkUserAuth`; `navigateToLogin` goes to `/login` only.

- [ ] **Roles**  
  Layout and role-based UI use Nightwatch roles only: admin, operator, viewer, auditor. No Base44-specific roles (e.g. super_admin, compliance_admin) in the UI.

- [ ] **Entity access**  
  Base44 entity access (e.g. `base44.entities.*`, `base44.functions.invoke`) still works for data; only Base44 **auth** (login, session, me, logout, redirectToLogin) has been removed.
