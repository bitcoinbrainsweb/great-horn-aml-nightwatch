/**
 * NW-UPGRADE-069A: Empty States Registry
 * 
 * Configuration for smart empty states across the app.
 * Used by SmartEmptyState component.
 * 
 * Populated with placeholder data in 069A.
 * Actual content will be added in 069B.
 */

export const emptyStates = {
  noControls: {
    title: "No Controls Yet",
    explanation: "Controls are the processes and policies that prevent or detect risks.",
    whyEmpty: "Your control library is empty because no controls have been defined yet.",
    nextStep: "Start by adding the key controls your organization uses to manage risk - like transaction approvals, KYC checks, or monitoring processes.",
    ctaText: "Add First Control"
  },
  
  noRisks: {
    title: "No Risks Defined",
    explanation: "Risks are potential problems you need to watch for and control.",
    whyEmpty: "Your risk register is empty - no risks have been identified yet.",
    nextStep: "Identify the main risks your organization faces, like fraud, money laundering, sanctions violations, or operational failures.",
    ctaText: "Add First Risk"
  },
  
  noEngagements: {
    title: "No Engagements",
    explanation: "Engagements organize compliance work for a specific client and time period.",
    whyEmpty: "You haven't created any engagements yet.",
    nextStep: "Create an engagement for your first client review. You'll use it to track all related testing, evidence, and findings.",
    ctaText: "Create Engagement"
  },
  
  noFindings: {
    title: "No Findings",
    explanation: "Findings are issues or control gaps discovered during testing or audits.",
    whyEmpty: "No findings have been logged yet - either testing hasn't started or no issues were found.",
    nextStep: "Findings will appear here when testing identifies problems. Complete some control tests first."
  },
  
  noEvidence: {
    title: "No Evidence Yet",
    explanation: "Evidence proves that controls are working and supports your compliance conclusions.",
    whyEmpty: "No evidence has been uploaded or linked yet.",
    nextStep: "Upload evidence as you complete testing - screenshots, approvals, reports, or other documentation showing what you found.",
    ctaText: "Upload Evidence"
  },
  
  noTestCycles: {
    title: "No Test Cycles",
    explanation: "Test cycles organize your control testing work by time period, like monthly or quarterly.",
    whyEmpty: "You haven't created any testing cycles yet.",
    nextStep: "Create a test cycle for the current period, then assign controls to be tested within it.",
    ctaText: "Create Test Cycle"
  },
  
  noControlTests: {
    title: "No Control Tests",
    explanation: "Control tests verify that your controls are operating as expected.",
    whyEmpty: "No testing work has been assigned yet.",
    nextStep: "Create a test cycle first, then assign controls to be tested. You'll work through them and upload evidence of results.",
    ctaText: "Create Test Cycle"
  },
  
  noAudits: {
    title: "No Audits",
    explanation: "Audits are formal, structured reviews with defined phases, procedures, and deliverables.",
    whyEmpty: "You haven't created any audits yet.",
    nextStep: "Create your first audit from a template or build one manually. Link it to an engagement to organize the work.",
    ctaText: "Create Audit"
  },
  
  noAuditPrograms: {
    title: "No Audit Programs",
    explanation: "Audit programs are recurring audit schedules, like 'Annual AML Audit' that repeats every year.",
    whyEmpty: "You haven't set up any recurring audit programs yet.",
    nextStep: "Create a program for audits you perform regularly. You can then schedule individual audits from the program.",
    ctaText: "Create Program"
  },
  
  noAuditTemplates: {
    title: "No Audit Templates",
    explanation: "Templates are pre-built audit structures you can reuse for common audit types.",
    whyEmpty: "No templates have been created yet.",
    nextStep: "Build a template for audits you'll do repeatedly, with standard phases and procedures already defined.",
    ctaText: "Create Template"
  },
  
  noRemediationActions: {
    title: "No Remediation Actions",
    explanation: "Remediation actions are the steps taken to fix findings and close compliance gaps.",
    whyEmpty: "No remediation plans have been created yet.",
    nextStep: "When findings are identified, create remediation actions with clear owners and deadlines to fix the issues.",
    ctaText: "View Findings"
  },
  
  noClients: {
    title: "No Clients Yet",
    explanation: "Clients are the organizations you perform compliance reviews for.",
    whyEmpty: "You haven't added any clients to the system yet.",
    nextStep: "Add your first client, then create an engagement to start tracking compliance work for them.",
    ctaText: "Add Client"
  },
  
  noTasks: {
    title: "No Tasks",
    explanation: "Tasks track to-dos and follow-up actions across your compliance work.",
    whyEmpty: "No tasks have been created yet.",
    nextStep: "Create tasks to track specific action items, deadlines, or reminders you need to follow up on.",
    ctaText: "Create Task"
  },
  
  noReports: {
    title: "No Reports Generated",
    explanation: "Reports are formal summaries of audit work, findings, and conclusions.",
    whyEmpty: "You haven't generated any reports yet.",
    nextStep: "Complete some audit work first. Then generate reports to document your findings and share with stakeholders."
  },
  
  noProcedures: {
    title: "No Procedures Defined",
    explanation: "Audit procedures are the specific testing or review steps you'll perform.",
    whyEmpty: "This audit doesn't have any procedures yet.",
    nextStep: "Add procedures that define what testing work will be done. Break the audit into manageable testing steps.",
    ctaText: "Add Procedure"
  },
  
  noPhases: {
    title: "No Phases Yet",
    explanation: "Phases organize audit work into stages like Planning, Fieldwork, and Reporting.",
    whyEmpty: "This audit doesn't have phases defined yet.",
    nextStep: "Add audit phases to organize your work. Start with Planning, then add Fieldwork and Reporting phases.",
    ctaText: "Add Phase"
  }
};

/**
 * Safe getter with fallback
 */
export function getEmptyState(key) {
  return emptyStates[key] || null;
}