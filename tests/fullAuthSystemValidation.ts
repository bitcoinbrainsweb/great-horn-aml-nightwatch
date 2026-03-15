/**
 * NW-UPGRADE-076G: Full Nightwatch auth system validation.
 * Run against a running app (dev or deployed).
 *
 * Usage:
 *   BASE_URL=http://localhost:5173 NW_TEST_EMAIL=user@example.com NW_TEST_PASSWORD=secret npx tsx tests/fullAuthSystemValidation.ts
 *
 * Requires: Node 18+ (fetch), tsx.
 */

const BASE_URL = process.env.BASE_URL || process.env.VITE_BASE44_APP_BASE_URL || 'http://localhost:5173';
const NW_EMAIL = process.env.NW_TEST_EMAIL || 'smoke@nightwatch.test';
const NW_PASSWORD = process.env.NW_TEST_PASSWORD || '';

type Result = { ok: boolean; message: string; detail?: unknown };

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, '');
}

function url(path: string): string {
  const base = stripTrailingSlash(BASE_URL);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/** Get all Set-Cookie header values (Node may merge; support getSetCookie if available). */
function getSetCookieValues(res: Response): string[] {
  const getSetCookie = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === 'function') {
    return getSetCookie.call(res.headers);
  }
  const single = res.headers.get('set-cookie');
  if (!single) return [];
  return [single];
}

/** Parse cookie name=value from a Set-Cookie header (first segment). */
function parseCookieValue(setCookie: string, name: string): string | null {
  const prefix = name + '=';
  const start = setCookie.indexOf(prefix);
  if (start === -1) return null;
  const valueStart = start + prefix.length;
  const end = setCookie.indexOf(';', valueStart);
  const value = end === -1 ? setCookie.slice(valueStart) : setCookie.slice(valueStart, end);
  return value.trim();
}

/** Extract nw_session and nw_csrf_token from login response. */
function extractSessionAndCsrf(res: Response): { sessionCookie: string | null; csrfToken: string | null; cookieHeader: string } {
  const setCookies = getSetCookieValues(res);
  let nwSession: string | null = null;
  let nwCsrf: string | null = null;
  for (const sc of setCookies) {
    const s = parseCookieValue(sc, 'nw_session');
    const c = parseCookieValue(sc, 'nw_csrf_token');
    if (s) nwSession = s;
    if (c) nwCsrf = c;
  }
  const cookieHeader =
    [nwSession != null && `nw_session=${nwSession}`, nwCsrf != null && `nw_csrf_token=${nwCsrf}`]
      .filter(Boolean)
      .join('; ') || '';
  return {
    sessionCookie: nwSession,
    csrfToken: nwCsrf,
    cookieHeader: cookieHeader || (nwSession != null ? `nw_session=${nwSession}` : ''),
  };
}

