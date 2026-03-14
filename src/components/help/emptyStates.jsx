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
  // Placeholder entries - will be populated in 069B
  noControls: {
    title: "No Controls Yet",
    explanation: "You haven't created any internal controls.",
    whyEmpty: "This library is empty because no controls have been defined.",
    nextStep: "Create your first control to start building your compliance program.",
    ctaText: "Create Control",
    ctaLink: "#create-control"
  },
  
  noRisks: {
    title: "No Risks Defined",
    explanation: "Your risk library is empty.",
    whyEmpty: "No risks have been identified yet.",
    nextStep: "Start by identifying key risks your organization faces.",
    ctaText: "Add Risk",
    ctaLink: "#add-risk"
  },
  
  noEngagements: {
    title: "No Engagements",
    explanation: "No compliance engagements have been created.",
    whyEmpty: "You need to create an engagement to begin compliance work.",
    nextStep: "Create an engagement for a specific client or time period.",
    ctaText: "New Engagement"
  },
  
  noFindings: {
    title: "No Findings",
    explanation: "No audit findings have been recorded.",
    whyEmpty: "Either no audits have been completed, or no issues were found.",
    nextStep: "Findings will appear here when audit procedures identify issues."
  },
  
  noEvidence: {
    title: "No Evidence Collected",
    explanation: "No evidence has been attached yet.",
    whyEmpty: "Evidence must be collected to support audit procedures.",
    nextStep: "Upload or link evidence to document your audit work.",
    ctaText: "Add Evidence"
  }
};

/**
 * Safe getter with fallback
 */
export function getEmptyState(key) {
  return emptyStates[key] || null;
}