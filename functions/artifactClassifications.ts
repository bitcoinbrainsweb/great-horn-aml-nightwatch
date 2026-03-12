export const ArtifactClassification = {
  VERIFICATION_RECORD: 'verification_record',
  SYSTEM_EXPORT: 'system_export',
  AUDIT_RECORD: 'audit_record',
  DELIVERY_GATE_RECORD: 'delivery_gate_record',
  DIAGNOSTIC_RECORD: 'diagnostic_record'
} as const;

export type ArtifactClassificationValue =
  (typeof ArtifactClassification)[keyof typeof ArtifactClassification];

export const ALLOWED_ARTIFACT_CLASSIFICATIONS: ArtifactClassificationValue[] = [
  ArtifactClassification.VERIFICATION_RECORD,
  ArtifactClassification.SYSTEM_EXPORT,
  ArtifactClassification.AUDIT_RECORD,
  ArtifactClassification.DELIVERY_GATE_RECORD,
  ArtifactClassification.DIAGNOSTIC_RECORD
];

