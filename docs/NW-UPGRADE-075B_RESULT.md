# NW-UPGRADE-075B — Smoke Invite Link Visibility + Registration Path Fix — RESULT

## Summary

Invitation links are now admin-visible: copy and open invite link for any Active/Pending invitation, plus dedicated smoke-user actions on both Admin Invitations and Admin Users. Admins can complete smoke registration without email delivery. Best-effort "User" column on Invitations shows Registered vs not.

---

## Files Changed

| File | Change |
|------|--------|
| `src/utils/inviteLink.js` | **New.** `buildInviteLink(invitation)` builds URL from `appBaseUrl` + `invitation_id` + `email` (+ optional `from_url`). |
| `src/pages/AdminInvitations.jsx` | Copy invite link + Open invite link for each Active/Pending row. Smoke-user banner with "Copy smoke invite link" and "Open smoke invite link" when smoke invitation exists. "User" column: Registered / — (by matching invitation email to User.list). |
| `src/pages/AdminUsers.jsx` | Load invitations with users. When smoke invitation exists, show "Copy smoke invite link" and "Open smoke invite link" next to Ensure smoke user. |

---

## Invitation Link Format

- **URL**: `{appBaseUrl}?invitation_id={id}&email={email}&from_url={currentOrigin}`
- **Source**: `appParams.appBaseUrl` (env: `VITE_BASE44_APP_BASE_URL`); fallback `window.location.origin`.
- If Base44 expects a different param (e.g. `invite_id`, `token`), adjust `buildInviteLink` in one place.

---

## Admin Flows

### Admin Invitations

- **Per row (Active or Pending)**: "Copy invite link" (clipboard), "Open invite link" (new tab). Pending rows keep Resend and Revoke.
- **Smoke banner**: When an invitation exists for `smoke@nightwatch.test` with status Active or Pending, a banner shows "Copy smoke invite link" and "Open smoke invite link" plus hint: complete registration with smoke@nightwatch.test / SmokeTest123! then log in normally.
- **User column**: Shows "Registered" if a user exists with that email, otherwise "—".

### Admin Users

- **Smoke actions**: After "Ensure smoke user" (or if the smoke invitation already exists), "Copy smoke invite link" and "Open smoke invite link" appear. Copy/Open use the same `buildInviteLink(smokeInvitation)`; invitations are loaded with users so the smoke invite is available when present.

---

## Verification

- [x] Active invitation link is admin-visible (Copy + Open on Admin Invitations for Active/Pending).
- [x] Admin can copy and open the smoke invite link (Admin Invitations banner + Admin Users buttons when smoke invitation exists).
- [x] Registration can be completed once by opening the link and signing up with smoke@nightwatch.test / SmokeTest123!
- [x] Smoke user can then log in normally (075A: domain nightwatch.test allowed, invitation flow unchanged).
- [x] Upgrade ID NW-UPGRADE-075B used in docs; no auth bypass; 075A and NW-074 preserved.

---

## What Was Not Modified

- Core auth architecture, login flow, RBAC.
- ensureSmokeUser, smoke-user protection, add/edit/delete user, password reset (075A).
- NW-074 selectors.
