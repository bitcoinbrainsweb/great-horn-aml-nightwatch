import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPORT_DATE = '2026-03-10';
const REPORT_ID = 'M4827';

const CHECKS = [
  {
    n: 1,
    title: 'Engagement Lock — Intake Tab',
    result: 'PASS',
    where: 'components/engagement/IntakeTab.jsx',
    what: 'isLocked prop passed from EngagementDetail. All inputs, selects, switches, and textareas receive disabled={isLocked}. Save Section button hidden when locked. Lock notice banner displayed.',
    remaining: 'None.',
  },
  {
    n: 2,
    title: 'Engagement Lock — Risks Tab',
    result: 'PASS',
    where: 'components/engagement/RisksTab.jsx',
    what: 'isLocked prop added. Suggested Risks and Add Risk buttons disabled when locked. Likelihood and Impact selects disabled. Analyst Rationale textarea disabled. Remove button hidden when locked. Lock notice banner displayed.',
    remaining: 'None.',
  },
  {
    n: 3,
    title: 'Engagement Lock — Controls Tab',
    result: 'PASS',
    where: 'components/engagement/ControlsTab.jsx',
    what: 'isLocked prop added. Add Suggested Controls and Calculate Residual buttons hidden when locked. Control Present switch disabled. All three effectiveness selects disabled. Evidence Reference, Sample Size, Testing Notes, Sample Results, Reviewer Notes, Testing Conclusion fields disabled. Reviewer Sign-Off switch disabled. Lock notice banner displayed.',
    remaining: 'None.',
  },
  {
    n: 4,
    title: 'Engagement Lock — isLocked prop wired from EngagementDetail',
    result: 'PASS',
    where: 'pages/EngagementDetail.jsx',
    what: 'isLocked={!!engagement.is_locked} passed into IntakeTab, RisksTab, and ControlsTab. EngagementLockBanner still rendered independently above tabs. Unlock action preserved (Technical Admin and Compliance Admin only).',
    remaining: 'None.',
  },
  {
    n: 5,
    title: 'Task Delete — ConfirmDialog with typed confirmation',
    result: 'PASS',
    where: 'pages/EngagementDetail.jsx',
    what: 'confirmDeleteTask state added. Delete Trash2 button now calls setConfirmDeleteTask(t) instead of deleteTask() directly. ConfirmDialog renders with confirmWord="DELETE" and actionLabel="Delete Task". deleteTask() function updated to accept full task object and clears confirmDeleteTask on completion. AuditLog write preserved.',
    remaining: 'None.',
  },
  {
    n: 6,
    title: 'Submit for Review — Role guard enforced',
    result: 'PASS',
    where: 'components/engagement/ReportTab.jsx',
    what: 'isAnalyst computed as: user.email === engagement.assigned_analyst || isAdmin. Submit for Review button now conditionally renders only when isDraft && isAnalyst. When isDraft && !isAnalyst, a read-only italic message displays: "Only the assigned analyst or admin can submit for review." Reviewer assignment check preserved (error shown if no reviewer assigned).',
    remaining: 'None.',
  },
  {
    n: 7,
    title: 'Reviewer assignment still required before Submit for Review',
    result: 'PASS',
    where: 'components/engagement/ReportTab.jsx:submitForReview()',
    what: 'submitForReview() still checks !engagement.assigned_reviewer and sets actionError before proceeding. This guard was not touched and remains intact.',
    remaining: 'None.',
  },
  {
    n: 8,
    title: 'Client Delete Gate — Inactive-first requirement',
    result: 'PASS',
    where: 'pages/Clients.jsx',
    what: 'Delete button (Trash2) now only renders when: (user.role === "super_admin" || user.role === "admin") AND c.status === "Inactive". Active, Prospect, or any non-Inactive clients no longer show the delete button for any role. Archive-first pattern enforced. Active engagement guardrail in handleDelete() preserved. Typed confirmation (client legal name) preserved.',
    remaining: 'None.',
  },
  {
    n: 9,
    title: 'No Regression — Report generation and lifecycle',
    result: 'PASS',
    where: 'components/engagement/ReportTab.jsx',
    what: 'generateDraft(), saveChanges(), approveReport(), finalizeReport(), markExported(), exportPDF(), exportWord() — all untouched. Status guards (isDraft, isUnderReview, isApproved, isFinalized) untouched. Integrity seal generation untouched.',
    remaining: 'None.',
  },
  {
    n: 10,
    title: 'No Regression — Engagement lock/unlock and integrity seal',
    result: 'PASS',
    where: 'components/engagement/ReportTab.jsx / EngagementLockBanner.jsx',
    what: 'finalizeReport() still sets is_locked, locked_by, locked_at, integrity_seal on Engagement. EngagementLockBanner still renders with unlock action gated to compliance_admin/super_admin/admin. Stale-seal warning behavior unchanged.',
    remaining: 'None.',
  },
  {
    n: 11,
    title: 'No Regression — Invitation-only access',
    result: 'PASS',
    where: 'Layout.js',
    what: 'UserInvitation check on login unchanged. Allowed domain check unchanged. Platform admin bypass (role === "admin") added in previous session for builder access — preserved as-is.',
    remaining: 'None.',
  },
  {
    n: 12,
    title: 'No Regression — Amanda compliance_admin mapping',
    result: 'PASS',
    where: 'Layout.js',
    what: 'Amanda auto-map logic (amanda@greathornaml.com → compliance_admin) unchanged.',
    remaining: 'None.',
  },
  {
    n: 13,
    title: 'No Regression — Audit log writing',
    result: 'PASS',
    where: 'pages/EngagementDetail.jsx / ReportTab / RisksTab / ControlsTab',
    what: 'logAudit() calls preserved in deleteTask() (updated to use task object but same log fields), updateTaskStatus(), addTask(), risk accept/remove, control assessment update, report lifecycle, engagement status change. No audit calls were removed.',
    remaining: 'None.',
  },
  {
    n: 14,
    title: 'No Regression — Risk snapshot panel, progress tracker, compliance overview',
    result: 'PASS',
    where: 'pages/EngagementDetail.jsx',
    what: 'RiskSnapshotPanel, ProgressTracker, IntegrityPanel, EngagementLockBanner — all still imported and rendered in EngagementDetail above the tabs, unchanged.',
    remaining: 'None.',
  },
  {
    n: 15,
    title: 'No Regression — Test scenario generator',
    result: 'PASS',
    where: 'pages/AdminTestScenarios.jsx',
    what: 'AdminTestScenarios.jsx was not modified in this pass. File is unchanged from A1847 audit confirmation.',
    remaining: 'None.',
  },
];

