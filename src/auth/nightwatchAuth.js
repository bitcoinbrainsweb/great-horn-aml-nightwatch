/**
 * NW-UPGRADE-076E-PHASE2: Nightwatch auth service.
 * Login via POST nwAuthLogin (cookie session), logout, getCurrentUser via nwAuthMe.
 * All requests use credentials: 'include' so the HttpOnly cookie is sent and stored.
 */
import { appParams } from '@/lib/app-params';

function getBaseUrl() {
  if (typeof window === 'undefined') return '';
  return appParams?.appBaseUrl || window.location.origin;
}

function nwUrl(path) {
  const base = getBaseUrl().replace(/\/$/, '');
  const segment = path.startsWith('/') ? path : `/${path}`;
  return `${base}${segment}`;
}

/**
 * POST /nwAuthLogin with { email, password }. Session stored in HttpOnly cookie.
 * @returns { Promise<{ user: object, session_expires_at?: string }> }
 */
export async function login(email, password) {
  const url = nwUrl('/prod/nwAuthLogin');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: String(email).trim(), password: String(password) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'Login failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * POST /nwAuthLogout. Sends cookie; backend revokes session and clears cookie.
 */
export async function logout() {
  const url = nwUrl('/prod/nwAuthLogout');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data?.error || 'Logout failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * GET or POST /nwAuthMe. Uses cookie to return current user.
 * @returns { Promise<{ user: object } | null> } null if not authenticated.
 */
export async function getCurrentUser() {
  const url = nwUrl('/prod/nwAuthMe');
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (res.status === 401) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data?.user ? { user: data.user } : null;
}
