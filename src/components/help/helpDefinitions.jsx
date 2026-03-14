/**
 * NW-UPGRADE-069A: Help Definitions Registry
 * 
 * Compliance term definitions for inline tooltips.
 * Used by ComplianceTerm component.
 * 
 * Populated with placeholder data in 069A.
 * Actual content will be added in 069B.
 */

export const helpDefinitions = {
  // Placeholder entries - will be populated in 069B
  AML: {
    term: "AML",
    definition: "Anti-Money Laundering compliance framework",
    example: "Customer due diligence procedures are part of AML controls",
    relatedTerms: ["KYC", "CDD", "EDD"]
  },
  
  KYC: {
    term: "KYC",
    definition: "Know Your Customer - customer identification process",
    example: "Collecting ID documents is part of KYC onboarding",
    relatedTerms: ["AML", "CDD"]
  },
  
  CDD: {
    term: "CDD",
    definition: "Customer Due Diligence - risk assessment process",
    example: "Enhanced CDD required for high-risk customers",
    relatedTerms: ["KYC", "EDD"]
  },
  
  EDD: {
    term: "EDD",
    definition: "Enhanced Due Diligence - additional scrutiny for high-risk",
    relatedTerms: ["CDD", "AML"]
  },
  
  Control: {
    term: "Control",
    definition: "Process or activity that mitigates risk",
    example: "Dual authorization is a control for payment processing"
  },
  
  Risk: {
    term: "Risk",
    definition: "Potential event that could harm the organization",
    example: "Fraud is a financial risk"
  },
  
  Engagement: {
    term: "Engagement",
    definition: "Scoped compliance review for a specific client or period",
    example: "Annual AML engagement for ACME Corp"
  },
  
  Audit: {
    term: "Audit",
    definition: "Independent verification of controls and processes",
    example: "Internal audit of transaction monitoring controls"
  },
  
  Finding: {
    term: "Finding",
    definition: "Identified control deficiency or compliance gap",
    example: "Missing documentation is a finding"
  },
  
  Remediation: {
    term: "Remediation",
    definition: "Action taken to resolve a finding",
    example: "Implementing new training program to remediate finding"
  }
};

/**
 * Safe getter with fallback
 */
export function getTermDefinition(term) {
  return helpDefinitions[term] || null;
}