const REPORT_MD = `# Nightwatch Critical Guardrail Repair & Re-Verification M4827
**Great Horn AML Nightwatch**
Audit Date: ${REPORT_DATE} | Scope: Targeted re-verification of 4 critical guardrail fixes

---

## FIXES APPLIED

### 1. Engagement Lock Enforcement (IntakeTab, RisksTab, ControlsTab)
- isLocked prop passed from EngagementDetail to all three tabs
- All form controls disabled when is_locked === true
- Action buttons hidden or disabled when locked
- Lock notice banner added to each tab
- Save/update actions blocked

### 2. Task Delete Confirmation
- confirmDeleteTask state added to EngagementDetail
- Trash2 button now triggers ConfirmDialog (not immediate delete)
- confirmWord="DELETE" typed confirmation required
- AuditLog write preserved on confirmed deletion

### 3. Submit for Review — Role Guard
- isAnalyst = user.email === engagement.assigned_analyst || isAdmin
- Submit for Review button only shown when isDraft && isAnalyst
- Non-analysts see informational message instead
- Reviewer assignment check preserved

### 4. Client Delete Gate — Inactive-First
- Delete button only visible when status === 'Inactive' AND super_admin/admin
- Active/Prospect clients: no delete button shown for any role
- Active engagement guardrail preserved in handleDelete()
- Typed confirmation preserved

---

## VERIFICATION RESULTS

| # | Item | Result | Where |
|---|------|--------|-------|
| 1 | Engagement lock — IntakeTab read-only | ✅ PASS | IntakeTab.jsx |
| 2 | Engagement lock — RisksTab read-only | ✅ PASS | RisksTab.jsx |
| 3 | Engagement lock — ControlsTab read-only | ✅ PASS | ControlsTab.jsx |
| 4 | isLocked prop wired from EngagementDetail | ✅ PASS | EngagementDetail.jsx |
| 5 | Task delete requires ConfirmDialog | ✅ PASS | EngagementDetail.jsx |
| 6 | Submit for Review requires analyst/admin role | ✅ PASS | ReportTab.jsx |
| 7 | Reviewer assignment still required | ✅ PASS | ReportTab.jsx |
| 8 | Client delete requires Inactive status | ✅ PASS | Clients.jsx |
| 9 | Report generation and lifecycle | ✅ PASS | ReportTab.jsx |
| 10 | Engagement lock/unlock and integrity seal | ✅ PASS | ReportTab / LockBanner |
| 11 | Invitation-only access | ✅ PASS | Layout.js |
| 12 | Amanda compliance_admin mapping | ✅ PASS | Layout.js |
| 13 | Audit log writing | ✅ PASS | All modified files |
| 14 | Risk snapshot, progress tracker, integrity panel | ✅ PASS | EngagementDetail.jsx |
| 15 | Test scenario generator | ✅ PASS | AdminTestScenarios.jsx |

---

## FINAL SCORECARD

- Total checks run: 15
- PASS: 15
- WARNING: 0
- FAIL: 0

## SAFE-TO-PROCEED RECOMMENDATION

✅ YES — Safe for next upgrade.

All 4 critical guardrail issues from A1847 are resolved. 
All regression items confirmed intact.
No new issues introduced.

---

*Report: Nightwatch Critical Guardrail Repair & Re-Verification M4827 · Great Horn AML · ${REPORT_DATE}*
`;

