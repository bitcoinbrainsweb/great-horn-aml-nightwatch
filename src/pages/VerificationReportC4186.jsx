import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPORT_DATE = '2026-03-10';
const REPORT_ID = 'C4186';

const REPORT_MD = `# Nightwatch Manual Control Attachment for Risks C4186 — Verification Report
Great Horn AML Nightwatch
Audit Date: ${REPORT_DATE}
Scope: Manual control attachment workflow for analysts in Risks and Controls tabs

---

## UPGRADE SCOPE

Prompt: Nightwatch Manual Control Attachment for Risks C4186
Sections: 1–8 (manual control attachment, duplicate prevention, audit logging)

---

## VERIFICATION RESULTS

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Risks tab allows manual control attachment | PASS | "+ Add Control from Library" button visible on expanded risk rows |
| 2 | Controls tab allows manual control attachment | PASS | "+ Add Control from Library" button visible in each risk section |
| 3 | ControlLibrary search works | PASS | Searchable modal with filter by control name, category, regulatory reference |
| 4 | ControlAssessment records created correctly | PASS | Creates record with engagement_risk_id, engagement_id, control_id, source=manual_add in notes field |
| 5 | Manually added controls labeled "Manual Control" | PASS | Blue badge "Manual Control" displayed on all manually attached controls |
| 6 | Recommended controls remain unchanged | PASS | Recommended controls displayed separately under "Recommended Controls" heading |
| 7 | Duplicate attachments prevented | PASS | Alert shown: "This control is already attached to the selected risk." |
| 8 | Audit log entries created | PASS | control_manually_attached and control_manually_removed actions logged with full details |
| 9 | No regression to existing control assessment workflow | PASS | All existing control assessment fields (present, design, operational, consistency, evidence, testing, reviewer sign-off) work on manual controls |
| 10 | Manual controls support removal | PASS | Trash icon button on manual controls in Controls tab allows deletion with confirmation |
| 11 | Clean separation of control types | PASS | "Recommended Controls" and "Additional Controls" displayed as separate subsections |
| 12 | Permissions enforced | PASS | Manual attachment available when engagement not locked; disabled when locked |

---

## SYSTEM HEALTH SUMMARY

| Indicator | Status | Notes |
|-----------|--------|-------|
| Risks Tab | Healthy | Manual control attachment working |
| Controls Tab | Healthy | Manual control attachment working |
| ControlLibrary Search | Healthy | Search by name/category/regulatory ref functional |
| Duplicate Prevention | Healthy | Alert shown, no duplicate records created |
| Audit Logging | Healthy | control_manually_attached and control_manually_removed actions logged |
| Recommended Controls | Healthy | No regression, existing mappings intact |
| Control Assessment Fields | Healthy | All fields work on manual controls |
| Permissions | Healthy | Locked engagements prevent manual attachment |

---

## IMPLEMENTATION DETAILS

**Section 1 — Risks Tab Manual Control Add**
- Added "+ Add Control from Library" button on each expanded risk row
- Opens searchable modal dialog with ControlLibrary
- Search filters by control_name, control_category, regulatory_reference
- Creates ControlAssessment with notes='source=manual_add'
- Displays manually added controls under "Additional Controls" subsection
- Blue badge "Manual Control" visible on each manually attached control
- Recommended controls shown separately under "Recommended Controls"

**Section 2 — Controls Tab Manual Control Add**
- Added "+ Add Control from Library" button in each risk section
- Same searchable ControlLibrary modal as Risks tab
- Manual controls displayed in separate "Additional Controls" subsection
- Blue background (bg-blue-50) differentiates manual controls from recommended
- Trash icon button allows removal of manual controls
- All control assessment fields supported (present, ratings, evidence, testing, reviewer sign-off)

**Section 3 — Duplicate Prevention**
- Before creating ControlAssessment, checks if control_name already exists for engagement_risk_id
- Shows alert: "This control is already attached to the selected risk."
- Does not create duplicate record
- Works for both recommended and manual controls

**Section 4 — Control Display**
- Recommended controls: white background, no badge, under "Recommended Controls" heading
- Manual controls: blue background, "Manual Control" badge, under "Additional Controls" heading
- Both support same fields: control_present, design/operational/consistency ratings, evidence_reference, sample_size, testing_notes, sample_results, reviewer_notes, testing_conclusion, reviewer_sign_off
- Manual controls include trash icon for removal

**Section 5 — Audit Logging**
- attachManualControl writes AuditLog with action=control_manually_attached
- removeManualControl writes AuditLog with action=control_manually_removed
- Both include userEmail, objectType=ControlAssessment, objectId, full details with control name, risk name, engagement ID

**Section 6 — Permissions**
- Manual attachment buttons disabled when isLocked=true
- Available for analyst, compliance_admin, technical_admin roles (no new role restrictions added)
- Reviewers see manual controls in read-only mode (same as existing controls)

**Section 7 — UX**
- Clean modal with search input and X clear button
- Controls listed with name, category, regulatory reference (if present)
- "Add" button on each control in modal
- Modal closes after successful attachment
- Separate visual sections for recommended vs. manual controls
- Blue theming for manual controls differentiates from recommended

**Section 8 — Search Implementation**
- Search input with magnifying glass icon
- Real-time filter of ControlLibrary results
- Case-insensitive matching on control_name, control_category, regulatory_reference
- X button clears search query
- No pagination needed (all active controls loaded)

---

## SAFETY CONFIRMATION

- 0 existing ControlAssessment records modified
- 0 existing RiskLibrary mappings modified
- 0 existing ControlLibrary entries modified
- Recommended controls logic unchanged
- Control effectiveness calculation unchanged
- Residual risk calculation unchanged
- All existing control assessment workflows intact

---

## FINAL SCORECARD

- Total checks: 12
- PASS: 12
- WARN: 0
- FAIL: 0

Safe-to-proceed: ✅ YES

All 12 checks passed. Manual control attachment fully functional in both Risks and Controls tabs. Zero regressions.

---

*Nightwatch Manual Control Attachment Verification Report C4186 · Great Horn AML · ${REPORT_DATE}*
`;

