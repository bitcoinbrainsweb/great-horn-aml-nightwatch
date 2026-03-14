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
  // Placeholder entries - will be populated in 069B
  Dashboard: {
    pageTitle: "Dashboard",
    shortExplanation: "Overview of your compliance status and key metrics.",
    whenUsed: "When you need a high-level view of compliance health.",
    typicalWorkflow: [
      "Review risk summary",
      "Check control effectiveness",
      "Monitor open findings"
    ],
    commonMistakes: [
      "Skipping daily review of critical alerts"
    ]
  },
  
  AdminControlLibrary: {
    pageTitle: "Control Library",
    shortExplanation: "Master repository of internal controls.",
    whenUsed: "When defining or reviewing internal controls.",
    typicalWorkflow: [
      "Create new control",
      "Map to risks",
      "Schedule testing"
    ],
    commonMistakes: [
      "Duplicating controls instead of reusing",
      "Missing risk mappings"
    ]
  }
};

/**
 * Safe getter with fallback
 */
export function getPageHelp(pageName) {
  return pageHelpRegistry[pageName] || null;
}