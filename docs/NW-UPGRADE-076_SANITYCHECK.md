# NW-UPGRADE-076 — Auth System Replacement Review — SANITYCHECK

## Risk Level: HIGH

This upgrade is **review/design only**. No implementation in this step.

## Objective

Review and plan the replacement of Nightwatch’s current Base44 invitation-based auth/user system with a Nightwatch-controlled access system that supports admin-created users, direct password auth, server-side sessions, append-only auth event logging, and Google OAuth for pre-provisioned users only.

## Why Replacement

- Admin cannot deterministically create users (invitation-only).
- Smoke test user provisioning is brittle (invite link, no direct password).
- Invitation lifecycle is not fully admin-operable.
- No clean path to direct password provisioning.
- No strong foundation for future MFA / Google auth.
- Not the right long-term access model for a compliance platform.

## Approved Direction (Phase 1 Target)

- Nightwatch-controlled user access.
- Admin-created users; direct password auth; server-side sessions.
- Append-only auth event logging.
- Google OAuth only for pre-provisioned users (email match, no auto-provisioning).
- No self-service signup; no invitation dependency for core provisioning.

## Current Auth Boundary (Summary)

- **Token source**: `appParams.token` (URL param or storage); Base44 SDK manages login redirect and token.
- **Frontend**: `base44.auth.isAuthenticated()`, `base44.auth.me()`, `base44.auth.redirectToLogin()`, `base44.auth.logout()`, `base44.auth.updateMe()`, `base44.auth.resetPasswordRequest()`.
- **Layout**: After `me` from `base44.auth.me()`, applies domain allowlist, UserInvitation check, role sync from invitation; sets `user` for UI.
- **Backend**: Functions use `createClientFromRequest(req)`; `base44.auth.me()` returns caller; role checks `['admin','super_admin'].includes(user.role)` (and variants) in 40+ functions.
- **Entities**: `User`, `UserInvitation` (Base44-managed). Frontend uses `base44.entities.User.list/update/delete`, `UserInvitation.list/create/update`.

## Scope of Review (No Code Changes)

1. Map current auth boundary and every place auth/role checks occur.
2. Identify smallest durable replacement architecture.
3. Produce phased implementation plan.
4. Answer: Cursor-only path? Affected files? Safe auth boundary first? Migration? Rollback? Security guards? Phase 2 deferrals?
5. Document session handling, password hashing, auth event integrity, Google OAuth email-match-only, smoke-user path after replacement.

## What Is Not Modified in This Step

- Risk/control data models, engagement models, testing infrastructure, NW-074 selectors, unrelated admin/reporting modules.
- **No production behavior change** until review is complete and implementation is approved.

## Non-Negotiable Security Rules (Design Must Respect)

- Never store plaintext passwords; bcrypt only.
- Never store plaintext session or reset tokens.
- Never put session tokens in URLs.
- Never trust client-supplied role; authorization from server-side session only.
- Rate limit login and reset endpoints.
- Auth event log append-only.
- No OAuth auto-provisioning.

## Verdict

**HIGH RISK** — Review and REVIEW document required. Implementation only after explicit approval; this step produces SANITYCHECK, REVIEW, and RESULT only.