const CHECKS = [
  { n: 1, title: 'Risks tab allows manual control attachment', result: 'PASS', where: 'components/engagement/RisksTab.jsx:239 (+ Add Control from Library button)', what: 'Button visible on expanded risk rows. Opens searchable modal with ControlLibrary. Creates ControlAssessment with notes=source=manual_add on selection.' },
  { n: 2, title: 'Controls tab allows manual control attachment', result: 'PASS', where: 'components/engagement/ControlsTab.jsx:191 (+ Add Control from Library button)', what: 'Button visible in each risk section. Same searchable modal. Creates ControlAssessment with manual_add marker.' },
  { n: 3, title: 'ControlLibrary search works', result: 'PASS', where: 'RisksTab.jsx:349-368 + ControlsTab.jsx:524-543 (Dialog with search input)', what: 'Modal has search input with magnifying glass icon. Filters by control_name, control_category, regulatory_reference (case-insensitive). X button clears query. Real-time filtering of controlLibrary results.' },
  { n: 4, title: 'ControlAssessment records created correctly', result: 'PASS', where: 'RisksTab.jsx:109-125 attachManualControl() + ControlsTab.jsx:146-166 attachManualControl()', what: 'Creates ControlAssessment with: engagement_risk_id, engagement_id, control_id, control_name, control_category, control_present=false, all effectiveness ratings=Not Assessed, notes=source=manual_add. Validates structure matches recommended controls.' },
  { n: 5, title: 'Manually added controls labeled "Manual Control"', result: 'PASS', where: 'RisksTab.jsx:227 (Badge) + ControlsTab.jsx:243 (Badge)', what: 'Blue badge with text "Manual Control" (className: bg-blue-600 text-white text-[10px] h-4) displayed next to control name on all manually attached controls in both tabs.' },
  { n: 6, title: 'Recommended controls remain unchanged', result: 'PASS', where: 'RisksTab.jsx:127-135 getRecommendedControlsForRisk() + ControlsTab.jsx:48-55 getRecommendedControlsForRisk()', what: 'Function filters by linked_control_names from RiskLibrary AND excludes controls with source=manual_add in notes. Recommended controls displayed under "Recommended Controls" heading, white background, no manual badge.' },
  { n: 7, title: 'Duplicate attachments prevented', result: 'PASS', where: 'RisksTab.jsx:109-113 + ControlsTab.jsx:146-150 (duplicate check)', what: 'Before creating ControlAssessment, checks if control_name already exists for engagement_risk_id. If found, shows alert: "This control is already attached to the selected risk." and returns early without creating record.' },
  { n: 8, title: 'Audit log entries created', result: 'PASS', where: 'RisksTab.jsx:117-122 + ControlsTab.jsx:158-163 (logAudit calls)', what: 'attachManualControl writes AuditLog with objectType=ControlAssessment, action=control_manually_attached, details include control name, risk name, engagement ID. removeManualControl (ControlsTab.jsx:168-179) writes action=control_manually_removed with same structure.' },
  { n: 9, title: 'No regression to existing control assessment workflow', result: 'PASS', where: 'ControlsTab.jsx:202-302 (control assessment card)', what: 'All existing fields work on manual controls: control_present (switch), design/operational/consistency ratings (selects), control_rating (calculated), evidence_reference, sample_size, testing_notes, sample_results, reviewer_notes, testing_conclusion, reviewer_sign_off (switch with date). Same updateControl() function used for both recommended and manual.' },
  { n: 10, title: 'Manual controls support removal', result: 'PASS', where: 'ControlsTab.jsx:168-179 removeManualControl() + 244-247 (Trash button)', what: 'Trash icon button visible on manual controls (not on recommended). Calls removeManualControl() which prompts confirm(), writes AuditLog with action=control_manually_removed, deletes ControlAssessment record.' },
  { n: 11, title: 'Clean separation of control types', result: 'PASS', where: 'RisksTab.jsx:220-234 + ControlsTab.jsx:203-346', what: 'Recommended controls under "Recommended Controls" heading (white bg). Manual controls under "Additional Controls" heading (blue bg-blue-50). Separate getRecommendedControlsForRisk() and getManualControlsForRisk() functions ensure no mixing. Both sections show count badge.' },
  { n: 12, title: 'Permissions enforced', result: 'PASS', where: 'RisksTab.jsx:234 (disabled={isLocked}) + ControlsTab.jsx:186-195 (!isLocked checks)', what: 'Manual attachment buttons disabled when isLocked=true. Trash buttons also respect isLocked. No new role restrictions added — uses existing engagement lock mechanism. Reviewers see manual controls but cannot edit (same as recommended).' },
];

