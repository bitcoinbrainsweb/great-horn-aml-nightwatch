# NW-UPGRADE-076A — Auth Data Layer + Admin User Foundation — SANITYCHECK

## Objective

Build the first safe implementation slice of the Nightwatch-controlled access system by creating the new auth data foundation and admin user-management foundation, **without changing the live authentication flow**.

## Scope (This Phase Only)

- New Nightwatch auth data models: User, Session, PasswordResetToken, AuthEvent.
- Admin user-management foundation: list, create (no invitation), edit full_name/role/status, disable, view auth event history.
- AuthEvent wiring for user_created, role_changed, user_disabled, user_status_changed, user_updated.
- Smoke-user readiness (data model and admin flow support later creation of tester@nightwatch.internal).
- **No** login, logout, session issuance, password-reset flow, OAuth, or auth cutover.

## Current Auth-Related Data Usage (Relevant to 076A)

| Surface | Current usage |
|--------|----------------|
| **AdminUsers.jsx** | base44.entities.User.list(), User.update(id, { role, full_name }), User.delete(id); base44.entities.UserInvitation.list(); ensureSmokeUser invoke; buildInviteLink; no direct User.create (invitation flow). |
| **AdminInvitations.jsx** | UserInvitation.list/create/update; User.list for "registered" check; role check for canManage. |
| **Layout.jsx** | base44.auth.me(), UserInvitation.filter/update, auth.updateMe({ role }). Live auth gate — **do not modify**. |
| **Backend** | ensureSmokeUser, createTestAutomationUser use User.filter, UserInvitation.create/update. transitionState uses User.filter. |

## Schema / Platform Constraints

- **User** and **UserInvitation** are Base44-built-in entities; schema is not in this repo.
- No Nightwatch-owned database or SQL migrations in repo today; persistence is via Base44 SDK.
- New auth models must be stored somewhere: either **new Base44 custom entities** (e.g. NwAuthUser, NwAuthSession, NwAuthPasswordResetToken, NwAuthEvent) or a future Nightwatch database. This phase will use **custom entities with prefixed names** to avoid clashing with Base44’s built-in User.

## What Must Not Change in This Phase

- Existing live Base44 auth flow (Layout, AuthContext, login redirect, token).
- Existing invitation flow behavior (AdminInvitations, ensureSmokeUser, invite links).
- NW-074 selector work; engagement, risk, control, audit, reporting, testing modules.
- Any production auth behavior (who can log in remains Base44 + invitation).

## Security Rules (Design + Implementation)

- Never store plaintext passwords; password_hash only (nullable for pending).
- Never store plaintext session or reset tokens; token_hash only.
- password_hash and mfa_secret must never be returned in admin UI or API responses.
- AuthEvent append-only in application behavior (no update/delete).
- No login or cutover logic; no trusting client-side role without admin authorization.
- Prepare for server-side session model; no JWT-only shortcuts.

## Verdict

Proceed to REVIEW to define exact schema, admin UI changes, event logging plan, and rollback path. Implementation only after REVIEW is complete.
