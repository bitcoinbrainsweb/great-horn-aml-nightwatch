/**
 * NW-UPGRADE-076F-CLOSEOUT: Post-sunset auth smoke test.
 * Verifies Nightwatch login, protected routes, CSRF, and logout.
 * Writes docs/NW-UPGRADE-076F-SMOKETEST_RESULT.md and (on full pass) docs/NW-UPGRADE-076F_GATE.md.
 *
 * Usage:
 *   BASE_URL=http://localhost:5173 NW_TEST_EMAIL=... NW_TEST_PASSWORD=... npx tsx tests/postSunsetAuthSmokeTest.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || process.env.VITE_BASE44_APP_BASE_URL || 'http://localhost:5173';
const NW_EMAIL = process.env.NW_TEST_EMAIL || 'smoke@nightwatch.test';
const NW_PASSWORD = process.env.NW_TEST_PASSWORD || '';

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, '');
}

function url(pathSeg: string): string {
  const base = stripTrailingSlash(BASE_URL);
  const p = pathSeg.startsWith('/') ? pathSeg : `/${pathSeg}`;
  return `${base}${p}`;
}

function getSetCookieValues(res: Response): string[] {
  const getSetCookie = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getSetCookie === 'function') return getSetCookie.call(res.headers);
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
}

function parseCookieValue(setCookie: string, name: string): string | null {
  const prefix = name + '=';
  const start = setCookie.indexOf(prefix);
  if (start === -1) return null;
  const valueStart = start + prefix.length;
  const end = setCookie.indexOf(';', valueStart);
  return (end === -1 ? setCookie.slice(valueStart) : setCookie.slice(valueStart, end)).trim();
}

function extractSessionAndCsrf(res: Response): {
  sessionCookie: string | null;
  csrfToken: string | null;
  cookieHeader: string;
} {
  const setCookies = getSetCookieValues(res);
  let nwSession: string | null = null;
  let nwCsrf: string | null = null;
  for (const sc of setCookies) {
    const s = parseCookieValue(sc, 'nw_session');
    const c = parseCookieValue(sc, 'nw_csrf_token');
    if (s) nwSession = s;
    if (c) nwCsrf = c;
  }
  const parts = [nwSession != null && `nw_session=${nwSession}`, nwCsrf != null && `nw_csrf_token=${nwCsrf}`].filter(Boolean);
  return {
    sessionCookie: nwSession,
    csrfToken: nwCsrf,
    cookieHeader: parts.length ? parts.join('; ') : (nwSession != null ? `nw_session=${nwSession}` : ''),
  };
}

function docsPath(relative: string): string {
  return path.join(process.cwd(), 'docs', relative);
}

async function run(): Promise<void> {
  const checks: { name: string; pass: boolean }[] = [];
  let cookieHeader = '';
  let csrfToken: string | null = null;

  console.log('NW-076F-CLOSEOUT: Post-sunset auth smoke test');
  console.log('BASE_URL:', BASE_URL);
  console.log('');

  // 1. Nightwatch login issues session cookie
  try {
    const loginRes = await fetch(url('/prod/nwAuthLogin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: NW_EMAIL, password: NW_PASSWORD }),
      redirect: 'manual',
    });
    await loginRes.json().catch(() => ({}));
    const extracted = extractSessionAndCsrf(loginRes);
    cookieHeader = extracted.cookieHeader;
    csrfToken = extracted.csrfToken;
    const loginOk = loginRes.ok && extracted.sessionCookie != null;
    checks.push({ name: 'login', pass: loginOk });
    if (!loginOk) console.error('  Login failed or no session cookie');
  } catch (e) {
    checks.push({ name: 'login', pass: false });
    console.error('  Login error:', e);
  }

  // 2. Protected route works with session cookie
  if (cookieHeader) {
    try {
      const meRes = await fetch(url('/prod/nwAuthMe'), {
        method: 'GET',
        headers: { Cookie: cookieHeader },
      });
      const meBody = await meRes.json().catch(() => ({}));
      const protectedOk = meRes.ok && !!meBody.user;
      checks.push({ name: 'protected_route', pass: protectedOk });
      if (!protectedOk) console.error('  nwAuthMe failed or no user');
    } catch (e) {
      checks.push({ name: 'protected_route', pass: false });
      console.error('  nwAuthMe error:', e);
    }
  } else {
    checks.push({ name: 'protected_route', pass: false });
  }

  // 3. Write request with valid CSRF succeeds
  if (cookieHeader && csrfToken) {
    try {
      const createRes = await fetch(url('/prod/createEngagement'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ name: '076F smoke test engagement' }),
      });
      const csrfValidOk = createRes.ok;
      checks.push({ name: 'csrf_valid_write', pass: csrfValidOk });
      if (!csrfValidOk) console.error('  createEngagement with CSRF returned', createRes.status);
    } catch (e) {
      checks.push({ name: 'csrf_valid_write', pass: false });
      console.error('  createEngagement error:', e);
    }
  } else {
    checks.push({
      name: 'csrf_valid_write',
      pass: false,
    });
    if (!csrfToken) console.error('  No CSRF token from login; cannot test valid write');
  }

  // 4. Write request with invalid/missing CSRF returns 403
  if (cookieHeader) {
    try {
      const noCsrfRes = await fetch(url('/prod/createEngagement'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
        body: JSON.stringify({ name: '076F smoke no csrf' }),
      });
      const csrfInvalidOk = noCsrfRes.status === 403;
      checks.push({ name: 'csrf_invalid_write', pass: csrfInvalidOk });
      if (!csrfInvalidOk) console.error('  Expected 403 without CSRF, got', noCsrfRes.status);
    } catch (e) {
      checks.push({ name: 'csrf_invalid_write', pass: false });
      console.error('  Write without CSRF error:', e);
    }
  } else {
    checks.push({ name: 'csrf_invalid_write', pass: false });
  }

  // 5. Logout clears session and protected endpoint returns 401
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
      const logoutOk = logoutRes.ok;
      if (!logoutOk) {
        checks.push({ name: 'logout_401', pass: false });
        console.error('  Logout failed', logoutRes.status);
      } else {
        const meAfterRes = await fetch(url('/prod/nwAuthMe'), {
          method: 'GET',
          headers: { Cookie: cookieHeader },
        });
        const afterOk = meAfterRes.status === 401;
        checks.push({ name: 'logout_401', pass: afterOk });
        if (!afterOk) console.error('  After logout expected 401, got', meAfterRes.status);
      }
    } catch (e) {
      checks.push({ name: 'logout_401', pass: false });
      console.error('  Logout or nwAuthMe error:', e);
    }
  } else {
    checks.push({ name: 'logout_401', pass: false });
  }

  // Map to result format: login check, protected route check, csrf valid write, csrf invalid write, logout + 401
  const labels: Record<string, string> = {
    login: 'login check',
    protected_route: 'protected route check',
    csrf_valid_write: 'csrf valid write',
    csrf_invalid_write: 'csrf invalid write',
    logout_401: 'logout + 401 check',
  };
  const lines: string[] = [
    '# NW-UPGRADE-076F — Smoke Test Result',
    '',
    `* ${labels.login}: ${checks[0]?.pass ? 'PASS' : 'FAIL'}`,
    `* ${labels.protected_route}: ${checks[1]?.pass ? 'PASS' : 'FAIL'}`,
    `* ${labels.csrf_valid_write}: ${checks[2]?.pass ? 'PASS' : 'FAIL'}`,
    `* ${labels.csrf_invalid_write}: ${checks[3]?.pass ? 'PASS' : 'FAIL'}`,
    `* ${labels.logout_401}: ${checks[4]?.pass ? 'PASS' : 'FAIL'}`,
    '',
  ];
  const allPass = checks.length === 5 && checks.every((c) => c.pass);
  if (allPass) lines.push('SMOKE TEST: PASS');
  else lines.push('SMOKE TEST: FAIL');

  const resultPath = docsPath('NW-UPGRADE-076F-SMOKETEST_RESULT.md');
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, lines.join('\n'), 'utf8');
  console.log('Wrote', resultPath);

  if (allPass) {
    const date = new Date().toISOString();
    const gateLines = [
      '# NW-UPGRADE-076F — Gate',
      '',
      'BUILD: NW-UPGRADE-076F',
      `DATE: ${date}`,
      'SMOKE TEST: PASS',
      'CHECKLIST: 5/5 passed',
      'VERDICT: GO',
      '',
    ];
    const gatePath = docsPath('NW-UPGRADE-076F_GATE.md');
    fs.writeFileSync(gatePath, gateLines.join('\n'), 'utf8');
    console.log('Wrote', gatePath);
  }

  console.log('');
  console.log('--- Summary ---');
  checks.forEach((c, i) => {
    console.log(`${c.pass ? 'PASS' : 'FAIL'} ${labels[c.name] ?? c.name}`);
  });
  console.log('');
  console.log(allPass ? 'SMOKE TEST: PASS' : 'SMOKE TEST: FAIL');
  process.exit(allPass ? 0 : 1);
}

run().catch((e) => {
  console.error('Smoke test error:', e);
  process.exit(1);
});
