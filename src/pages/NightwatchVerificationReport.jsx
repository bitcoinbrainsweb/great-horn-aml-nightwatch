import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/ui/PageHeader';
import VerificationReportA1847 from './VerificationReportA1847';
import VerificationReportM4827 from './VerificationReportM4827';
import VerificationReportA7364 from './VerificationReportA7364';
import VerificationReportB6142 from './VerificationReportB6142';
import VerificationReportU4827 from './VerificationReportU4827';
import VerificationReportC4186 from './VerificationReportC4186';
import VerificationReportH7314 from './VerificationReportH7314';

// ── shared helpers ────────────────────────────────────────────────────────────

function Badge({ label, value, variant }) {
  const cls = {
    pass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warn: 'bg-amber-50 border-amber-200 text-amber-700',
    fail: 'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-slate-50 border-slate-200 text-slate-700',
  }[variant] || 'bg-slate-50 border-slate-200 text-slate-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {value} {label}
    </span>
  );
}

function ResultBadge({ result }) {
  if (result === 'PASS') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> PASS
    </span>
  );
  if (result === 'PARTIAL') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-3 h-3" /> PARTIAL
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
      <XCircle className="w-3 h-3" /> FAIL
    </span>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              {row.map((cell, j) => <td key={j} className="px-4 py-2.5 text-slate-700 text-xs">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ number, title, result, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{number}</span>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <ResultBadge result={result} />
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-0 border-t border-slate-100">{children}</div>}
    </div>
  );
}

function Tick() { return <span className="text-emerald-600 font-bold">✅</span>; }

// ── top-level report card (collapsed by default) ──────────────────────────────

