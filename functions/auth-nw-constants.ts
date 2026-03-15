/**
 * NW-UPGRADE-076A: Centralized role and status enums for Nightwatch auth.
 * Single source of truth for NwAuthUser role and status.
 */

export const NW_AUTH_ROLES = [
  'admin',
  'super_admin',
  'compliance_admin',
  'analyst',
  'reviewer',
  'viewer',
  'test_automation',
] as const;

export type NwAuthRole = (typeof NW_AUTH_ROLES)[number];

export const NW_AUTH_STATUSES = ['pending', 'active', 'disabled'] as const;

export type NwAuthStatus = (typeof NW_AUTH_STATUSES)[number];

export function isNwAuthRole(r: string): r is NwAuthRole {
  return (NW_AUTH_ROLES as readonly string[]).includes(r);
}

export function isNwAuthStatus(s: string): s is NwAuthStatus {
  return (NW_AUTH_STATUSES as readonly string[]).includes(s);
}
