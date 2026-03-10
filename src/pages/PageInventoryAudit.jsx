import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, Trash2, Eye, Lock, BarChart3 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

const INVENTORY = [
  // ========== TIER 1: Core Workflow Pages ==========
  {
    route: '/dashboard',
    file: 'Dashboard.js',
    navLabel: 'Dashboard',
    section: 'Main Navigation (Top Level)',
    access: 'All authenticated users',
    pageType: 'core workflow page',
    purpose: 'Application hub: stats, task queue, recent activity, engagement pipeline snapshot',
    readsFrom: 'Engagement, Task, Report, ActivityLog',
    actions: 'Links to Clients, Engagements, Tasks, Reports',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Healthy hub page.',
  },
  {
    route: '/clients',
    file: 'Clients.js',
    navLabel: 'Clients',
    section: 'Main Navigation (Top Level)',
    access: 'All authenticated users',
    pageType: 'core workflow page',
    purpose: 'Client list/CRUD: create, list, filter, status management',
    readsFrom: 'Client entity',
    actions: 'Create, update, delete, filter clients',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Core list page.',
  },
  {
    route: '/clients/:id',
    file: 'ClientDetail.js',
    navLabel: 'Client Detail (nested)',
    section: 'Clients (detail)',
    access: 'All authenticated users',
    pageType: 'core workflow page',
    purpose: 'Client detail view: engagements, compliance overview, tasks, documents, audit history',
    readsFrom: 'Client, Engagement, ControlAssessment, Task, Document, AuditLog',
    actions: 'View engagements, compliance data, edit client, archive',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Healthy detail page.',
  },
  {
    route: '/engagements',
    file: 'Engagements.js',
    navLabel: 'Engagements',
    section: 'Main Navigation (Top Level)',
    access: 'All authenticated users',
    pageType: 'core workflow page',
    purpose: 'Engagement list: create, list, filter, status management',
    readsFrom: 'Engagement, Methodology',
    actions: 'Create, list, filter, link to EngagementDetail',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Core list page.',
  },
  {
    route: '/engagements/:id',
    file: 'EngagementDetail.js',
    navLabel: 'Engagement Detail (nested)',
    section: 'Engagements (detail)',
    access: 'All authenticated users',
    pageType: 'core workflow page',
    purpose: 'Engagement detail with 6 tabs: Intake, Risks, Controls, Summary, Report, Review. Full workflow hub.',
    readsFrom: 'Engagement, AssessmentState, EngagementRisk, ControlAssessment, ControlEvidence, Report, ReviewLog',
    actions: 'Complete intake, manage risks/controls, generate report, review approval, export',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Critical workflow page.',
  },
  {
    route: '/tasks',
    file: 'Tasks.js',
    navLabel: 'Tasks',
    section: 'Main Navigation (Top Level)',
    access: 'All authenticated users',
    pageType: 'core workflow page',
    purpose: 'Task list: create, list, filter, assign, status management',
    readsFrom: 'Task entity',
    actions: 'Create, update, delete, filter, assign, mark complete',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Core list page.',
  },
  {
    route: '/reports',
    file: 'Reports.js',
    navLabel: 'Reports',
    section: 'Main Navigation (Top Level)',
    access: 'All authenticated users',
    pageType: 'report page',
    purpose: 'Canonical reports list: displays only PublishedOutput records where classification=report, status=published. Hardened query.',
    readsFrom: 'PublishedOutput (filtered: classification=report, status=published)',
    actions: 'View reports, download, filter by type/version/upgrade_id',
    disposition: 'KEEP as-is',
    misplacement: 'None (fixed in NW-UPGRADE-011)',
    notes: 'Now sources from canonical PublishedOutput entity only, never from GeneratedReport or scattered pages.',
  },
  {
    route: '/admin',
    file: 'Admin.js',
    navLabel: 'Admin',
    section: 'Main Navigation (Top Level)',
    access: 'admin, super_admin, compliance_admin roles',
    pageType: 'admin page',
    purpose: 'Admin hub: navigation to all admin subsections and internal tools (super-admin only)',
    readsFrom: 'User role check',
    actions: 'Links to AdminRiskLibrary, AdminControlLibrary, AdminMethodologies, etc.',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin hub.',
  },
  {
    route: '/reviewer',
    file: 'ReviewerDashboard.js',
    navLabel: 'Reviewer',
    section: 'Main Navigation (Top Level)',
    access: 'reviewer, admin roles',
    pageType: 'core workflow page',
    purpose: 'Review queue: show engagements awaiting review, submitted reports, approval interface',
    readsFrom: 'Engagement (status=Under Review), Report, ReviewLog',
    actions: 'Approve, request changes, reject reports',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid workflow page for reviewers.',
  },
  {
    route: '/feedback',
    file: 'Feedback.js',
    navLabel: 'Feedback',
    section: 'Main Navigation (Top Level)',
    access: 'All authenticated users',
    pageType: 'internal utility page',
    purpose: 'User feedback/issue reporting: create feedback items, triage, track status',
    readsFrom: 'FeedbackItem, FeedbackComment',
    actions: 'Create, view, filter feedback',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid utility page.',
  },
  {
    route: '/help',
    file: 'Help.js',
    navLabel: 'Help (accessible via info icon)',
    section: 'Documentation',
    access: 'All authenticated users',
    pageType: 'documentation/help page',
    purpose: 'Internal user guide: topics on workflow, methodology, controls, reporting, admin, workspace architecture',
    readsFrom: 'None (static content + search)',
    actions: 'Search, navigate topics',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Comprehensive help system.',
  },

  // ========== TIER 2: Admin Subsections ==========
  {
    route: '/admin/risk-library',
    file: 'AdminRiskLibrary.js',
    navLabel: 'Risk Library',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage risk library: create, edit, disable, link controls',
    readsFrom: 'RiskLibrary, ControlLibrary, RiskSuggestion',
    actions: 'Create, edit, delete, link controls',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/control-library',
    file: 'AdminControlLibrary.js',
    navLabel: 'Control Library',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage control library: create, edit, link risks',
    readsFrom: 'ControlLibrary, RiskLibrary',
    actions: 'Create, edit, delete, link risks',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/methodologies',
    file: 'AdminMethodologies.js',
    navLabel: 'Methodologies',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage assessment methodologies: define intake sections, risk categories, control frameworks',
    readsFrom: 'Methodology',
    actions: 'Create, edit, delete',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/narratives',
    file: 'AdminNarratives.js',
    navLabel: 'Narrative Templates',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage narrative templates for report sections',
    readsFrom: 'NarrativeTemplate',
    actions: 'Create, edit, delete, organize by section/methodology',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/users',
    file: 'AdminUsers.js',
    navLabel: 'Users',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage team member roles and access',
    readsFrom: 'User (built-in)',
    actions: 'Update roles, manage permissions',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/invitations',
    file: 'AdminInvitations.js',
    navLabel: 'Invitations',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage workspace access invitations',
    readsFrom: 'UserInvitation',
    actions: 'Invite users, update status, resend invitations',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/industries',
    file: 'AdminIndustries.js',
    navLabel: 'Industries',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage industry classifications',
    readsFrom: 'Industry',
    actions: 'Create, edit, delete',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/jurisdictions',
    file: 'AdminJurisdictions.js',
    navLabel: 'Jurisdictions',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Manage jurisdiction rules, requirements, reporting thresholds',
    readsFrom: 'NightwatchJurisdictionRule',
    actions: 'Create, edit, view regulatory requirements',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/suggestions',
    file: 'AdminSuggestions.js',
    navLabel: 'Suggestions Queue',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Review analyst-submitted risk/control suggestions, approve to library',
    readsFrom: 'RiskSuggestion, ControlChangeProposal',
    actions: 'Approve, reject, discuss suggestions',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/audit-log',
    file: 'AdminAuditLog.js',
    navLabel: 'Audit Log',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'System audit trail: field-level changes, user actions, timestamps',
    readsFrom: 'AuditLog',
    actions: 'Search, filter, export audit records',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/governance',
    file: 'AdminGovernance.js',
    navLabel: 'Governance & Permissions',
    section: 'Admin',
    access: 'admin, super_admin',
    pageType: 'admin page',
    purpose: 'Manage roles, permissions, segregation of duties, approval queues',
    readsFrom: 'RoleDefinition, PermissionDefinition, ApprovalRequest, OverrideLog',
    actions: 'Define roles, assign permissions, review overrides, manage approvals',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/library-review',
    file: 'LibraryReviewDashboard.js',
    navLabel: 'Library Review Dashboard',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Dashboard to review and approve proposed library items (risks/controls)',
    readsFrom: 'RiskChangeProposal, ControlChangeProposal, RiskLibrary, ControlLibrary',
    actions: 'Approve, reject, discuss proposals',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/risk-proposals',
    file: 'AdminRiskProposals.js',
    navLabel: 'Risk Proposals',
    section: 'Admin',
    access: 'admin, super_admin, compliance_admin',
    pageType: 'admin page',
    purpose: 'Review analyst risk change proposals',
    readsFrom: 'RiskChangeProposal',
    actions: 'Review, approve, reject proposals',
    disposition: 'KEEP as-is',
    misplacement: 'None',
    notes: 'Valid admin tool.',
  },
  {
    route: '/admin/test-scenarios',
    file: 'AdminTestScenarios.js',
    navLabel: 'Test Scenario Generator',
    section: 'Admin (Internal Tools - Super Admin Only)',
    access: 'admin, super_admin',
    pageType: 'internal utility page',
    purpose: 'Generate fictional test data (clients, engagements, intake, risks, controls) for QA',
    readsFrom: 'None (generates)',
    actions: 'Create test scenarios, delete test data',
    disposition: 'KEEP but verify no generated artifacts leak to user-facing reports',
    misplacement: 'None (correctly labeled Internal Tools)',
    notes: 'Valid internal tool. Must ensure test data is properly tagged and excluded from production reports.',
  },
  {
    route: '/admin/feature-flags',
    file: 'AdminFeatureFlags.js',
    navLabel: 'Feature Flags',
    section: 'Admin (Internal Tools)',
    access: 'admin, super_admin',
    pageType: 'internal utility page',
    purpose: 'Enable/disable features for testing or gradual rollout',
    readsFrom: 'FeatureFlag',
    actions: 'Toggle flags',
    disposition: 'KEEP as-is',
    misplacement: 'None (correctly internal)',
    notes: 'Valid internal tool.',
  },
  {
    route: '/admin/release-log',
    file: 'AdminReleaseLog.js',
    navLabel: 'Release Log',
    section: 'Admin (Internal Tools)',
    access: 'admin, super_admin',
    pageType: 'internal utility page',
    purpose: 'Track system releases, versions, deployment events',
    readsFrom: 'ReleaseLog',
    actions: 'View releases, create release notes',
    disposition: 'KEEP as-is',
    misplacement: 'None (correctly internal)',
    notes: 'Valid internal tool.',
  },

  // ========== TIER 3: Accidental/Generated Report Pages (marked for deletion) ==========
  {
    route: '/verification-report-a1847',
    file: 'VerificationReportA1847.js',
    navLabel: 'None (orphaned)',
    section: 'None (orphaned)',
    access: 'admin only (hardcoded)',
    pageType: 'accidental/generated page',
    purpose: 'Single hard-coded verification report viewer for specific upgrade run',
    readsFrom: 'Hard-coded data',
    actions: 'View only',
    disposition: 'ARCHIVE/DELETE CANDIDATE',
    misplacement: 'YES — Report page existing outside Reports. Should only be in Reports page.',
    flagged: 'accidental_generation, report_outside_reports, single_use_orphaned',
    notes: 'This is a generated artifact that should never have been a standalone page. Root cause: old report publication pattern. Should be deleted; users should view via Reports page instead.',
  },
  {
    route: '/nightwatch-verification-report',
    file: 'NightwatchVerificationReport.js',
    navLabel: 'None (orphaned)',
    section: 'None (orphaned)',
    access: 'admin only',
    pageType: 'accidental/generated page',
    purpose: 'Verification report viewer for NW-UPGRADE-010',
    readsFrom: 'Hard-coded data',
    actions: 'View only',
    disposition: 'ARCHIVE/DELETE CANDIDATE',
    misplacement: 'YES — Report page existing outside Reports. Should only be in Reports page.',
    flagged: 'accidental_generation, report_outside_reports, upgrade_specific_orphaned',
    notes: 'Another generated artifact page. Layout.js line 97 references this as "reload reports" button. Should be removed; users navigate via Reports page.',
  },

  // ========== TIER 4: Orphaned/Broken Pages (deleted already) ==========
  {
    route: '/output-classification-summary',
    file: 'OutputClassificationSummary.js (DELETED)',
    navLabel: 'None',
    section: 'None',
    access: 'N/A',
    pageType: 'deleted page',
    purpose: 'Was: classification audit page',
    readsFrom: 'N/A',
    actions: 'N/A',
    disposition: 'DELETED in NW-UPGRADE-011',
    misplacement: 'Was report outside Reports',
    notes: 'Removed per cleanup directive.',
  },
  {
    route: '/output-classification-debug',
    file: 'OutputClassificationDebug.js (DELETED)',
    navLabel: 'None',
    section: 'None',
    access: 'N/A',
    pageType: 'deleted page',
    purpose: 'Was: internal debug dashboard for output routing',
    readsFrom: 'N/A',
    actions: 'N/A',
    disposition: 'DELETED in NW-UPGRADE-011',
    misplacement: 'Was in admin navigation',
    notes: 'Removed per NW-UPGRADE-011 cleanup.',
  },
  {
    route: '/nw010b-routing-diagnostic',
    file: 'NW010BRoutingDiagnostic.js (DELETED)',
    navLabel: 'None',
    section: 'None',
    access: 'N/A',
    pageType: 'deleted page',
    purpose: 'Was: diagnostic page explaining routing architecture',
    readsFrom: 'N/A',
    actions: 'N/A',
    disposition: 'DELETED in NW-UPGRADE-011',
    misplacement: 'Was linked from Reports page',
    notes: 'Removed per cleanup directive.',
  },

  // ========== TIER 5: Likely empty/placeholder pages (in other_files) ==========
  {
    route: '/nw-v17-summary',
    file: 'NightwatchV17Summary.js',
    navLabel: 'None (orphaned)',
    section: 'None',
    access: 'unknown',
    pageType: 'likely placeholder/orphaned',
    purpose: 'Version-specific summary page (unclear purpose)',
    readsFrom: 'Unknown',
    actions: 'Unknown',
    disposition: 'REVIEW/DELETE CANDIDATE',
    misplacement: 'Unclear purpose; likely orphaned version artifact',
    notes: 'Multiple version-specific summary pages exist (v09, v15, v17, v18). Unclear if still used or development artifacts.',
  },
  {
    route: '/nw-v18-summary',
    file: 'NightwatchV18Summary.js',
    navLabel: 'None (orphaned)',
    section: 'None',
    access: 'unknown',
    pageType: 'likely placeholder/orphaned',
    purpose: 'Version-specific summary page',
    readsFrom: 'Unknown',
    actions: 'Unknown',
    disposition: 'REVIEW/DELETE CANDIDATE',
    misplacement: 'Likely orphaned version artifact',
    notes: 'See v17 above.',
  },
];

