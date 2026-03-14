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
  AML: {
    term: "AML",
    definition: "Anti-Money Laundering - rules and procedures to detect and prevent criminals from disguising illegally obtained funds as legitimate income",
    example: "Transaction monitoring and customer due diligence are core AML controls",
    relatedTerms: ["KYC", "CDD", "STR", "SAR"]
  },
  
  KYC: {
    term: "KYC",
    definition: "Know Your Customer - the process of identifying and verifying customer identity",
    example: "Collecting government-issued ID and proof of address during account opening",
    relatedTerms: ["AML", "CDD", "EDD"]
  },
  
  CDD: {
    term: "CDD",
    definition: "Customer Due Diligence - assessing the risk level of a customer relationship",
    example: "Reviewing customer background, transaction patterns, and expected activity",
    relatedTerms: ["KYC", "EDD", "Risk Rating"]
  },
  
  EDD: {
    term: "EDD",
    definition: "Enhanced Due Diligence - additional scrutiny required for higher-risk customers",
    example: "Extra verification for politically exposed persons or high-value transactions",
    relatedTerms: ["CDD", "PEP", "Source of Wealth"]
  },
  
  STR: {
    term: "STR",
    definition: "Suspicious Transaction Report - formal report filed with authorities about potentially suspicious activity",
    example: "Filing an STR when customer transactions don't match their stated business",
    relatedTerms: ["SAR", "AML"]
  },
  
  SAR: {
    term: "SAR",
    definition: "Suspicious Activity Report - similar to STR, term used in some jurisdictions",
    relatedTerms: ["STR", "AML"]
  },
  
  EFTR: {
    term: "EFTR",
    definition: "Electronic Funds Transfer Report - mandatory reporting of certain wire transfers",
    relatedTerms: ["AML", "Transaction Monitoring"]
  },
  
  "Sanctions Screening": {
    term: "Sanctions Screening",
    definition: "Checking customers and transactions against government sanctions lists",
    example: "Screening against OFAC, UN, and EU sanctions lists before processing transactions",
    relatedTerms: ["PEP", "AML"]
  },
  
  "Beneficial Ownership": {
    term: "Beneficial Ownership",
    definition: "Identifying who ultimately owns or controls a customer entity",
    example: "Finding the individuals who own 25% or more of a corporate customer",
    relatedTerms: ["CDD", "UBO"]
  },
  
  "Source of Funds": {
    term: "Source of Funds",
    definition: "Where money for a specific transaction comes from",
    example: "Verifying funds came from customer's business account, not a third party",
    relatedTerms: ["Source of Wealth", "EDD"]
  },
  
  "Source of Wealth": {
    term: "Source of Wealth",
    definition: "How a customer accumulated their overall wealth",
    example: "Customer wealth derived from real estate business or employment income",
    relatedTerms: ["Source of Funds", "EDD"]
  },
  
  Control: {
    term: "Control",
    definition: "A process, policy, or activity designed to prevent or detect risks",
    example: "Dual authorization for large payments is a control against fraud",
    relatedTerms: ["Control Test", "Risk"]
  },
  
  "Control Test": {
    term: "Control Test",
    definition: "A check to verify that a control is working as intended",
    example: "Testing whether dual authorization was actually obtained for a sample of payments",
    relatedTerms: ["Control", "Evidence", "Test Cycle"]
  },
  
  "Test Cycle": {
    term: "Test Cycle",
    definition: "A batch of control testing work organized by time period",
    example: "Q1 2026 Control Testing Cycle containing all quarterly tests",
    relatedTerms: ["Control Test", "Evidence"]
  },
  
  Evidence: {
    term: "Evidence",
    definition: "Documentation that supports your testing or audit work",
    example: "Screenshots, email approvals, or system exports showing a control operated",
    relatedTerms: ["Control Test", "Workpaper"]
  },
  
  Observation: {
    term: "Observation",
    definition: "An issue or concern noticed during compliance work",
    example: "Noticing approval was missing on several transactions during testing",
    relatedTerms: ["Finding", "Remediation"]
  },
  
  Finding: {
    term: "Finding",
    definition: "A confirmed control deficiency or compliance gap requiring action",
    example: "Control failed testing - dual authorization not enforced in 15% of cases",
    relatedTerms: ["Observation", "Remediation"]
  },
  
  Remediation: {
    term: "Remediation",
    definition: "Actions taken to fix a finding and prevent recurrence",
    example: "Updating system to require two approvals before processing large payments",
    relatedTerms: ["Finding", "Remediation Action"]
  },
  
  "Audit Program": {
    term: "Audit Program",
    definition: "A recurring schedule of audits performed regularly",
    example: "Annual AML Audit Program conducted every January",
    relatedTerms: ["Audit", "Audit Template"]
  },
  
  "Audit Template": {
    term: "Audit Template",
    definition: "Pre-built audit structure with standard phases and procedures",
    example: "AML Audit Template with standard KYC, transaction monitoring, and STR review procedures",
    relatedTerms: ["Audit Program", "Audit Procedure"]
  },
  
  "Audit Procedure": {
    term: "Audit Procedure",
    definition: "A specific testing or review step within an audit",
    example: "Review 25 customer files for complete KYC documentation",
    relatedTerms: ["Audit", "Workpaper", "Evidence"]
  },
  
  Workpaper: {
    term: "Workpaper",
    definition: "Documentation of audit work performed and conclusions reached",
    example: "Notes and analysis supporting a procedure's test results",
    relatedTerms: ["Audit Procedure", "Evidence"]
  },
  
  "Sample Set": {
    term: "Sample Set",
    definition: "A group of items selected for testing from a larger population",
    example: "Random sample of 30 transactions from 500 total for the month",
    relatedTerms: ["Sample Item", "Audit Procedure"]
  },
  
  "Sample Item": {
    term: "Sample Item",
    definition: "An individual item within a sample set",
    example: "Transaction #12345 selected as part of the monthly testing sample",
    relatedTerms: ["Sample Set"]
  },
  
  "Defense Package": {
    term: "Defense Package",
    definition: "Complete bundle of audit evidence and documentation for regulatory review",
    example: "All procedures, evidence, findings, and remediation packaged for regulator inspection",
    relatedTerms: ["Audit", "Evidence"]
  },
  
  Risk: {
    term: "Risk",
    definition: "A potential event or situation that could cause harm or loss",
    example: "Risk of processing payments for sanctioned entities",
    relatedTerms: ["Control", "Risk Rating"]
  },
  
  Engagement: {
    term: "Engagement",
    definition: "A specific compliance review project for a client over a defined period",
    example: "2026 Annual AML Review for ACME Corp covering Jan-Dec 2025 activity",
    relatedTerms: ["Client", "Audit"]
  },
  
  PEP: {
    term: "PEP",
    definition: "Politically Exposed Person - individual with prominent public position requiring enhanced monitoring",
    example: "Government officials, senior political party members, or their close associates",
    relatedTerms: ["EDD", "Sanctions Screening"]
  },
  
  UBO: {
    term: "UBO",
    definition: "Ultimate Beneficial Owner - the natural person who ultimately owns or controls an entity",
    relatedTerms: ["Beneficial Ownership", "CDD"]
  }
};

/**
 * Safe getter with fallback
 */
export function getTermDefinition(term) {
  return helpDefinitions[term] || null;
}