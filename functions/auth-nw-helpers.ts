/**
 * NW-UPGRADE-076B: Shared helpers for Nightwatch auth (token hash, lockout constants).
 * Token: store hash only; use SHA-256 for session token lookup.
 */

export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_MINUTES = 15;
export const SESSION_EXPIRY_DAYS = 7;

/** Generate a secure random session token (base64url). */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Hash session token for storage/lookup (SHA-256 hex). */
export async function hashSessionToken(token: string): Promise<string> {
  const enc = new TextEncoder().encode(token);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Session expiry from now. */
export function sessionExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_EXPIRY_DAYS);
  return d.toISOString();
}

/** Locked until (now + LOCKOUT_MINUTES). */
export function lockedUntil(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + LOCKOUT_MINUTES);
  return d.toISOString();
}
