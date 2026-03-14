/**
 * NW-UPGRADE-069A: Page Help Registry
 * 
 * Central registry for contextual page help.
 * Maps page names to help configurations.
 * 
 * Populated with placeholder data in 069A.
 * Actual content will be added in 069B.
 */

export const pageHelpRegistry = {
  Dashboard: {
    pageTitle: "Dashboard",
    shortExplanation: "Your main control center showing what needs attention across all compliance work.",
    whenUsed: "Start here every day to see what's overdue, what's coming up, and where issues need attention.",
    typicalWorkflow: [
      "Check overdue items and urgent tasks",
      "Review today's scheduled testing work",
      "Look at open findings that need follow-up",
      "Check recent activity across engagements"
    ],
    commonMistakes: [
      "Not checking daily - things move fast in compliance",
      "Ignoring warning indicators until they become urgent"
    ]
  },
  
  ComplianceOperations: {
    pageTitle: "Compliance Operations",
    shortExplanation: "Day-to-day workspace for managing testing, evidence, and operational compliance tasks.",
    whenUsed: "When you need to work through your daily testing queue, collect evidence, or track operational compliance activities.",
    typicalWorkflow: [
      "Review assigned testing work for today",
      "Complete control tests and upload evidence",
      "Log observations when issues are found",
      "Update task status and notes"
    ],
    commonMistakes: [
      "Completing tests without uploading supporting evidence",
      "Not logging observations immediately when issues are spotted"
    ]
  },
  
  Clients: {
    pageTitle: "Clients",
    shortExplanation: "Master list of all clients you perform compliance work for.",
    whenUsed: "When setting up a new client relationship or finding existing client information.",
    typicalWorkflow: [
      "Add new client with basic details",
      "Set client risk rating and jurisdiction",
      "Create first engagement for the client",
      "Track ongoing compliance activity"
    ],
    commonMistakes: [
      "Not setting the correct jurisdiction - this affects which rules apply",
      "Creating a client without immediately creating an engagement"
    ]
  },
  
  Engagements: {
    pageTitle: "Engagements",
    shortExplanation: "Specific compliance review projects, usually for a client over a defined period.",
    whenUsed: "When starting new compliance work for a client or reviewing ongoing engagement progress.",
    typicalWorkflow: [
      "Create engagement linked to a client",
      "Define scope and time period",
      "Set up review areas and controls",
      "Assign testing work and collect evidence",
      "Complete review and generate reports"
    ],
    commonMistakes: [
      "Not defining clear scope upfront - causes confusion later",
      "Starting testing before review areas are properly set up"
    ]
  },
  
  Tasks: {
    pageTitle: "Tasks",
    shortExplanation: "Action items and to-dos across all your compliance work.",
    whenUsed: "When you need to track specific follow-up actions, assignments, or reminders.",
    typicalWorkflow: [
      "Create task with clear description and due date",
      "Assign to yourself or team member",
      "Link to relevant engagement or audit if applicable",
      "Update status as work progresses",
      "Mark complete when done"
    ],
    commonMistakes: [
      "Setting vague due dates instead of specific deadlines",
      "Not linking tasks to the engagement they relate to"
    ]
  },
  
  Reports: {
    pageTitle: "Reports",
    shortExplanation: "Generated compliance reports, audit summaries, and deliverables for clients or regulators.",
    whenUsed: "When you need to export formal documentation of compliance work or audit results.",
    typicalWorkflow: [
      "Select engagement or audit to report on",
      "Choose report type and format",
      "Review auto-generated content",
      "Add executive summary or conclusions",
      "Export and share with stakeholders"
    ],
    commonMistakes: [
      "Not reviewing auto-generated sections before sharing",
      "Forgetting to include management responses to findings"
    ]
  },
  
  TestCycles: {
    pageTitle: "Test Cycles",
    shortExplanation: "Organized batches of control testing work, usually aligned to a testing period like monthly or quarterly.",
    whenUsed: "When planning a round of control testing or tracking progress on scheduled testing work.",
    typicalWorkflow: [
      "Create new test cycle for the period (e.g., 'Q1 2026 Testing')",
      "Assign controls to be tested in this cycle",
      "Work through assigned tests and collect evidence",
      "Review test results and flag issues",
      "Close cycle when all testing is complete"
    ],
    commonMistakes: [
      "Creating too many cycles at once - focus on the current period",
      "Not closing completed cycles, making it hard to see what's active"
    ]
  },
  
  ControlTests: {
    pageTitle: "Control Tests",
    shortExplanation: "Individual tests that check whether specific controls are working as intended.",
    whenUsed: "When performing actual testing work - examining transactions, reviewing policies, or validating controls.",
    typicalWorkflow: [
      "Select control test from your assigned work",
      "Review what you're testing and the expected outcome",
      "Perform the test steps (sample transactions, review docs, etc.)",
      "Upload evidence of what you found",
      "Mark test result: pass, pass with exceptions, or fail",
      "Log findings if issues are discovered"
    ],
    commonMistakes: [
      "Marking tests complete without uploading evidence",
      "Not documenting exceptions clearly when found"
    ]
  },
  
  ControlCoverageMap: {
    pageTitle: "Control Coverage Map",
    shortExplanation: "Visual overview showing which risks are covered by controls and how well controls are being tested.",
    whenUsed: "When you need to see gaps in your control framework or identify risks that aren't adequately covered.",
    typicalWorkflow: [
      "Review risk coverage - are high risks controlled?",
      "Identify controls that haven't been tested recently",
      "Check for risks with no assigned controls",
      "Plan testing to close coverage gaps"
    ],
    commonMistakes: [
      "Only looking at this during audits instead of continuously",
      "Not acting on identified gaps in coverage"
    ]
  },
  
  ReviewerDashboard: {
    pageTitle: "Reviewer Dashboard",
    shortExplanation: "Workspace for senior staff to review, approve, or provide feedback on compliance work completed by others.",
    whenUsed: "When you need to review testing work, sign off on evidence, or approve findings before they're finalized.",
    typicalWorkflow: [
      "Review items waiting for your approval",
      "Check quality of evidence and testing notes",
      "Approve, reject, or request changes",
      "Add reviewer comments for the team",
      "Sign off on completed work"
    ],
    commonMistakes: [
      "Not providing clear feedback when rejecting work",
      "Batch-approving without actually reviewing the evidence"
    ]
  },
  
  Findings: {
    pageTitle: "Findings",
    shortExplanation: "Issues, control deficiencies, and compliance gaps that have been identified during testing or audits.",
    whenUsed: "When documenting issues found during compliance work or tracking remediation of known problems.",
    typicalWorkflow: [
      "Review finding details and severity",
      "Assign remediation owner and due date",
      "Track remediation progress",
      "Verify remediation when complete",
      "Close finding once verified"
    ],
    commonMistakes: [
      "Not setting realistic remediation deadlines",
      "Closing findings without verifying the fix actually works"
    ]
  },
  
  RemediationActions: {
    pageTitle: "Remediation Actions",
    shortExplanation: "Specific action plans to fix findings and close compliance gaps.",
    whenUsed: "When planning how to address a finding or tracking progress on fixing identified issues.",
    typicalWorkflow: [
      "Create remediation plan linked to a finding",
      "Define clear action steps and owner",
      "Set target completion date",
      "Update progress as work happens",
      "Request verification when complete",
      "Get sign-off before closing"
    ],
    commonMistakes: [
      "Vague action plans that don't actually fix the root cause",
      "Not involving the right people who can actually make changes"
    ]
  },
  
  AdminAuditPrograms: {
    pageTitle: "Audit Programs",
    shortExplanation: "Recurring audit schedules and templates for regular compliance reviews.",
    whenUsed: "When setting up annual or recurring audit work, like 'Annual AML Audit' or 'Quarterly Controls Review'.",
    typicalWorkflow: [
      "Create audit program with name and frequency",
      "Define default phases and procedures",
      "Schedule individual audits from the program",
      "Track progress across scheduled audits"
    ],
    commonMistakes: [
      "Creating one-off audits as programs instead of templates",
      "Not scheduling audits far enough in advance"
    ]
  },
  
  AdminAudits: {
    pageTitle: "Audits",
    shortExplanation: "Formal compliance audits with structured phases, procedures, evidence, and findings.",
    whenUsed: "When conducting a formal audit or organizing audit fieldwork.",
    typicalWorkflow: [
      "Create audit linked to an engagement",
      "Set up audit phases (planning, fieldwork, reporting)",
      "Add procedures under each phase",
      "Execute procedures and collect evidence",
      "Document findings and remediation",
      "Generate defense package for regulators"
    ],
    commonMistakes: [
      "Starting fieldwork before planning phase is complete",
      "Not linking evidence to specific procedures"
    ]
  },
  
  AdminAuditTemplates: {
    pageTitle: "Audit Templates",
    shortExplanation: "Pre-built audit structures you can reuse for common audit types.",
    whenUsed: "When you want to standardize audit approach or quickly start a new audit from a proven template.",
    typicalWorkflow: [
      "Create template with standard phases and procedures",
      "Define expected evidence and testing approach",
      "Use template when creating new audits",
      "Customize as needed for specific audit"
    ],
    commonMistakes: [
      "Over-customizing templates, defeating the purpose of standardization"
    ]
  },
  
  ChangeLog: {
    pageTitle: "Change Log",
    shortExplanation: "Technical record of system upgrades, verification results, and build artifacts.",
    whenUsed: "When troubleshooting issues, reviewing recent system changes, or checking build verification status.",
    typicalWorkflow: [
      "Review recent upgrades and changes",
      "Check verification results for errors",
      "Download artifacts if needed",
      "Report issues to technical team"
    ],
    commonMistakes: [
      "Ignoring failed verification warnings"
    ]
  },
  
  BuildVerificationDashboard: {
    pageTitle: "Build Verification Dashboard",
    shortExplanation: "Technical dashboard showing system integrity checks and contract verification results.",
    whenUsed: "When validating system health after upgrades or troubleshooting technical issues.",
    typicalWorkflow: [
      "Run verification checks",
      "Review contract compliance results",
      "Investigate any failures",
      "Confirm all gates pass before proceeding"
    ],
    commonMistakes: [
      "Running verification without admin access"
    ]
  },
  
  Feedback: {
    pageTitle: "Feedback",
    shortExplanation: "Share suggestions, report issues, or request features.",
    whenUsed: "When you notice something that could work better or find a bug.",
    typicalWorkflow: [
      "Describe what you were trying to do",
      "Explain what didn't work as expected",
      "Submit feedback for review"
    ],
    commonMistakes: [
      "Not including enough context about what went wrong"
    ]
  },
  
  Admin: {
    pageTitle: "Admin",
    shortExplanation: "System administration, configuration, and advanced settings.",
    whenUsed: "When configuring system-wide settings, managing users, or accessing advanced admin tools.",
    typicalWorkflow: [
      "Access admin section for your task",
      "Make configuration changes carefully",
      "Test changes before finalizing"
    ],
    commonMistakes: [
      "Making bulk changes without understanding impact"
    ]
  }
};

/**
 * Safe getter with fallback
 */
export function getPageHelp(pageName) {
  return pageHelpRegistry[pageName] || null;
}