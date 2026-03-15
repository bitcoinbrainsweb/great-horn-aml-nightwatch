# NW-UPGRADE-075B — Smoke Invite Link Visibility + Registration Path Fix — SANITYCHECK

## Risk Level: LOW

UI-only: expose invite link copy/open for admins. No auth bypass, no change to login/registration flow.

## Objective

Make the smoke-user registration path actually usable: admin can see and use the invitation link so smoke@nightwatch.test can complete registration (no email delivery needed).

## Current Problem

- 075A ensures an Active invitation for smoke@nightwatch.test.
- Admin UI does not show the invitation/registration link.
- smoke@nightwatch.test cannot receive email, so the account cannot complete registration without a visible link.

## Scope

- Extend Admin Invitations: for Active/Pending invitations, add admin-only "Copy invite link" and "Open invite link".
- Add smoke-user convenience: "Copy Smoke Invite Link" and/or "Open Smoke Invite Link" on Admin Users and/or Admin Invitations.
- Keep normal auth flow; preserve 075A work.

## Invitation Link Derivation

- Base44 auth uses `appBaseUrl` (from app-params / VITE_BASE44_APP_BASE_URL) for the login/signup host.
- Invitation record has `id`, `email`, `status`; no documented "invite_url" field in the codebase.
- **Assumption**: Registration URL is derivable as `appBaseUrl?invitation_id={id}&email={email}` (and optionally `&from_url=` for post-registration redirect). If the platform uses a different query param (e.g. `invite_id`, `token`), the link may need adjustment; admin can still copy and test.
- **Fallback**: If `appBaseUrl` is missing, use `window.location.origin` so the link points at least to the current app.

## Files to Change

| File | Change |
|------|--------|
| `src/utils/inviteLink.js` (or inline) | Build invite URL from invitation id + email + appBaseUrl. |
| `src/pages/AdminInvitations.jsx` | For Active/Pending rows: add "Copy link" and "Open link" actions. Optionally show "Smoke user" shortcut when smoke invitation exists. |
| `src/pages/AdminUsers.jsx` | Add "Copy Smoke Invite Link" and "Open Smoke Invite Link" (fetch smoke invitation if needed, or link to Invitations with hint). Prefer: fetch invitations, find smoke one, show copy/open. |

## Best-Effort: Invitation Metadata

- On Admin Invitations we already show Status (Pending / Active / Revoked).
- Optionally: for each invitation, show "User registered" if a User exists with that email (cross-check User.list). Small enhancement; can add if simple.

## What We Do Not Modify

- Core auth architecture, login flow, RBAC.
- ensureSmokeUser, smoke-user delete protection, 075A admin user improvements.
- NW-074 selectors.

## Verdict

**LOW RISK** — Proceed with implementation. No REVIEW file required.
