/**
 * NW-UPGRADE-039 — Shared risk/control coverage contract
 *
 * Minimal canonical semantics for coverage states. Use this helper so all
 * coverage logic (e.g. calculateRiskCoverage, coverage reports) aligns on
 * the same definitions. Does not change the data model.
 */

export const COVERAGE_STATUS = {
  UNCONTROLLED: 'UNCONTROLLED',
  NOT_TESTED: 'NOT_TESTED',
  INEFFECTIVE: 'INEFFECTIVE',
  PARTIALLY_COVERED: 'PARTIALLY_COVERED',
  COVERED: 'COVERED'
} as const;

export type CoverageStatus = (typeof COVERAGE_STATUS)[keyof typeof COVERAGE_STATUS];

/**
 * Returns the canonical coverage status given counts.
 * - UNCONTROLLED: no mapped controls
 * - NOT_TESTED: has controls but none tested
 * - INEFFECTIVE: all tested controls ineffective
 * - PARTIALLY_COVERED: some effective, some not or not tested
 * - COVERED: all mapped controls tested and effective
 */
export function resolveCoverageStatus(
  totalControls: number,
  testedControls: number,
  effectiveControls: number
): CoverageStatus {
  if (totalControls === 0) {
    return COVERAGE_STATUS.UNCONTROLLED;
  }
  if (testedControls === 0) {
    return COVERAGE_STATUS.NOT_TESTED;
  }
  if (effectiveControls === 0) {
    return COVERAGE_STATUS.INEFFECTIVE;
  }
  if (effectiveControls >= totalControls) {
    return COVERAGE_STATUS.COVERED;
  }
  return COVERAGE_STATUS.PARTIALLY_COVERED;
}