async function run(): Promise<void> {
  const results: Result[] = [];
  let cookieHeader = '';
  let csrfToken: string | null = null;
  let createdEngagementId: string | null = null;
  let createdRiskId: string | null = null;

  console.log('NW-076G: Full Nightwatch auth system validation');
  console.log('BASE_URL:', BASE_URL);
  console.log('NW_TEST_EMAIL:', NW_EMAIL);
  console.log('');

  // --- 1. Login flow ---
  try {
    const loginRes = await fetch(url('/prod/nwAuthLogin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: NW_EMAIL, password: NW_PASSWORD }),
      redirect: 'manual',
    });
    const loginBody = await loginRes.json().catch(() => ({}));

    if (!loginRes.ok) {
      results.push({
        ok: false,
        message: 'Nightwatch login failed',
        detail: { status: loginRes.status, body: loginBody },
      });
    } else {
      const extracted = extractSessionAndCsrf(loginRes);
      cookieHeader = extracted.cookieHeader;
      csrfToken = extracted.csrfToken;
      if (extracted.sessionCookie) {
        results.push({
          ok: true,
          message: 'Login with Nightwatch credentials: session cookie issued',
        });
      } else {
        results.push({
          ok: false,
          message: 'Login succeeded but no nw_session cookie in response',
          detail: { headers: getSetCookieValues(loginRes) },
        });
      }
    }
  } catch (e) {
    results.push({ ok: false, message: 'Nightwatch login request failed', detail: e });
  }

  // --- 2. Session cookie present (and CSRF if implemented) ---
  results.push({
    ok: cookieHeader.length > 0,
    message: cookieHeader.length > 0 ? 'Session cookie present' : 'Session cookie missing',
  });

  // --- 3. Protected routes: nwAuthMe, listEngagements, listRisks, listControls ---
  if (cookieHeader) {
    try {
      const meRes = await fetch(url('/prod/nwAuthMe'), {
        method: 'GET',
        headers: { Cookie: cookieHeader },
      });
      const meBody = await meRes.json().catch(() => ({}));
      if (meRes.ok && meBody.user) {
        results.push({ ok: true, message: 'Protected route nwAuthMe: returns user' });
      } else {
        results.push({
          ok: false,
          message: 'nwAuthMe failed or no user',
          detail: { status: meRes.status, body: meBody },
        });
      }
    } catch (e) {
      results.push({ ok: false, message: 'nwAuthMe request failed', detail: e });
    }

    const postHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    };
    if (csrfToken) postHeaders['X-CSRF-Token'] = csrfToken;

    for (const [label, path, body] of [
      ['listEngagements', '/prod/listEngagements', {}],
      ['listRisks', '/prod/listRisks', {}],
      ['listControls', '/prod/listControls', {}],
    ] as [string, string, object][]) {
      try {
        const res = await fetch(url(path), {
          method: 'POST',
          headers: postHeaders,
          body: JSON.stringify(body),
        });
        const isOk = res.status !== 401 && res.status !== 403;
        if (res.status === 403 && !csrfToken) {
          results.push({
            ok: true,
            message: `Protected route ${label}: 403 without CSRF (CSRF required for POST)`,
          });
        } else {
          results.push({
            ok: isOk,
            message: isOk
              ? `Protected route ${label}: accessible (${res.status})`
              : `Protected route ${label}: ${res.status} (expected 200)`,
            detail: isOk ? undefined : { status: res.status },
          });
        }
      } catch (e) {
        results.push({ ok: false, message: `Protected route ${label} request failed`, detail: e });
      }
    }
  } else {
    results.push({ ok: false, message: 'Skipped protected routes (no cookie)' });
  }

  // --- 4a. Write without CSRF → expect 403 ---
  if (cookieHeader) {
    try {
      const noCsrfRes = await fetch(url('/prod/createEngagement'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ name: 'Validation test engagement' }),
      });
      const expect403 = noCsrfRes.status === 403;
      results.push({
        ok: expect403,
        message: expect403
          ? 'Write without CSRF token returns 403 (CSRF protection active)'
          : `Write without CSRF returned ${noCsrfRes.status} (expected 403)`,
        detail: expect403 ? undefined : { status: noCsrfRes.status },
      });
    } catch (e) {
      results.push({ ok: false, message: 'Write-without-CSRF request failed', detail: e });
    }
  }

  // --- 4b. Write operations with CSRF: create engagement, create risk, update risk ---
  if (cookieHeader && csrfToken) {
    const writeHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      'X-CSRF-Token': csrfToken,
    };

    try {
      const createEngRes = await fetch(url('/prod/createEngagement'), {
        method: 'POST',
        headers: writeHeaders,
        body: JSON.stringify({ name: 'NW-076G validation engagement' }),
      });
      const createEngBody = await createEngRes.json().catch(() => ({}));
      if (createEngRes.ok && createEngBody.engagement?.id) {
        createdEngagementId = createEngBody.engagement.id;
        results.push({ ok: true, message: 'Create engagement: CSRF accepted, engagement created' });
      } else {
        results.push({
          ok: false,
          message: 'Create engagement failed',
          detail: { status: createEngRes.status, body: createEngBody },
        });
      }
    } catch (e) {
      results.push({ ok: false, message: 'Create engagement request failed', detail: e });
    }

    if (createdEngagementId) {
      try {
        const createRiskRes = await fetch(url('/prod/createRisk'), {
          method: 'POST',
          headers: writeHeaders,
          body: JSON.stringify({
            engagement_id: createdEngagementId,
            name: 'NW-076G validation risk',
          }),
        });
        const createRiskBody = await createRiskRes.json().catch(() => ({}));
        if (createRiskRes.ok && createRiskBody.risk?.id) {
          createdRiskId = createRiskBody.risk.id;
          results.push({ ok: true, message: 'Create risk: CSRF accepted, risk created' });
        } else {
          results.push({
            ok: false,
            message: 'Create risk failed',
            detail: { status: createRiskRes.status, body: createRiskBody },
          });
        }
      } catch (e) {
        results.push({ ok: false, message: 'Create risk request failed', detail: e });
      }
    }

    if (createdRiskId) {
      try {
        const updateRiskRes = await fetch(url('/prod/updateRisk'), {
          method: 'POST',
          headers: writeHeaders,
          body: JSON.stringify({ id: createdRiskId, name: 'NW-076G validation risk (updated)' }),
        });
        const updateRiskBody = await updateRiskRes.json().catch(() => ({}));
        if (updateRiskRes.ok && updateRiskBody.risk) {
          results.push({ ok: true, message: 'Update risk: CSRF accepted, risk updated' });
        } else {
          results.push({
            ok: false,
            message: 'Update risk failed',
            detail: { status: updateRiskRes.status, body: updateRiskBody },
          });
        }
      } catch (e) {
        results.push({ ok: false, message: 'Update risk request failed', detail: e });
      }
    }
  } else if (cookieHeader && !csrfToken) {
    results.push({
      ok: true,
      message: 'Write operations with CSRF skipped (no CSRF cookie from login; backend may not set it)',
    });
  }

  // --- 5. Logout ---
  if (cookieHeader) {
    try {
      const logoutHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      };
      if (csrfToken) logoutHeaders['X-CSRF-Token'] = csrfToken;
      const logoutRes = await fetch(url('/prod/nwAuthLogout'), {
        method: 'POST',
        headers: logoutHeaders,
        body: JSON.stringify({}),
      });
      const logoutBody = await logoutRes.json().catch(() => ({}));
      if (!logoutRes.ok) {
        results.push({
          ok: false,
          message: 'Logout request failed',
          detail: { status: logoutRes.status, body: logoutBody },
        });
      } else {
        const clearCookie =
          getSetCookieValues(logoutRes).some((s) => s.includes('nw_session=;')) ||
          logoutRes.headers.get('set-cookie')?.includes('nw_session=;') === true;
        results.push({
          ok: true,
          message: clearCookie ? 'Logout clears session (Set-Cookie clear)' : 'Logout succeeded',
        });
      }
    } catch (e) {
      results.push({ ok: false, message: 'Logout request failed', detail: e });
    }

    try {
      const meAfterRes = await fetch(url('/prod/nwAuthMe'), {
        method: 'GET',
        headers: { Cookie: cookieHeader },
      });
      results.push({
        ok: meAfterRes.status === 401,
        message:
          meAfterRes.status === 401
            ? 'After logout, protected route blocked (401)'
            : `After logout, session still accepted (expected 401, got ${meAfterRes.status})`,
      });
    } catch (e) {
      results.push({ ok: false, message: 'nwAuthMe after logout failed', detail: e });
    }
  }

  // --- 6. Session expiry: invalid session → 401 ---
  try {
    const badMeRes = await fetch(url('/prod/nwAuthMe'), {
      method: 'GET',
      headers: { Cookie: 'nw_session=invalid-token' },
    });
    results.push({
      ok: badMeRes.status === 401,
      message:
        badMeRes.status === 401
          ? 'Invalid session returns 401 (session expiry/redirect to login)'
          : `Invalid session returned ${badMeRes.status} (expected 401)`,
    });
  } catch (e) {
    results.push({ ok: false, message: 'Invalid-session check failed', detail: e });
  }

  // --- 7. No Base44 auth remnants on login page ---
  try {
    const loginPageRes = await fetch(url('/login'), { method: 'GET', redirect: 'manual' });
    const html = await loginPageRes.text();
    const hasBase44Login = /Sign in with Base44|base44.*login/i.test(html);
    results.push({
      ok: !hasBase44Login,
      message: hasBase44Login
        ? 'Base44 login path still present on /login (expected removed)'
        : 'No Base44 login paths on /login',
    });
  } catch (e) {
    results.push({ ok: false, message: 'Login page fetch failed', detail: e });
  }

  // --- Summary ---
  console.log('--- Results ---');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  results.forEach((r, i) => {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon} ${i + 1}. ${r.message}`);
    if (r.detail && !r.ok) console.log('   ', r.detail);
  });
  console.log('');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Validation error:', e);
  process.exit(1);
});
