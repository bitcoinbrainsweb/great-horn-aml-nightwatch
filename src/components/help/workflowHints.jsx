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
  controlCreated: {
    message: "Control added to library",
    nextAction: "Link this control to the risks it addresses, then add it to an engagement or test cycle.",
    linkText: "View Control"
  },
  
  riskCreated: {
    message: "Risk added to register",
    nextAction: "Assign controls to mitigate this risk, or flag it as uncontrolled if no controls exist yet.",
    linkText: "View Risk"
  },
  
  clientCreated: {
    message: "Client created",
    nextAction: "Create an engagement to start compliance work for this client.",
    linkText: "Create Engagement"
  },
  
  engagementCreated: {
    message: "Engagement created",
    nextAction: "Set up review areas, assign risks and controls, then begin testing work.",
    linkText: "Setup Engagement"
  },
  
  testCycleCreated: {
    message: "Test cycle created",
    nextAction: "Assign controls to this cycle and start working through the testing queue.",
    linkText: "Assign Controls"
  },
  
  controlTestCompleted: {
    message: "Test marked complete",
    nextAction: "If issues were found, log an observation or finding. If clean, move to the next test.",
    linkText: "View Test Results"
  },
  
  evidenceUploaded: {
    message: "Evidence uploaded",
    nextAction: "Link this evidence to the control test or audit procedure it supports.",
    linkText: "View Evidence"
  },
  
  observationLogged: {
    message: "Observation recorded",
    nextAction: "Decide if this needs immediate remediation or should be escalated to a formal finding.",
    linkText: "View Observation"
  },
  
  auditCreated: {
    message: "Audit created",
    nextAction: "Add audit phases and procedures, or apply a template if you're using a standard audit approach.",
    linkText: "Setup Audit"
  },
  
  auditPhaseCreated: {
    message: "Audit phase added",
    nextAction: "Add procedures under this phase to define what testing work will be done.",
    linkText: "Add Procedures"
  },
  
  auditProcedureCreated: {
    message: "Procedure added",
    nextAction: "Execute the procedure, collect evidence, and document your findings.",
    linkText: "Start Procedure"
  },
  
  procedureCompleted: {
    message: "Procedure marked complete",
    nextAction: "Review the results. If issues were found, create findings. If all clean, move to the next procedure.",
    linkText: "View Results"
  },
  
  findingCreated: {
    message: "Finding documented",
    nextAction: "Assign a remediation owner and set a deadline to fix this issue.",
    linkText: "Create Remediation"
  },
  
  remediationCreated: {
    message: "Remediation action created",
    nextAction: "Track progress on the remediation and request verification when work is complete.",
    linkText: "View Remediation"
  },
  
  remediationVerified: {
    message: "Remediation verified as complete",
    nextAction: "Close the associated finding now that the issue is resolved.",
    linkText: "Close Finding"
  },
  
  findingClosed: {
    message: "Finding closed",
    nextAction: "Review remaining open findings or proceed with finalizing the audit report.",
    linkText: "View All Findings"
  },
  
  auditReportGenerated: {
    message: "Audit report generated",
    nextAction: "Review the report for accuracy, then share with stakeholders or generate a defense package.",
    linkText: "View Report"
  },
  
  defensePackageGenerated: {
    message: "Defense package created",
    nextAction: "Download the package and prepare it for regulatory submission or inspection.",
    linkText: "Download Package"
  },
  
  taskCreated: {
    message: "Task created",
    nextAction: "Assign the task and set a clear due date so it shows up in the right person's queue.",
    linkText: "View Task"
  },
  
  taskCompleted: {
    message: "Task marked complete",
    nextAction: "Check your task list for other pending items or move to the next priority.",
    linkText: "View Tasks"
  },
  
  auditProgramCreated: {
    message: "Audit program created",
    nextAction: "Schedule individual audits from this program based on your recurring audit calendar.",
    linkText: "Schedule Audits"
  },
  
  auditTemplateCreated: {
    message: "Audit template created",
    nextAction: "Use this template when creating new audits to save time on setup.",
    linkText: "View Template"
  },
  
  sampleSetCreated: {
    message: "Sample set created",
    nextAction: "Add sample items to this set, then work through testing each one.",
    linkText: "Add Samples"
  }
};

/**
 * Safe getter with fallback
 */
export function getWorkflowHint(key) {
  return workflowHints[key] || null;
}