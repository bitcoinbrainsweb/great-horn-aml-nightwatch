/**
 * NW-UPGRADE-076A / 076F-PHASE2: Nightwatch roles only (admin, operator, viewer, auditor).
 * Must stay in sync with functions/auth-nw-constants.ts.
 */

export const NW_AUTH_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operator' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'auditor', label: 'Auditor' },
];

export const NW_AUTH_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
];
