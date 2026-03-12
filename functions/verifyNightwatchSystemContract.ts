import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { ALLOWED_ARTIFACT_CLASSIFICATIONS } from './artifactClassifications.ts';

type CheckResult = {
  name: string;
  passed: boolean;
  details?: unknown;
};

type ContractResult = {
  success: boolean;
  checks: CheckResult[];
  warnings: string[];
  violations: string[];
};

async function collectArtifactClassificationCheck(base44: any): Promise<CheckResult & { violations: string[] }> {
  const allRecords = await base44.asServiceRole.entities.PublishedOutput.filter({});

  const seen = new Set<string>();
  const invalid: Set<string> = new Set();

  for (const rec of allRecords) {
    const cls = (rec.classification || '').toString() || 'unclassified';
    seen.add(cls);
    if (!ALLOWED_ARTIFACT_CLASSIFICATIONS.includes(cls as any)) {
      invalid.add(cls);
    }
  }

  const violations: string[] = [];
  if (invalid.size > 0) {
    invalid.forEach((cls) => {
      violations.push(`Invalid classification found: "${cls}"`);
    });
  }

  return {
    name: 'classifications_valid',
    passed: invalid.size === 0,
    details: {
      seen_classifications: Array.from(seen),
      invalid_classifications: Array.from(invalid)
    },
    violations
  };
}

async function collectWriterGatewayCheck(): Promise<CheckResult & { warnings: string[] }> {
  const warnings: string[] = [];

  const root = Deno.cwd();

  async function scanFile(path: string) {
    const content = await Deno.readTextFile(path);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('PublishedOutput.create(')) {
        // Allow occurrences inside the canonical gateway itself
        if (path.endsWith('publishCanonicalArtifact.ts')) {
          return;
        }
        warnings.push(
          `Direct PublishedOutput.create usage in ${path}:${index + 1}`
        );
      }
    });
  }

  async function scanDir(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const entryPath = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        await scanDir(entryPath);
      } else if (entry.isFile && entry.name.endsWith('.ts')) {
        await scanFile(entryPath);
      }
    }
  }

  await scanDir(root);

  return {
    name: 'artifact_writers_routed_through_gateway',
    passed: warnings.length === 0,
    details: {
      warnings
    },
    warnings
  };
}

async function collectVerificationMetadataCheck(base44: any): Promise<CheckResult & { violations: string[] }> {
  const records = await base44.asServiceRole.entities.PublishedOutput.filter({
    classification: 'verification_record',
    status: 'published'
  });

  const violations: string[] = [];

  for (const rec of records) {
    const missing: string[] = [];
    if (!rec.classification) missing.push('classification');
    if (!rec.published_at) missing.push('published_at');
    if (!rec.upgrade_id) missing.push('upgrade_id');
    if (!rec.product_version) missing.push('product_version');

    if (missing.length > 0) {
      violations.push(
        `Verification artifact ${rec.id} missing required fields: ${missing.join(', ')}`
      );
    }
  }

  return {
    name: 'verification_metadata_complete',
    passed: violations.length === 0,
    details: {
      total_verification_records: records.length,
      violations
    },
    violations
  };
}

async function collectVerificationVisibilityCheck(base44: any): Promise<CheckResult & { violations: string[] }> {
  const verificationRecords = await base44.asServiceRole.entities.PublishedOutput.filter({
    classification: 'verification_record',
    status: 'published'
  });

  // Simulate ChangeLog query filter for verification tab
  const changelogRecords = await base44.asServiceRole.entities.PublishedOutput.filter({
    status: 'published'
  });
  const changelogFiltered = changelogRecords.filter(
    (r: any) => r.classification === 'verification_record'
  );

  const changelogIds = new Set(changelogFiltered.map((r: any) => r.id));
  const violations: string[] = [];

  for (const rec of verificationRecords) {
    if (!changelogIds.has(rec.id)) {
      violations.push(
        `Verification artifact ${rec.id} is published but not visible in ChangeLog verification query`
      );
    }
  }

  return {
    name: 'verification_visible_in_changelog',
    passed: violations.length === 0,
    details: {
      total_verification_records: verificationRecords.length,
      verification_visible_in_changelog: verificationRecords.length - violations.length,
      violations
    },
    violations
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      const unauth: ContractResult = {
        success: false,
        checks: [],
        warnings: [],
        violations: ['Unauthorized']
      };
      return Response.json(unauth, { status: 401 });
    }

    // Restrict to Technical Admin roles
    if (!['admin', 'super_admin'].includes(user.role)) {
      const forbidden: ContractResult = {
        success: false,
        checks: [],
        warnings: [],
        violations: ['Forbidden: Technical Admin access required']
      };
      return Response.json(forbidden, { status: 403 });
    }

    const checks: CheckResult[] = [];
    const warnings: string[] = [];
    const violations: string[] = [];

    const classificationCheck = await collectArtifactClassificationCheck(base44);
    checks.push({
      name: classificationCheck.name,
      passed: classificationCheck.passed,
      details: classificationCheck.details
    });
    violations.push(...classificationCheck.violations);

    const writerCheck = await collectWriterGatewayCheck();
    checks.push({
      name: writerCheck.name,
      passed: writerCheck.passed,
      details: writerCheck.details
    });
    warnings.push(...writerCheck.warnings);

    const metadataCheck = await collectVerificationMetadataCheck(base44);
    checks.push({
      name: metadataCheck.name,
      passed: metadataCheck.passed,
      details: metadataCheck.details
    });
    violations.push(...metadataCheck.violations);

    const visibilityCheck = await collectVerificationVisibilityCheck(base44);
    checks.push({
      name: visibilityCheck.name,
      passed: visibilityCheck.passed,
      details: visibilityCheck.details
    });
    violations.push(...visibilityCheck.violations);

    const allPassed = checks.every((c) => c.passed) && violations.length === 0;

    const result: ContractResult = {
      success: allPassed,
      checks,
      warnings,
      violations
    };

    return Response.json(result);
  } catch (error) {
    const failure: ContractResult = {
      success: false,
      checks: [],
      warnings: [],
      violations: [
        `verifyNightwatchSystemContract failed: ${(error as Error).message}`
      ]
    };
    return Response.json(failure, { status: 500 });
  }
});

