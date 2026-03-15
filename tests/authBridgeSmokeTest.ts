/**
 * NW-UPGRADE-076E-SANITYTEST: Automated bridge validation.
 * Run against a running app (dev or deployed).
 *
 * Usage:
 *   BASE_URL=http://localhost:5173 NW_TEST_EMAIL=user@example.com NW_TEST_PASSWORD=secret npx tsx tests/authBridgeSmokeTest.ts
 *
 * Requires: Node 18+ (fetch), tsx (or run via ts-node).
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

/** Extract first Set-Cookie value for nw_session (or any single Set-Cookie). */
function getCookieFromResponse(res: Response): string | null {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/nw_session=([^;]*)/);
  if (match) return `nw_session=${match[1].trim()}`;
  return null;
}

async function run(): Promise<void> {
  const results: Result[] = [];
  let cookie: string | null = null;

  console.log('NW-076E-SANITYTEST: Auth bridge smoke test');
  console.log('BASE_URL:', BASE_URL);
  console.log('NW_TEST_EMAIL:', NW_EMAIL);
  console.log('');

  // 1. Login using Nightwatch credentials
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
      cookie = getCookieFromResponse(loginRes);
      if (cookie) {
        results.push({ ok: true, message: 'Nightwatch login works' });
      } else {
        results.push({
          ok: false,
          message: 'Nightwatch login succeeded but no session cookie in response',
          detail: { headers: Object.fromEntries(loginRes.headers.entries()) },
        });
      }
    }
  } catch (e) {
    results.push({ ok: false, message: 'Nightwatch login request failed', detail: e });
  }

  // 2. Confirm session cookie present (already checked above; repeat for clarity)
  results.push({
    ok: cookie !== null,
    message: cookie ? 'Session cookie present' : 'Session cookie missing (login may have failed)',
  });

  // 3. Confirm still authenticated (nwAuthMe with cookie)
  if (cookie) {
    try {
      const meRes = await fetch(url('/prod/nwAuthMe'), {
        method: 'GET',
        headers: { Cookie: cookie },
      });
      const meBody = await meRes.json().catch(() => ({}));
      if (meRes.ok && meBody.user) {
        results.push({ ok: true, message: 'Still authenticated after login (nwAuthMe returns user)' });
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
  } else {
    results.push({ ok: false, message: 'Skipped (no cookie)' });
  }

  // 4. Access protected route (listEngagements uses nwAuthMiddleware)
  if (cookie) {
    try {
      const listRes = await fetch(url('/prod/listEngagements'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({}),
      });
      if (listRes.status === 401) {
        results.push({ ok: false, message: 'Protected route returned 401 (auth not accepted)' });
      } else {
        results.push({
          ok: true,
          message: `Protected route accessible (status ${listRes.status})`,
        });
      }
    } catch (e) {
      results.push({ ok: false, message: 'Protected route request failed', detail: e });
    }
  } else {
    results.push({ ok: false, message: 'Skipped (no cookie)' });
  }

  // 5. Logout → confirm redirect/clear session
  if (cookie) {
    try {
      const logoutRes = await fetch(url('/prod/nwAuthLogout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
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
        const clearCookie = logoutRes.headers.get('set-cookie')?.includes('nw_session=;') ?? false;
        results.push({
          ok: true,
          message: clearCookie ? 'Logout clears session (Set-Cookie clear)' : 'Logout succeeded',
        });
      }
    } catch (e) {
      results.push({ ok: false, message: 'Logout request failed', detail: e });
    }

    // 5b. After logout, nwAuthMe should return 401
    try {
      const meAfterRes = await fetch(url('/prod/nwAuthMe'), {
        method: 'GET',
        headers: { Cookie: cookie },
      });
      results.push({
        ok: meAfterRes.status === 401,
        message: meAfterRes.status === 401 ? 'After logout, session invalid (401)' : 'After logout, session still accepted (expected 401)',
      });
    } catch (e) {
      results.push({ ok: false, message: 'nwAuthMe after logout failed', detail: e });
    }
  }

  // 6. NW-UPGRADE-076F-PHASE2: No Base44 login on /login (Nightwatch-only auth)
  try {
    const loginPageRes = await fetch(url('/login'), { method: 'GET', redirect: 'manual' });
    const html = await loginPageRes.text();
    const hasBase44Login = /Sign in with Base44|base44.*login/i.test(html);
    results.push({
      ok: !hasBase44Login,
      message: hasBase44Login ? 'Base44 login still on /login (expected removed)' : 'No Base44 login on /login',
    });
  } catch (e) {
    results.push({ ok: false, message: 'Login page fetch failed', detail: e });
  }

  // 7. Trigger 401 → API returns 401 (modal is frontend; script verifies API behaviour)
  try {
    const badMeRes = await fetch(url('/prod/nwAuthMe'), {
      method: 'GET',
      headers: { Cookie: 'nw_session=invalid-token' },
    });
    results.push({
      ok: badMeRes.status === 401,
      message:
        badMeRes.status === 401
          ? 'Invalid session returns 401 (session expired modal can be shown)'
          : `Invalid session returned ${badMeRes.status} (expected 401)`,
    });
  } catch (e) {
    results.push({ ok: false, message: '401 check request failed', detail: e });
  }

  // Summary
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
  console.error('Smoke test error:', e);
  process.exit(1);
});
