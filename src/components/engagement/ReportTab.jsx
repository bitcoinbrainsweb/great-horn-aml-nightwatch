import React, { useState, useEffect } from 'react';

// Simple deterministic hash for integrity seal generation
function generateSeal(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const h = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `${h.slice(0, 4)}-${h.slice(4, 8)}`;
}
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save, Sparkles, Send, CheckCircle2, Lock, Download, FileDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../ui/RiskBadge';
import { jsPDF } from 'jspdf';
import { logAudit } from '../util/auditLog';

const REPORT_SECTIONS = [
  'Executive Summary',
  'Methodology',
  'Risk Analysis',
  'Control Assessment',
  'Residual Risk Summary',
  'Recommendations',
];

export default function ReportTab({ engagement }) {
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState({});
  const [activeSect, setActiveSect] = useState('Executive Summary');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => { loadReport(); }, [engagement.id]);

  async function loadReport() {
    const [reports, me] = await Promise.all([
      base44.entities.Report.filter({ engagement_id: engagement.id }),
      base44.auth.me()
    ]);
    if (reports.length > 0) {
      const latest = reports.sort((a, b) => (b.version || 1) - (a.version || 1))[0];
      setReport(latest);
      setSections(latest.sections || {});
    }
    setUser(me);
    setLoading(false);
  }

  async function generateDraft() {
    setGenerating(true);
    setActionError('');
    const [risks] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
    ]);
    const highRisks = risks.filter(r => r.residual_risk_rating === 'High');
    const modRisks = risks.filter(r => r.residual_risk_rating === 'Moderate');
    const lowRisks = risks.filter(r => r.residual_risk_rating === 'Low');
    const riskSummary = risks.map(r =>
      `- ${r.risk_name} (${r.risk_category}): Inherent ${r.inherent_risk_rating || 'Not Rated'}, Controls ${r.overall_control_effectiveness || 'Not Assessed'}, Residual ${r.residual_risk_rating || 'Not Rated'}`
    ).join('\n');

    const prompt = `Generate a professional AML ${engagement.engagement_type} report for ${engagement.client_name}. 
Methodology: ${engagement.methodology_name || 'Standard AML EWRA'}. 
Total risks assessed: ${risks.length}. High residual: ${highRisks.length}. Moderate: ${modRisks.length}. Low: ${lowRisks.length}.

Risk details:
${riskSummary}

Generate these sections in JSON format with keys: "Executive Summary", "Methodology", "Risk Analysis", "Control Assessment", "Residual Risk Summary", "Recommendations".
Each should be 2-4 paragraphs of professional compliance language. Use the client name and specific risk data provided.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          'Executive Summary': { type: 'string' },
          'Methodology': { type: 'string' },
          'Risk Analysis': { type: 'string' },
          'Control Assessment': { type: 'string' },
          'Residual Risk Summary': { type: 'string' },
          'Recommendations': { type: 'string' },
        }
      }
    });

    setSections(result);
    if (report) {
      await base44.entities.Report.update(report.id, { sections: result, version: (report.version || 1) + 1, status: 'Draft' });
      setReport(r => ({ ...r, sections: result, version: (r.version || 1) + 1, status: 'Draft' }));
    } else {
      const newReport = await base44.entities.Report.create({
        engagement_id: engagement.id,
        report_type: engagement.engagement_type,
        generated_by: user?.email,
        client_name: engagement.client_name,
        engagement_type: engagement.engagement_type,
        version: 1,
        status: 'Draft',
        sections: result,
      });
      setReport(newReport);
    }
    await logAudit({ userEmail: user?.email, objectType: 'Report', objectId: report?.id || '', action: 'report_generated', details: `Draft report generated for ${engagement.client_name}` });
    setGenerating(false);
  }

  async function saveChanges() {
    setSaving(true);
    if (report) {
      await base44.entities.Report.update(report.id, { sections });
      setReport(r => ({ ...r, sections }));
    }
    setSaving(false);
  }

  async function submitForReview() {
    setActionError('');
    if (!engagement.assigned_reviewer) {
      setActionError('Assign a reviewer to this engagement before submitting for review.');
      return;
    }
    await base44.entities.Report.update(report.id, { status: 'Under Review' });
    setReport(r => ({ ...r, status: 'Under Review' }));
    await logAudit({ userEmail: user?.email, objectType: 'Report', objectId: report.id, action: 'submitted_for_review', details: `Report submitted for review for ${engagement.client_name}` });
  }

  async function approveReport() {
    setActionError('');
    await base44.entities.Report.update(report.id, { status: 'Approved' });
    setReport(r => ({ ...r, status: 'Approved' }));
    await logAudit({ userEmail: user?.email, objectType: 'Report', objectId: report.id, action: 'report_approved', details: `Report approved for ${engagement.client_name}` });
  }

  async function finalizeReport() {
    setActionError('');
    // Generate integrity seal from current report + engagement risk data
    const [risks, controls] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
      base44.entities.ControlAssessment.filter({ engagement_id: engagement.id }),
    ]);
    const sealData = {
      sections,
      risks: risks.map(r => ({ name: r.risk_name, inherent: r.inherent_risk_rating, residual: r.residual_risk_rating })),
      controls: controls.map(c => ({ name: c.control_name, rating: c.control_rating })),
      client: engagement.client_name,
      version: report.version,
    };
    const seal = generateSeal(sealData);
    const watermark = `Generated by Great Horn AML Nightwatch | Date: ${new Date().toLocaleDateString('en-CA')} | Version: ${report.version} | Internal Use Only`;

    await base44.entities.Report.update(report.id, { status: 'Finalized', integrity_seal: seal, watermark_metadata: watermark });
    await base44.entities.Engagement.update(engagement.id, {
      is_locked: true,
      locked_by: user?.email,
      locked_at: new Date().toISOString().split('T')[0],
      integrity_seal: seal,
    });
    setReport(r => ({ ...r, status: 'Finalized', integrity_seal: seal }));
    await logAudit({
      userEmail: user?.email,
      objectType: 'Report',
      objectId: report.id,
      action: 'report_finalized',
      details: `Report finalized for ${engagement.client_name}. Integrity seal: ${seal}. Engagement locked.`,
    });
  }

  async function markExported() {
    await base44.entities.Report.update(report.id, { status: 'Exported' });
    setReport(r => ({ ...r, status: 'Exported' }));
    await logAudit({ userEmail: user?.email, objectType: 'Report', objectId: report.id, action: 'report_exported', details: `Report exported for ${engagement.client_name}` });
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = 210 - margin * 2;
    let y = 30;

    // Title block
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(engagement.client_name || 'AML Report', margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${engagement.engagement_type}  |  ${engagement.methodology_name || ''}`, margin, y);
    y += 6;
    doc.text(`Status: ${report?.status || 'Draft'}  |  Version: ${report?.version || 1}  |  ${new Date().toLocaleDateString('en-CA')}`, margin, y);
    y += 8;
    doc.setTextColor(0);
    doc.setDrawColor(200);
    doc.line(margin, y, 210 - margin, y);
    y += 10;

    for (const section of REPORT_SECTIONS) {
      const content = sections[section];
      if (!content) continue;
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(section, margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, pageWidth);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 10;
    }
    // Watermark footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    const watermark = report?.watermark_metadata || `Generated by Great Horn AML Nightwatch | ${new Date().toLocaleDateString('en-CA')} | Internal Use Only`;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(watermark, margin, 290, { maxWidth: pageWidth });
      if (report?.integrity_seal) {
        doc.text(`Integrity Seal: ${report.integrity_seal}`, 210 - margin, 290, { align: 'right' });
      }
    }
    doc.save(`${engagement.client_name} - ${engagement.engagement_type}.pdf`);
    markExported();
  }

  function exportWord() {
    const content = REPORT_SECTIONS.map(s => {
      const text = (sections[s] || '').replace(/\n/g, '<br/>');
      return `<h2 style="color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:4pt;margin-top:20pt;">${s}</h2>
<p style="line-height:1.8;margin:10pt 0;">${text}</p>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:Calibri,Arial,sans-serif;margin:2.5cm;font-size:11pt;color:#1e293b;line-height:1.6;}
h1{font-size:20pt;margin-bottom:4pt;}h2{font-size:13pt;}p{margin:8pt 0;}</style>
</head><body>
<h1>${engagement.client_name}</h1>
<p style="color:#64748b;font-size:12pt;">${engagement.engagement_type} &mdash; ${engagement.methodology_name || ''}</p>
<p style="color:#94a3b8;font-size:9pt;">Status: ${report?.status} &bull; Version: ${report?.version} &bull; ${new Date().toLocaleDateString('en-CA')}</p>
<hr style="margin:16pt 0;border:none;border-top:1px solid #e2e8f0;"/>
${content}
</body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${engagement.client_name} - ${engagement.engagement_type}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    markExported();
  }

  const isAdmin = ['admin', 'super_admin', 'compliance_admin'].includes(user?.role);
  const isAnalyst = user?.email === engagement.assigned_analyst || isAdmin;
  const isReviewer = user?.email === engagement.assigned_reviewer || isAdmin;
  const isDraft = !report || report?.status === 'Draft';
  const isUnderReview = report?.status === 'Under Review';
  const isApproved = report?.status === 'Approved';
  const isFinalized = ['Finalized', 'Exported'].includes(report?.status);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      {report && (
        <div className="flex items-center flex-wrap gap-3 p-3 bg-white rounded-lg border border-slate-200/60">
          <span className="text-xs text-slate-500 font-medium">Report Status:</span>
          <StatusBadge status={report.status} />
          <span className="text-xs text-slate-400">v{report.version}</span>
          {isFinalized && <span className="text-xs text-emerald-600 font-medium">✓ Ready for Export</span>}
          {report.integrity_seal && (
            <div className="flex items-center gap-1.5 ml-auto px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-mono font-semibold text-emerald-800 tracking-widest">{report.integrity_seal}</span>
            </div>
          )}
        </div>
      )}

      {/* Action toolbar */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={generateDraft} disabled={generating} className="bg-slate-900 hover:bg-slate-800 gap-2">
          <Sparkles className="w-4 h-4" />
          {generating ? 'Generating...' : report ? 'Regenerate Draft' : 'Generate Draft Report'}
        </Button>

        {report && (
          <>
            <Button variant="outline" onClick={saveChanges} disabled={saving || isFinalized} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            {isDraft && isAnalyst && (
              <Button variant="outline" onClick={submitForReview} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                <Send className="w-4 h-4" /> Submit for Review
              </Button>
            )}
            {isDraft && !isAnalyst && (
              <span className="text-xs text-slate-400 italic self-center">Only the assigned analyst or admin can submit for review.</span>
            )}

            {isUnderReview && isReviewer && (
              <Button variant="outline" onClick={approveReport} className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2 className="w-4 h-4" /> Approve Report
              </Button>
            )}

            {isApproved && isReviewer && (
              <Button variant="outline" onClick={finalizeReport} className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                <Lock className="w-4 h-4" /> Finalize Report
              </Button>
            )}

            {isFinalized && (
              <>
                <Button variant="outline" onClick={exportPDF} className="gap-2">
                  <Download className="w-4 h-4" /> Export PDF
                </Button>
                <Button variant="outline" onClick={exportWord} className="gap-2">
                  <FileDown className="w-4 h-4" /> Export Word
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {actionError && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {!report && !generating ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900">No report generated yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete risk and control assessments, then generate a draft report.</p>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="w-48 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-slate-200/60 p-3 sticky top-20 space-y-0.5">
              {REPORT_SECTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSect(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${activeSect === s ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{activeSect}</h3>
              <Textarea
                value={sections[activeSect] || ''}
                onChange={e => setSections({ ...sections, [activeSect]: e.target.value })}
                rows={16}
                disabled={isFinalized}
                className="font-serif text-sm leading-relaxed"
              />
              {isFinalized && <p className="text-xs text-slate-400 mt-2">Report is finalized and locked. Regenerate to create a new draft.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}