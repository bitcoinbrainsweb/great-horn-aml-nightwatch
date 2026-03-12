import { ArtifactClassification, ALLOWED_ARTIFACT_CLASSIFICATIONS } from './artifactClassifications.ts';

/**
 * Canonical Artifact Publisher Gateway - NW-UPGRADE-035
 *
 * Minimal wrapper around PublishedOutput.create for canonical artifacts.
 * This does NOT enforce migration of legacy writers yet; it is used first
 * by createVerificationArtifact and can be adopted by other writers later.
 */

export async function publishCanonicalArtifact(base44: any, payload: any) {
  const classification = payload.classification;

  if (!ALLOWED_ARTIFACT_CLASSIFICATIONS.includes(classification as (typeof ArtifactClassification)[keyof typeof ArtifactClassification])) {
    throw new Error(
      `[publishCanonicalArtifact] Invalid classification: ${classification}`
    );
  }

  const title = payload.title || payload.outputName;
  const publishedAt = payload.published_at;

  if (!title || !classification || !publishedAt) {
    throw new Error(
      '[publishCanonicalArtifact] Missing required canonical fields (title/outputName, classification, published_at)'
    );
  }

  const record = await base44.asServiceRole.entities.PublishedOutput.create({
    ...payload
  });

  return record;
}

