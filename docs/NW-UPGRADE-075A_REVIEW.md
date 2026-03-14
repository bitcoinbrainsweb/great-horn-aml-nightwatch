# NW-UPGRADE-075A — REVIEW (Medium Risk)

## Summary

- **Smoke account**: Backend `ensureSmokeUser` ensures Active invitation for smoke@nightwatch.test (role admin). Layout allows domain `nightwatch.test`. First-time: complete registration with SmokeTest123!; then login works.
- **Admin users**: Invite (link to AdminInvitations), Edit (name + role), Delete (disabled for smoke), Password reset (send email), Ensure smoke user button.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| User.delete not allowed by Base44 | Error shown in UI; smoke user cannot be deleted (button hidden). |
| resetPasswordRequest may require specific permissions | Wrapped in try/catch; error shown. |
| Allowing nightwatch.test broadens domain allowlist | Only one known use (smoke account); invitation still required. |

## Rollback

- Revert Layout.jsx (remove nightwatch.test from allowed).
- Remove ensureSmokeUser.ts; remove AdminUsers additions (restore original edit-role-only + no delete/reset/ensure).
- No change to core auth or RBAC.
