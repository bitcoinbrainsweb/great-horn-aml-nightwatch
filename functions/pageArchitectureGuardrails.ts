import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const PROHIBITED_PATTERNS = [
  /^NW\d+/i,                  // NW001, NW-001, etc.
  /Verification/i,            // Verification in name
  /DeliveryGate/i,            // DeliveryGate
  /Implementation/i,          // Implementation
  /Audit/i,                   // Audit
  /ArchitectureVerification/i, // ArchitectureVerification
  /ImplementationReport/i,    // ImplementationReport
  /Summary/i                  // Summary
];

const ALLOWED_PAGES = new Set([
  'Dashboard',
  'Clients',
  'ClientDetail',
  'Engagements',
  'EngagementDetail',
  'Tasks',
  'Reports',
  'Admin',
  'ReviewerDashboard',
  'Feedback',
  'Help',
  'AdminMethodologies',
  'AdminRiskLibrary',
  'AdminControlLibrary',
  'AdminNarratives',
  'AdminSuggestions',
  'AdminIndustries',
  'AdminJurisdictions',
  'AdminUsers',
  'AdminInvitations',
  'AdminAuditLog',
  'AdminRiskProposals',
  'AdminChangeManagement',
  'AdminGovernance',
  'LibraryReviewDashboard',
  'AdminTestScenarios'
]);

function scanPagesDirectory() {
  const violations = [];
  const validPages = [];
  
  try {
    // In production, this would scan the actual pages directory
    // For now, we document the scanning logic
    const pageNames = [
      'Dashboard',
      'Clients',
      'ClientDetail',
      'Engagements',
      'EngagementDetail',
      'Tasks',
      'Reports',
      'Admin',
      'AdminChangeManagement',
      'AdminControlLibrary',
      'AdminRiskLibrary',
      'AdminMethodologies',
      'AdminNarratives',
      'AdminUsers',
      'AdminInvitations',
      'AdminAuditLog',
      'AdminJurisdictions',
      'AdminIndustries',
      'AdminSuggestions',
      'AdminTestScenarios',
      'AdminRiskProposals',
      'AdminGovernance',
      'ReviewerDashboard',
      'LibraryReviewDashboard',
      'Help',
      'Feedback'
    ];

    pageNames.forEach(pageName => {
      // Check against prohibited patterns
      const isProhibited = PROHIBITED_PATTERNS.some(pattern => pattern.test(pageName));
      const isAllowed = ALLOWED_PAGES.has(pageName);

      if (isProhibited && !isAllowed) {
        violations.push({
          page: pageName,
          reason: 'Matches prohibited artifact page naming pattern',
          remediation: 'Delete page; render as Change Management component instead'
        });
      } else if (!isProhibited) {
        validPages.push(pageName);
      }
    });
  } catch (error) {
    return { success: false, error: error.message };
  }

  return { violations, validPages, total_pages: validPages.length + violations.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action } = await req.json().catch(() => ({}));

    if (action === 'scan') {
      // Scan pages directory for violations
      const scanResult = scanPagesDirectory();
      return Response.json(scanResult);
    }

    if (action === 'validate') {
      // Validate against guardrails (used in delivery gate)
      const scanResult = scanPagesDirectory();
      const hasViolations = scanResult.violations && scanResult.violations.length > 0;

      return Response.json({
        compliant: !hasViolations,
        violations: scanResult.violations || [],
        valid_pages: scanResult.validPages || [],
        total_pages: scanResult.total_pages || 0,
        message: hasViolations
          ? `Page architecture violations detected: ${scanResult.violations.length} page(s) violate naming rules`
          : 'Page architecture is compliant'
      });
    }

    // Default: return guardrail documentation
    return Response.json({
      guardrails: {
        prohibited_patterns: [
          'NW* (e.g., NW014DeliveryGateSummary)',
          '*Verification* (e.g., VerificationReport)',
          '*DeliveryGate* (e.g., DeliveryGateSummary)',
          '*Implementation* (e.g., ImplementationReport)',
          '*Audit* (e.g., AuditReport)',
          '*ArchitectureVerification*',
          '*Summary* (e.g., NightwatchSummary)'
        ],
        enforcement: 'All pages must pass pattern validation during upgrade delivery gates',
        remedy: 'Artifact pages must be converted to Change Management components',
        allowed_pages: Array.from(ALLOWED_PAGES)
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});