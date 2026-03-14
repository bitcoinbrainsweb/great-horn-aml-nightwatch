/**
 * NW-UPGRADE-069A: Workflow Hints Registry
 * 
 * Next-step guidance displayed after user actions.
 * Used by NextStepPanel component.
 * 
 * Populated with placeholder data in 069A.
 * Actual content will be added in 069B.
 */

export const workflowHints = {
  // Placeholder entries - will be populated in 069B
  controlCreated: {
    message: "Control created successfully",
    nextAction: "Map this control to risks, then schedule testing.",
    link: "#map-risks",
    linkText: "Map to Risks"
  },
  
  riskCreated: {
    message: "Risk added to library",
    nextAction: "Define controls to mitigate this risk.",
    link: "#create-control",
    linkText: "Create Control"
  },
  
  engagementCreated: {
    message: "Engagement created",
    nextAction: "Define review areas and scope for this engagement.",
    link: "#setup-areas",
    linkText: "Setup Areas"
  },
  
  auditCreated: {
    message: "Audit initialized",
    nextAction: "Add audit phases and procedures to begin work.",
    link: "#add-phases",
    linkText: "Add Phases"
  },
  
  procedureCompleted: {
    message: "Procedure marked complete",
    nextAction: "Review findings and prepare audit report.",
    link: "#view-findings",
    linkText: "View Findings"
  },
  
  findingCreated: {
    message: "Finding documented",
    nextAction: "Create a remediation action to address this finding.",
    link: "#create-remediation",
    linkText: "Create Remediation"
  },
  
  remediationVerified: {
    message: "Remediation verified",
    nextAction: "Close the associated finding if fully resolved.",
    link: "#close-finding",
    linkText: "Close Finding"
  }
};

/**
 * Safe getter with fallback
 */
export function getWorkflowHint(key) {
  return workflowHints[key] || null;
}