function ReportCard({ id, name, date, scope, badges, statusLabel, statusColor, children }) {
  const [open, setOpen] = useState(false);
  const statusCls = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  }[statusColor] || 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* always-visible header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-6 py-5 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-widest">{id}</span>
                <span className="text-xs text-slate-400">{date}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCls}`}>{statusLabel}</span>
              </div>
              <p className="text-base font-bold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{scope}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {badges.map((b, i) => <Badge key={i} {...b} />)}
          </div>
        </div>
      </button>

      {/* collapsible body */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-6">
          {children}
        </div>
      )}
    </div>
  );
}

// ── V1 content ────────────────────────────────────────────────────────────────

function V1Content() {
  const REPORT_MD = `# Nightwatch Verification Report V1\n\n**Build Version:** Post-Repair Update — March 2026\n**Date:** 2026-03-10\n`;
  function download() {
    const blob = new Blob([REPORT_MD], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Nightwatch_Verification_V1.md'; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Checked', value: '6', color: 'bg-slate-50 text-slate-700 border-slate-200' },
          { label: 'PASS', value: '5', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'PARTIAL', value: '1', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'FAIL', value: '0', color: 'bg-red-50 text-red-700 border-red-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-70 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <Section number="1" title="Report Status Schema Alignment" result="PASS">
        <p className="text-xs text-slate-500 mt-3 mb-2">All application layers use the canonical five-state lifecycle: <code className="bg-slate-100 px-1 rounded font-mono">Draft → Under Review → Approved → Finalized → Exported</code></p>
        <Table headers={['Location', 'Finding']} rows={[
          ['entities/Report.json', <><Tick /> Enum contains all 5 values in correct order</>],
          ['pages/Reports.js (line 46)', <><Tick /> Filter dropdown lists all 5 values</>],
          ['components/engagement/ReportTab.js', <><Tick /> All 5 transitions implemented and correct</>],
          ['components/engagement/ReviewTab.js', <><Tick /> Approved → "Approved"; Changes Requested → "Draft"</>],
          ['components/engagement/RiskSnapshotPanel.js', <><Tick /> reportStatusColor map covers all 5 statuses</>],
          ['pages/EngagementDetail.js (line 98)', <><Tick /> Completion guardrail checks correct statuses</>],
          ['pages/Help.js', <><Tick /> Lifecycle documentation lists all 5 states correctly</>],
        ]} />
      </Section>

      <Section number="2" title="Engagement Cascade Delete Completeness" result="PASS">
        <p className="text-xs text-slate-500 mt-3 mb-2">All 8 child entity types fetched + deleted in a single <code className="bg-slate-100 px-1 rounded font-mono">Promise.all</code> batch. AuditLog written before engagement deletion.</p>
        <Table headers={['#', 'Entity', 'Status']} rows={[
          ['1','Task',<><Tick /> Deleted</>],['2','IntakeResponse',<><Tick /> Deleted</>],
          ['3','EngagementRisk',<><Tick /> Deleted</>],['4','ControlAssessment',<><Tick /> Deleted</>],
          ['5','Report',<><Tick /> Deleted</>],['6','Document',<><Tick /> Deleted</>],
          ['7','ReviewLog',<><Tick /> Deleted</>],['8','ActivityLog',<><Tick /> Deleted</>],
        ]} />
      </Section>

      <Section number="3" title="Reviewer Permission Enforcement" result="PASS">
        <Table headers={['Action', 'Gate', 'Status']} rows={[
          ['Submit for Review', 'Any authenticated user (by design)', <><Tick /> Open</>],
          ['Approve Report', 'isUnderReview && isReviewer', <><Tick /> Gated</>],
          ['Finalize Report', 'isApproved && isReviewer', <><Tick /> Gated</>],
          ['Submit Review Decision', 'if (!isReviewer) return', <><Tick /> Early-return guard</>],
        ]} />
      </Section>

      <Section number="4" title="Audit Trail Logging" result="PARTIAL">
        <p className="text-xs text-amber-700 mt-3 mb-2 font-medium">⚠️ 12 actions confirmed. Client CRUD and task lifecycle logging unverified.</p>
        <Table headers={['Gap', 'Status']} rows={[
          ['Client CRUD (Clients.js, ClientDetail.js)', '⚠️ Unverified in this pass'],
          ['Task create / delete (EngagementDetail)', '⚠️ No logAudit calls observed — likely gap'],
          ['ControlsTab control assessment updates', '⚠️ File not read — coverage unverified'],
        ]} />
      </Section>

      <Section number="5" title="Progress Tracker Navigation" result="PASS">
        <p className="text-xs text-slate-500 mt-3 mb-2">Controls stage previously had <code className="bg-slate-100 px-1 rounded font-mono">tab: null</code> (non-clickable). Repaired to map to <code className="bg-slate-100 px-1 rounded font-mono">'controls'</code>.</p>
        <Table headers={['Stage', 'Tab Key', 'Status']} rows={[
          ['Client','null','N/A — start state ✅'],['Intake',"'intake'",'✅'],
          ['Risks',"'risks'",'✅'],['Controls',"'controls'",'✅ REPAIRED'],
          ['Report',"'report'",'✅'],['Review',"'review'",'✅'],['Complete','null','N/A — end state ✅'],
        ]} />
      </Section>

      <Section number="6" title="Regression Check" result="PASS">
        <Table headers={['System', 'Status']} rows={[
          ['Test Scenario Generator', '✅ Build error resolved. Logic and cascade-delete intact.'],
          ['Risk Suggestion Engine', '✅ All exports confirmed present.'],
          ['Risk Snapshot Panel', '✅ All 5 report statuses mapped.'],
          ['Progress Tracker', '✅ Controls stage repaired.'],
          ['Help Documentation', '✅ 9 topics; all content accurate.'],
          ['Report Generation (AI)', '✅ InvokeLLM call intact.'],
        ]} />
      </Section>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <strong>3 open issues carried forward:</strong> Client CRUD audit, task lifecycle audit, ControlsTab audit coverage.
      </div>

      <div className="flex justify-end">
        <Button onClick={download} variant="outline" className="gap-2 text-xs">
          <Download className="w-3 h-3" /> Download V1 .md
        </Button>
      </div>
    </div>
  );
}

// ── V2 content ────────────────────────────────────────────────────────────────

