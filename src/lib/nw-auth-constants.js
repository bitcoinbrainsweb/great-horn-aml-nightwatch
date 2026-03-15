/**
 * NW-UPGRADE-076A: Centralized role and status options for Nightwatch auth (UI).
 * Must stay in sync with functions/auth-nw-constants.ts.
 */

export const NW_AUTH_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Technical Admin' },
  { value: 'compliance_admin', label: 'Compliance Admin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'test_automation', label: 'Test Automation (Read-Only)' },
];

export const NW_AUTH_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
];
