# NW-UPGRADE-075A — Smoke Test User Path + Admin User Management — SANITYCHECK

## Risk Level: MEDIUM

- Auth/access path change (allow smoke domain)
- New backend function (ensure smoke user)
- Admin UI changes (add/edit/delete users, password reset)

## Objective

1. Reliable dedicated smoke-test account (smoke@nightwatch.test / SmokeTest123!) for Browser Use.
2. Minimal admin user management: view, add (invite), edit (name/role), delete (with smoke protection), password reset.

## Current State

- **Auth**: Layout allows (1) platform admin (role === 'admin'), (2) allowed domains (greathornaml.com, libertylabs.ca, bitcoinbrains.com) + valid UserInvitation (Pending/Active). Users without invitation get access denied.
- **User creation**: Via UserInvitation (AdminInvitations). No direct User.create in SDK; Base44 uses invitation + registration flow.
- **AdminUsers**: Lists users, edit role only (no add, delete, name edit, password reset).
- **createTestAutomationUser.ts**: Creates invitation for tester@nightwatch.internal (read-only). Does not create user with password; user must complete registration.

## Constraints

- **No fake bypass**: Smoke account must use normal login (email/password).
- **Password**: Base44 does not expose server-side “create user with password”. User record is created when user registers (auth.register). So: ensure invitation exists → first-time registration with smoke@nightwatch.test / SmokeTest123! → thereafter login works.
- **Idempotent**: ensure-smoke-user logic must be safe to run repeatedly.

## Files to Change

| File | Purpose |
|------|--------|
| `functions/ensureSmokeUser.ts` | New. Idempotent: ensure UserInvitation for smoke@nightwatch.test (role admin, Active). Optionally check if User already exists. |
| `src/components/Layout.jsx` | Allow domain `nightwatch.test` (or email smoke@nightwatch.test) so smoke user passes domain check after login. |
| `src/pages/AdminUsers.jsx` | Add: Ensure smoke user button, Invite user (link/dialog), Edit name+role, Delete (disabled for smoke), Password reset (send email). |

## Smoke Account Flow

1. **Ensure**: Admin runs “Ensure smoke user” (or one-time setup) → backend ensures UserInvitation exists for smoke@nightwatch.test, role admin, status Active.
2. **First-time**: Someone completes registration (invite link or sign-up) with email smoke@nightwatch.test, password SmokeTest123! → User record created.
3. **Login**: Browser Use (or anyone) logs in with smoke@nightwatch.test / SmokeTest123! via normal login. Layout allows nightwatch.test so user is let in with valid invitation.

## Admin User Management

- **View**: Already present (User.list).
- **Add**: “Invite user” → navigate to AdminInvitations or inline invite (UserInvitation.create).
- **Edit**: Extend dialog to full_name + role; User.update(id, { full_name, role }).
- **Delete**: Button calling User.delete(id); hidden/disabled for smoke@nightwatch.test. (If SDK has no User.delete, document and hide button.)
- **Password reset**: “Send reset email” → base44.auth.resetPasswordRequest(user.email).

## What We Do Not Modify

- Core auth architecture (Base44)
- Login flow (redirectToLogin, loginViaEmailPassword)
- RBAC system
- NW-074 selectors

## Verdict

**MEDIUM RISK** — Proceed with implementation; create REVIEW only if high-risk items emerge. Delivering SANITYCHECK + RESULT as required.