const RESULT_CONFIG = {
  PASS: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'PASS' },
  WARN: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'WARNING' },
  FAIL: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'FAIL' },
};

function ResultBadge({ result }) {
  const cfg = RESULT_CONFIG[result] || RESULT_CONFIG.WARN;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function CheckRow({ check }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
          <span className="text-xs text-slate-400 font-mono w-5 flex-shrink-0">{check.n}</span>
          <span className="text-sm font-medium text-slate-900 truncate">{check.title}</span>
        </div>
        <ResultBadge result={check.result} />
      </button>
      {open && (
        <div className="px-10 pb-4 space-y-2">
          <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Where:</span> <code className="bg-slate-100 px-1 rounded">{check.where}</code></p>
          <p className="text-xs text-slate-600"><span className="font-semibold text-slate-700">What was checked:</span> {check.what}</p>
          {check.remaining && <p className="text-xs text-emerald-700"><span className="font-semibold">Remaining issues:</span> {check.remaining}</p>}
        </div>
      )}
    </div>
  );
}

export default function VerificationReportM4827() {
  const pass = CHECKS.filter(c => c.result === 'PASS').length;
  const warn = CHECKS.filter(c => c.result === 'WARN').length;
  const fail = CHECKS.filter(c => c.result === 'FAIL').length;

  function download() {
    const blob = new Blob([REPORT_MD], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Nightwatch_Guardrail_Reverification_M4827.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  const fixes = [
    { label: 'Engagement Lock Enforcement', detail: 'IntakeTab, RisksTab, ControlsTab now fully read-only when is_locked is true. Lock notice shown in each tab.' },
    { label: 'Task Delete Confirmation', detail: 'Delete button now opens ConfirmDialog requiring typed "DELETE" before proceeding.' },
    { label: 'Submit for Review — Role Guard', detail: 'Only assigned_analyst or isAdmin can submit. Others see informational message. Reviewer assignment check preserved.' },
    { label: 'Client Delete Gate', detail: 'Delete button only shown for super_admin/admin AND only when client status === "Inactive". Active engagement guardrail preserved.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={download} variant="outline" className="gap-2 text-xs">
          <Download className="w-3 h-3" /> Download M4827 .md
        </Button>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Checks', value: CHECKS.length, cls: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'PASS', value: pass, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'WARNING', value: warn, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'FAIL', value: fail, cls: 'bg-red-50 border-red-200 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.cls}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-1 opacity-70 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Safe to proceed */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-900">✅ YES — Safe to proceed with next upgrade</p>
          <p className="text-xs text-emerald-700 mt-0.5">All 4 critical guardrail issues from A1847 resolved. All 15 checks passed. No regressions detected.</p>
        </div>
      </div>

      {/* Fixes applied */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Fixes Applied in This Pass</p>
        </div>
        <div className="divide-y divide-slate-100">
          {fixes.map((f, i) => (
            <div key={i} className="px-5 py-3">
              <p className="text-sm font-semibold text-slate-900">{i + 1}. {f.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{f.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full check list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Full Verification Results (click to expand)</p>
        </div>
        {CHECKS.map(c => <CheckRow key={c.n} check={c} />)}
      </div>

      <p className="text-xs text-slate-400 text-center pb-2">
        Nightwatch Critical Guardrail Repair & Re-Verification M4827 · Great Horn AML · {REPORT_DATE}
      </p>
    </div>
  );
}