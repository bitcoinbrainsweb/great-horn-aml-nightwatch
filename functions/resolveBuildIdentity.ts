/**
 * Shared build identity resolver — NW-UPGRADE-045A
 *
 * Returns the current build / upgrade label by querying UpgradeRegistry
 * for the most recently created entry. This is the single canonical source
 * for "what build is currently deployed," used by both verifyLatestBuild
 * and BuildVerificationDashboard so the label never drifts or goes stale.
 *
 * Fallback: if UpgradeRegistry is empty or unreachable, returns a clearly
 * marked unknown label so callers can decide how to proceed.
 */

export interface BuildIdentity {
  build_label: string;
  product_version: string;
  source: 'UpgradeRegistry' | 'fallback';
}

const FALLBACK_IDENTITY: BuildIdentity = {
  build_label: 'UNKNOWN',
  product_version: 'UNKNOWN',
  source: 'fallback'
};

export async function resolveBuildIdentity(base44: any): Promise<BuildIdentity> {
  try {
    const entries = await base44.asServiceRole.entities.UpgradeRegistry.list(
      '-created_date',
      1
    );

    if (entries.length === 0) {
      return FALLBACK_IDENTITY;
    }

    const latest = entries[0];
    return {
      build_label: latest.upgrade_id || 'UNKNOWN',
      product_version: latest.product_version || 'UNKNOWN',
      source: 'UpgradeRegistry'
    };
  } catch {
    return FALLBACK_IDENTITY;
  }
}