export default function PageInventoryAudit() {
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? INVENTORY : INVENTORY.filter(p => p[filter]);

  const stats = {
    total: INVENTORY.length,
    topLevelNav: INVENTORY.filter(p => p.section === 'Main Navigation (Top Level)').length,
    adminPages: INVENTORY.filter(p => p.pageType === 'admin page').length,
    reportPages: INVENTORY.filter(p => p.pageType === 'report page').length,
    workflowPages: INVENTORY.filter(p => p.pageType === 'core workflow page').length,
    accidentalPages: INVENTORY.filter(p => p.pageType === 'accidental/generated page').length,
    deletedPages: INVENTORY.filter(p => p.pageType === 'deleted page').length,
    orphanedCandidates: INVENTORY.filter(p => p.disposition?.includes('DELETE CANDIDATE')).length,
    misplacedPages: INVENTORY.filter(p => p.misplacement?.includes('YES')).length,
  };

  const toggleExpanded = (idx) => {
    setExpanded(e => ({ ...e, [idx]: !e[idx] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Architecture Inventory & Audit</h1>
        <p className="text-sm text-slate-600">Complete audit of all pages in Nightwatch. Identifies duplicates, misplacements, and cleanup candidates.</p>
      </div>

      {/* Executive Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Total Pages</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Top-Level Nav</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.topLevelNav}</p>
        </div>
        <div className="bg-white rounded-lg border border-blue-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Admin Pages</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.adminPages}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <p className="text-xs text-red-500 uppercase font-semibold">Delete Candidates</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.accidentalPages}</p>
        </div>
      </div>

      {/* Key Findings */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h2 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Key Findings
        </h2>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>✓ <strong>{stats.topLevelNav} core workflow pages</strong> in main navigation (Dashboard, Clients, Engagements, Tasks, Reports, Admin, Reviewer, Feedback, Help)</li>
          <li>⚠ <strong>{stats.accidentalPages} accidental/generated report pages</strong> that exist outside Reports: VerificationReportA1847, NightwatchVerificationReport</li>
          <li>✓ <strong>{stats.adminPages} admin subsection pages</strong> correctly organized under Admin</li>
          <li>⚠ <strong>{stats.deletedPages} previously deleted pages</strong> (OutputClassificationSummary, OutputClassificationDebug, NW010BRoutingDiagnostic) in NW-UPGRADE-011</li>
          <li>❓ <strong>Multiple orphaned version-specific pages</strong> (NightwatchV09, V15, V17, V18 Summary/Audit/VerificationReport) — status unclear</li>
          <li>✓ <strong>Reports page hardened</strong> in NW-UPGRADE-011 to read only PublishedOutput (classification=report, status=published)</li>
        </ul>
      </div>

      {/* Full Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Full Page Inventory ({filtered.length})</h3>
          <div className="flex items-center gap-2">
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-slate-300"
            >
              <option value="all">All Pages</option>
              <option value="flagged">Flagged for Review</option>
              <option value="misplacement">Misplaced</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200 max-h-[800px] overflow-y-auto">
          {filtered.map((page, idx) => (
            <div key={idx} className="hover:bg-slate-50">
              <button
                onClick={() => toggleExpanded(idx)}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{page.file}</code>
                    {page.flagged && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Flag
                      </span>
                    )}
                    {page.disposition?.includes('DELETE') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
                        <Trash2 className="w-3 h-3" /> Candidate
                      </span>
                    )}
                    {page.misplacement?.includes('YES') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold">
                        <Eye className="w-3 h-3" /> Misplaced
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900">{page.navLabel || '(No nav label)'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{page.purpose}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded[idx] ? 'rotate-180' : ''}`} />
              </button>

              {expanded[idx] && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="font-semibold text-slate-700">Route</p><code className="text-slate-600 bg-white px-2 py-0.5 rounded text-[10px]">{page.route}</code></div>
                    <div><p className="font-semibold text-slate-700">Section</p><p className="text-slate-600">{page.section}</p></div>
                    <div><p className="font-semibold text-slate-700">Access</p><p className="text-slate-600">{page.access}</p></div>
                    <div><p className="font-semibold text-slate-700">Type</p><p className="text-slate-600">{page.pageType}</p></div>
                    <div><p className="font-semibold text-slate-700">Reads From</p><p className="text-slate-600">{page.readsFrom}</p></div>
                    <div><p className="font-semibold text-slate-700">Actions</p><p className="text-slate-600">{page.actions}</p></div>
                  </div>
                  <div><p className="font-semibold text-slate-700 mb-1">Disposition</p><p className={`px-2 py-1 rounded ${page.disposition?.includes('KEEP') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{page.disposition}</p></div>
                  {page.notes && <div><p className="font-semibold text-slate-700 mb-1">Notes</p><p className="text-slate-600 italic">{page.notes}</p></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cleanup Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Cleanup Recommendations</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">🗑 Archive/Delete (2 pages):</p>
            <ul className="text-sm text-slate-700 space-y-1 pl-4">
              <li>• <code className="bg-white px-1 rounded">VerificationReportA1847.js</code> — Single hard-coded report page. Users view via Reports page.</li>
              <li>• <code className="bg-white px-1 rounded">NightwatchVerificationReport.js</code> — Upgrade-specific report page. Users view via Reports page.</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">? Review Status (6+ pages):</p>
            <ul className="text-sm text-slate-700 space-y-1 pl-4">
              <li>• <code className="bg-white px-1 rounded">NightwatchV09/V15/V17/V18*</code> — Multiple version-specific pages. Unclear if still in use. Check if they're development artifacts or active diagnostic pages.</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">✓ Keep As-Is (25+ pages):</p>
            <p className="text-sm text-slate-700">All core workflow pages, admin subsections, and help/documentation pages are correctly organized and should remain.</p>
          </div>
        </div>
      </div>

      {/* Route Anomalies */}
      <div className="bg-slate-900 text-white rounded-lg p-4">
        <h3 className="font-semibold mb-3">Route Anomalies & Misplacements</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-amber-300 mb-1">Reports Outside Reports Page (2):</p>
            <ul className="space-y-1 pl-4 text-slate-300">
              <li>• /verification-report-a1847 — Hard-coded specific report page</li>
              <li>• /nightwatch-verification-report — Upgrade verification report page</li>
              <li><strong className="text-amber-300">Fix:</strong> All reports should route through Reports.js only. Delete these pages.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-amber-300 mb-1">Orphaned Version Pages (6+):</p>
            <ul className="space-y-1 pl-4 text-slate-300">
              <li>• NightwatchV09/V15/V17/V18 Summary, Audit, VerificationReport, InternalAudit, DeliveryGateSummary</li>
              <li><strong className="text-amber-300">Fix:</strong> Audit these pages. If they're historical/reference, move to documentation. If development artifacts, delete.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-amber-300 mb-1">Admin Navigation Leakage:</p>
            <ul className="space-y-1 pl-4 text-slate-300">
              <li>• None currently detected. Admin pages properly organized under Admin section.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Audit Notes */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 space-y-2">
        <p><strong>Audit Completed:</strong> March 10, 2026</p>
        <p><strong>Scope:</strong> All pages discoverable from Layout.js NAV_ITEMS, Admin subsections, and pages/ directory</p>
        <p><strong>Method:</strong> Static code review + route analysis</p>
        <p><strong>Status:</strong> Inventory complete. Next step: confirm status of version-specific pages and delete report pages outside Reports.</p>
      </div>
    </div>
  );
}