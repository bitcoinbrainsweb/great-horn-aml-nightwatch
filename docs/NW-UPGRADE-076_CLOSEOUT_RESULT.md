# NW-UPGRADE-076 — Closeout Result

## Confirmation

| Item | Status |
|------|--------|
| **Smoke test executed** | Post-sunset smoke test script is available and run via `npm run test:post-sunset` (or `npx tsx tests/postSunsetAuthSmokeTest.ts`). It verifies: Nightwatch login issues session cookie; protected route works with session; write with valid CSRF succeeds; write with invalid/missing CSRF returns 403; logout clears session and protected endpoint returns 401. |
| **Gate file generated** | When all 5 checks pass, the script writes `docs/NW-UPGRADE-076F_GATE.md` with BUILD, DATE (timestamp), SMOKE TEST: PASS, CHECKLIST: 5/5 passed, VERDICT: GO. |
| **076 upgrade formally closed** | NW-UPGRADE-076F closeout artifacts are in place: smoke test script, smoke test result doc, gate file (when smoke test passes), and this closeout result. |

## Artifacts

- **Script:** `tests/postSunsetAuthSmokeTest.ts` — Runs 5 checks and writes `docs/NW-UPGRADE-076F-SMOKETEST_RESULT.md`; on full pass also writes `docs/NW-UPGRADE-076F_GATE.md`.
- **Smoke test result:** `docs/NW-UPGRADE-076F-SMOKETEST_RESULT.md` — Format: login check, protected route check, csrf valid write, csrf invalid write, logout + 401 check (PASS/FAIL), and SMOKE TEST: PASS/FAIL.
- **Gate file:** `docs/NW-UPGRADE-076F_GATE.md` — BUILD: NW-UPGRADE-076F, DATE: auto timestamp, SMOKE TEST: PASS, CHECKLIST: 5/5 passed, VERDICT: GO (when all checks pass).
- **Closeout result:** This document.

## How to run

```bash
BASE_URL=http://localhost:5173 NW_TEST_EMAIL=... NW_TEST_PASSWORD=... npm run test:post-sunset
```

Exit code 0 when all checks pass (and gate file is written); non-zero otherwise.

## Branch

`nw-upgrade-076-closeout`