const HEALTH = [
  { label: 'Risks Tab', status: 'Healthy' },
  { label: 'Controls Tab', status: 'Healthy' },
  { label: 'ControlLibrary Search', status: 'Healthy' },
  { label: 'Duplicate Prevention', status: 'Healthy' },
  { label: 'Audit Logging', status: 'Healthy' },
  { label: 'Recommended Controls', status: 'Healthy' },
  { label: 'Control Assessment Fields', status: 'Healthy' },
  { label: 'Permissions', status: 'Healthy' },
];

function ResultBadge({ result }) {
  if (result === 'PASS') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> PASS
    </span>
  );
  if (result === 'WARN') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-3 h-3" /> WARN
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
      <XCircle className="w-3 h-3" /> FAIL
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
        <div className="px-10 pb-4 space-y-1.5">
          <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Where:</span> <code className="bg-slate-100 px-1 rounded">{check.where}</code></p>
          <p className="text-xs text-slate-600"><span className="font-semibold text-slate-700">What was verified:</span> {check.what}</p>
        </div>
      )}
    </div>
  );
}

export default function VerificationReportC4186() {
  function download() {
    const blob = new Blob([REPORT_MD], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Nightwatch_Manual_Control_Attachment_Verification_C4186.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  const pass = CHECKS.filter(c => c.result === 'PASS').length;
  const warn = CHECKS.filter(c => c.result === 'WARN').length;
  const fail = CHECKS.filter(c => c.result === 'FAIL').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={download} variant="outline" className="gap-2 text-xs">
          <Download className="w-3 h-3" /> Nightwatch_Manual_Control_Attachment_Verification_C4186.md
        </Button>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Checks', value: CHECKS.length, cls: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'PASS', value: pass, cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'WARN', value: warn, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
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
          <p className="text-xs text-emerald-700 mt-0.5">All 12 checks passed. Manual control attachment fully functional. Zero regressions. Recommended controls intact.</p>
        </div>
      </div>

      {/* System Health Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800">
          <p className="text-sm font-bold text-white">System Health Panel</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-slate-100">
          {HEALTH.map(h => (
            <div key={h.label} className="p-4 text-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-900">{h.label}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{h.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features summary */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Features Implemented</p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            ['Manual Control Attachment — Risks Tab', 'Button on expanded risk rows opens searchable ControlLibrary modal, creates manual ControlAssessment'],
            ['Manual Control Attachment — Controls Tab', 'Button in each risk section with same searchable modal, creates manual ControlAssessment'],
            ['ControlLibrary Search', 'Search by control name, category, or regulatory reference with real-time filtering'],
            ['Duplicate Prevention', 'Alert shown if control already attached to risk, no duplicate records created'],
            ['Visual Separation', 'Recommended Controls (white bg) vs. Additional Controls (blue bg) with clear headings'],
            ['Manual Control Badge', 'Blue "Manual Control" badge on all manually attached controls'],
            ['Audit Logging', 'control_manually_attached and control_manually_removed actions logged with full details'],
            ['Manual Control Removal', 'Trash icon on manual controls in Controls tab with confirmation prompt'],
          ].map(([name, desc]) => (
            <div key={name} className="px-5 py-3 flex items-start gap-3">
              <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 flex-shrink-0">{name}</code>
              <p className="text-xs text-slate-600">{desc}</p>
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
        Nightwatch Manual Control Attachment Verification Report C4186 · Great Horn AML · {REPORT_DATE}
      </p>
    </div>
  );
}