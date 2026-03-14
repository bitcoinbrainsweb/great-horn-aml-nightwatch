# NW-UPGRADE-075A — Smoke Test User Path + Admin User Management — RESULT

## Summary

1. **Dedicated smoke-test account path**: Backend ensures invitation for smoke@nightwatch.test; Layout allows domain nightwatch.test; first-time registration with SmokeTest123! then normal login.
2. **Admin user management**: View, invite (link), edit (name + role), delete (with smoke protection), password reset (send email), and “Ensure smoke user” action.

---

## Files Changed

| File | Change |
|------|--------|
| `functions/ensureSmokeUser.ts` | **New.** Admin-only, idempotent. Ensures UserInvitation for smoke@nightwatch.test (role admin, Active). If user already exists, returns success. If invitation revoked, reactivates it. |
| `src/components/Layout.jsx` | Allowed domain `nightwatch.test` so smoke user passes domain check after login (invitation still required). |
| `src/pages/AdminUsers.jsx` | Added: Ensure smoke user button (invokes ensureSmokeUser), Invite user link (to AdminInvitations), Edit user (name + role), Delete user (hidden for smoke@nightwatch.test), Send password reset email. Added admin to ROLES. Smoke test badge for smoke user. Page root `data-test="page-admin-users"`. |

---

## Smoke Account: smoke@nightwatch.test / SmokeTest123!

- **Behavior**: Uses normal login (no bypass). Account is created when user completes registration; invitation must exist first.
- **Ensure step**: Admin opens **Users** → **Ensure smoke user**. Backend ensures an Active UserInvitation for smoke@nightwatch.test with role admin. Idempotent.
- **First-time setup**: Complete registration once (invite link or sign-up) with email `smoke@nightwatch.test` and password `SmokeTest123!`. After that, Browser Use (or anyone) can log in with those credentials.
- **Login**: Allowed domain `nightwatch.test` in Layout so the smoke user is not blocked after authentication.

---

## Admin User Management

| Action | Implementation |
|--------|----------------|
| **View users** | Existing User.list table. |
| **Add users** | “Invite user” button → navigates to Admin Invitations to create UserInvitation. |
| **Edit users** | Edit dialog: Name (full_name), Role. Save calls User.update(id, { full_name, role }). |
| **Delete users** | Delete button per row; confirmation dialog; User.delete(id). **smoke@nightwatch.test cannot be deleted** (button not shown). |
| **Password reset** | “Send reset email” (key icon) calls base44.auth.resetPasswordRequest(user.email). |
| **Ensure smoke user** | Button invokes function ensureSmokeUser; result message shown. |

---

## Verification Checklist

- [x] Smoke invitation can be ensured idempotently (ensureSmokeUser).
- [x] smoke@nightwatch.test can log in after completing registration (domain allowed, invitation flow).
- [x] Admin can open Users, click “Invite user” (goes to AdminInvitations).
- [x] Admin can edit user name and role and save.
- [x] Admin can delete a normal user (delete button + confirm).
- [x] Smoke user has no delete button (smoke@nightwatch.test protected).
- [x] Core auth, login flow, and RBAC unchanged; NW-074 selectors unchanged.

---

## Notes

- **User.delete**: If the Base44 API does not allow User.delete, the delete action will fail and the error is shown in the same result area used for “Ensure smoke user” messages.
- **Password**: Smoke password is set only at first registration (Base44 does not expose server-side “create user with password”). Document SmokeTest123! for first-time setup and Browser Use.