function V2Content() {
  function download() {
    const blob = new Blob(['# Nightwatch V2 Verification\n2026-03-10'], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Nightwatch_Verification_V2.md'; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Checked', value: '5', color: 'bg-slate-50 text-slate-700 border-slate-200' },
          { label: 'PASS', value: '4', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'PARTIAL', value: '1', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'FAIL', value: '0', color: 'bg-red-50 text-red-700 border-red-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-70 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <Section number="V2.1" title="Workspace & Multi-tenancy Schema" result="PASS">
        <Table headers={['Entity', 'workspace_id Added', 'Status']} rows={[
          ['Workspace (new)', 'N/A — root entity', <><Tick /> Created</>],
          ['WorkspaceLibraryOverride (new)', 'N/A', <><Tick /> Created</>],
          ['Client / Engagement / Report / Document / Task', 'Yes', <><Tick /> All added</>],
          ['RiskLibrary / ControlLibrary', 'Yes + is_core', <><Tick /> Hybrid model supported</>],
          ['ControlAssessment / NarrativeTemplate / AuditLog', 'Yes', <><Tick /> Added</>],
        ]} />
      </Section>

      <Section number="V2.2" title="Control Testing Extensions" result="PASS">
        <Table headers={['Item', 'Status']} rows={[
          ['ControlAssessment: testing_conclusion', <><Tick /> Added</>],
          ['ControlAssessment: reviewer_sign_off (boolean)', <><Tick /> Added</>],
          ['ControlAssessment: reviewer_sign_off_date', <><Tick /> Added</>],
          ['ControlEvidence entity (new)', <><Tick /> Created</>],
          ['ControlsTab: Testing Conclusion textarea', <><Tick /> Added</>],
          ['ControlsTab: Reviewer Sign-Off toggle with date stamp', <><Tick /> Added</>],
        ]} />
      </Section>

      <Section number="V2.3" title="Build Error — ControlsTab JSX Fix" result="PASS">
        <Table headers={['Error', 'File', 'Resolution']} rows={[
          ['Unexpected token at line 270', 'components/engagement/ControlsTab.jsx', <><Tick /> JSX nesting corrected; build passes</>],
        ]} />
      </Section>

      <Section number="V2.4" title="Help Documentation — New Sections" result="PASS">
        <Table headers={['New Topic', 'Status']} rows={[
          ['Workspace Architecture', <><Tick /> Added</>],
          ['Hybrid Library Model', <><Tick /> Added</>],
          ['Control Testing Program', <><Tick /> Added</>],
          ['Compliance Overview', <><Tick /> Added</>],
          ['Audit Trail', <><Tick /> Added</>],
        ]} />
      </Section>

      <Section number="V2.5" title="V1 Open Issues Status" result="PARTIAL">
        <Table headers={['Issue', 'Status']} rows={[
          ['Client CRUD audit (Clients.js, ClientDetail.js)', '⚠️ Still open'],
          ['Task create/delete audit (EngagementDetail)', '⚠️ Still open'],
          ['ControlsTab audit coverage', <><Tick /> Resolved — logAudit confirmed present</>],
        ]} />
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <strong>2 of 3 V1 open issues remain unresolved.</strong>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={download} variant="outline" className="gap-2 text-xs">
          <Download className="w-3 h-3" /> Download V2 .md
        </Button>
      </div>
    </div>
  );
}

// ── V3 content ────────────────────────────────────────────────────────────────

function V3Content() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Checked', value: '9', color: 'bg-slate-50 text-slate-700 border-slate-200' },
          { label: 'PASS', value: '9', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'PARTIAL', value: '0', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'FAIL', value: '0', color: 'bg-red-50 text-red-700 border-red-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs font-semibold mt-1 opacity-70 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      <Table
        headers={['#', 'Item', 'Result', 'Implementation']}
        rows={[
          ['1', 'Invitation-only access enforced', <ResultBadge result="PASS" />, 'Layout.js: UserInvitation check on login; no valid invite → branded access-denied message'],
          ['2', '"Technical Admin" label applied in UI', <ResultBadge result="PASS" />, 'Layout.js roleName map, AdminUsers ROLES array updated; backend key super_admin preserved'],
          ['3', 'Amanda auto-maps to Compliance Admin', <ResultBadge result="PASS" />, 'Layout.js: auto-assigned compliance_admin on first login'],
          ['4', 'Destructive action protection active', <ResultBadge result="PASS" />, 'ConfirmDialog with typed confirmation on Clients and Engagements. Archive-first model.'],
          ['5', 'Engagement lock works', <ResultBadge result="PASS" />, 'ReportTab.finalizeReport() sets is_locked. EngagementLockBanner shows state + admin unlock.'],
          ['6', 'Integrity seal after finalization', <ResultBadge result="PASS" />, 'generateSeal() hashes risk+control+report. Stored on Report and Engagement. Shown in ReportTab and IntegrityPanel.'],
          ['7', 'Report PDF watermark', <ResultBadge result="PASS" />, 'ReportTab.exportPDF() adds footer watermark with workspace name, date, version, and seal on all pages.'],
          ['8', 'Bitcoin risk intelligence layer', <ResultBadge result="PASS" />, '12 Bitcoin/crypto intake variables + 12 suggestion rules added to riskScoringEngine.'],
          ['9', 'Risk proposal workflow', <ResultBadge result="PASS" />, 'RiskChangeProposal entity. AdminRiskProposals page with approve/reject/revise workflow + audit logging.'],
        ]}
      />

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
        <strong>All V3 verification checks passed.</strong> 2 pre-existing V1 open issues (client CRUD audit, task lifecycle audit) remain as carry-forwards.
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function NightwatchVerificationReport() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Nightwatch Verification Reports"
        subtitle="All platform audit reports · Newest first · Click to expand"
      />

      <div className="space-y-4">

        {/* H7314 — most recent */}
        <ReportCard
          id="H7314"
          name="Narrative Engine & Template Population — Consulting-Grade Report Quality"
          date="2026-03-10"
          scope="9-section implementation: 13 consulting-grade NarrativeTemplate records, structured narrative framework (Context/Observations/Risk Implication/Controls/Conclusion), Generate Narrative button for risks, template-anchored report generation, {{client_name}} placeholders, Evidence Considered blocks, AdminNarratives search/filter/preview UX."
          statusLabel="✅ All Passed — Safe to Proceed"
          statusColor="green"
          badges={[
            { label: 'Checks', value: 12, variant: 'neutral' },
            { label: 'PASS', value: 12, variant: 'pass' },
            { label: 'Templates', value: 13, variant: 'neutral' },
          ]}
        >
          <VerificationReportH7314 />
        </ReportCard>

        {/* C4186 */}
        <ReportCard
          id="C4186"
          name="Manual Control Attachment for Risks — Analyst Workflow Enhancement"
          date="2026-03-10"
          scope="8-section implementation: manual control attachment in Risks and Controls tabs, searchable ControlLibrary modal, duplicate prevention, visual separation (Recommended vs. Additional), manual control badge, audit logging, removal workflow."
          statusLabel="✅ All Passed — Safe to Proceed"
          statusColor="green"
          badges={[
            { label: 'Checks', value: 12, variant: 'neutral' },
            { label: 'PASS', value: 12, variant: 'pass' },
          ]}
        >
          <VerificationReportC4186 />
        </ReportCard>

        {/* U4827 */}
        <ReportCard
          id="U4827"
          name="Library Review Dashboard — Risk and Control Proposal Management"
          date="2026-03-10"
          scope="13-section implementation: dedicated admin workflow for reviewing proposed risks and controls, merge workflow, edit-before-approval, analyst visibility, source badges, full audit logging, summary stats dashboard."
          statusLabel="✅ All Passed — Safe to Proceed"
          statusColor="green"
          badges={[
            { label: 'Checks', value: 17, variant: 'neutral' },
            { label: 'PASS', value: 17, variant: 'pass' },
            { label: 'New Entities', value: 1, variant: 'neutral' },
          ]}
        >
          <VerificationReportU4827 />
        </ReportCard>

        {/* B6142 */}
        <ReportCard
          id="B6142"
          name="Operational Intelligence Upgrade v1 — Reviewer Workflow, Compliance Calendar & Platform Ops"
          date="2026-03-10"
          scope="17-section upgrade: engagement cycle year, score justification & explain score, evidence missing warnings, reviewer dashboard, engagement snapshot on finalization, compliance obligation entity, notification bell, feature flags, release log, admin library source badges."
          statusLabel="✅ All Passed — Safe to Proceed"
          statusColor="green"
          badges={[
            { label: 'Checks', value: 17, variant: 'neutral' },
            { label: 'PASS', value: 17, variant: 'pass' },
            { label: 'New Entities', value: 5, variant: 'neutral' },
          ]}
        >
          <VerificationReportB6142 />
        </ReportCard>

        {/* A7364 */}
        <ReportCard
          id="A7364"
          name="Master Risk & Control Library Migration — Amanda AML Framework"
          date="2026-03-10"
          scope="Full library migration: 28 Amanda framework risks imported, 35 controls imported, 92 risk-to-control mappings rebuilt, 19 legacy items preserved and flagged for admin review. Zero existing engagements or reports modified."
          statusLabel="✅ All Passed — Safe to Proceed"
          statusColor="green"
          badges={[
            { label: 'Checks', value: 10, variant: 'neutral' },
            { label: 'PASS', value: 10, variant: 'pass' },
            { label: 'Risks', value: 28, variant: 'neutral' },
            { label: 'Controls', value: 35, variant: 'neutral' },
          ]}
        >
          <VerificationReportA7364 />
        </ReportCard>

        {/* M4827 */}
        <ReportCard
          id="M4827"
          name="Critical Guardrail Repair & Re-Verification"
          date="2026-03-10"
          scope="Targeted re-verification of 4 critical guardrail fixes: engagement lock enforcement (Intake/Risks/Controls), task delete confirmation, Submit for Review role guard, client delete Inactive-first gate"
          statusLabel="✅ All Passed — Safe to Proceed"
          statusColor="green"
          badges={[
            { label: 'Checks', value: 15, variant: 'neutral' },
            { label: 'PASS', value: 15, variant: 'pass' },
          ]}
        >
          <VerificationReportM4827 />
        </ReportCard>

        {/* A1847 */}
        <ReportCard
          id="A1847"
          name="Full Platform Audit — Post-Upgrade Verification Suite"
          date="2026-03-10"
          scope="Complete 64-point codebase audit: access, security, workspace isolation, audit integrity, controls, risk workflow, templates, reporting, dashboard, help"
          statusLabel="⚠️ Proceed with Caution"
          statusColor="amber"
          badges={[
            { label: 'Checks', value: 64, variant: 'neutral' },
            { label: 'PASS', value: 30, variant: 'pass' },
            { label: 'WARN', value: 20, variant: 'warn' },
            { label: 'FAIL', value: 14, variant: 'fail' },
          ]}
        >
          <VerificationReportA1847 />
        </ReportCard>

        {/* V3 */}
        <ReportCard
          id="V3"
          name="Workflow, Security, Intelligence & UX Upgrade — Verification"
          date="2026-03-10"
          scope="Invitation-only access, Technical Admin label, destructive action protection, engagement lock, integrity seal, risk proposals, Bitcoin risk intelligence"
          statusLabel="✅ All Passed"
          statusColor="green"
          badges={[
            { label: 'Checks', value: 9, variant: 'neutral' },
            { label: 'PASS', value: 9, variant: 'pass' },
          ]}
        >
          <V3Content />
        </ReportCard>

        {/* V2 */}
        <ReportCard
          id="V2"
          name="Workspace Architecture & Multi-Tenancy Update — Verification"
          date="2026-03-10"
          scope="Workspace entity schemas, hybrid library model, control testing extensions, Help docs, ControlsTab build fix"
          statusLabel="⚠️ 1 Partial"
          statusColor="amber"
          badges={[
            { label: 'Checks', value: 5, variant: 'neutral' },
            { label: 'PASS', value: 4, variant: 'pass' },
            { label: 'PARTIAL', value: 1, variant: 'warn' },
          ]}
        >
          <V2Content />
        </ReportCard>

        {/* V1 */}
        <ReportCard
          id="V1"
          name="Post-Repair Build Audit — Verification"
          date="2026-03-10"
          scope="Full codebase review following March 2026 repair update: report schema, cascade delete, reviewer permissions, audit trail, progress tracker, regression"
          statusLabel="⚠️ 1 Partial · 3 Open Issues"
          statusColor="amber"
          badges={[
            { label: 'Checks', value: 6, variant: 'neutral' },
            { label: 'PASS', value: 5, variant: 'pass' },
            { label: 'PARTIAL', value: 1, variant: 'warn' },
          ]}
        >
          <V1Content />
        </ReportCard>

      </div>

      <p className="text-xs text-slate-400 text-center mt-8 pb-6">
        Nightwatch Verification Reports · Great Horn AML · Reports identified by A0000 format from A1847 onwards
      </p>
    </div>
  );
}