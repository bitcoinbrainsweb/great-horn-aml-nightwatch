import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Save, Sparkles } from 'lucide-react';
import { StatusBadge } from '../ui/RiskBadge';

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

  useEffect(() => { loadReport(); }, [engagement.id]);

  async function loadReport() {
    const reports = await base44.entities.Report.filter({ engagement_id: engagement.id });
    if (reports.length > 0) {
      const latest = reports[0];
      setReport(latest);
      setSections(latest.sections || {});
    }
    setLoading(false);
  }

  async function generateDraft() {
    setGenerating(true);
    
    const [risks, controls] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
      base44.entities.ControlAssessment.filter({ engagement_id: engagement.id })
    ]);

    const highRisks = risks.filter(r => r.residual_risk_rating === 'High');
    const modRisks = risks.filter(r => r.residual_risk_rating === 'Moderate');
    const lowRisks = risks.filter(r => r.residual_risk_rating === 'Low');

    const riskSummary = risks.map(r => `- ${r.risk_name} (${r.risk_category}): Inherent ${r.inherent_risk_rating || 'Not Rated'}, Controls ${r.overall_control_effectiveness || 'Not Assessed'}, Residual ${r.residual_risk_rating || 'Not Rated'}`).join('\n');

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

    const newSections = result;
    setSections(newSections);

    const me = await base44.auth.me();
    if (report) {
      await base44.entities.Report.update(report.id, { sections: newSections, version: (report.version || 1) + 1 });
    } else {
      const newReport = await base44.entities.Report.create({
        engagement_id: engagement.id,
        report_type: engagement.engagement_type,
        generated_by: me.email,
        client_name: engagement.client_name,
        engagement_type: engagement.engagement_type,
        version: 1,
        status: 'Draft',
        sections: newSections,
      });
      setReport(newReport);
    }
    setGenerating(false);
  }

  async function saveSection() {
    setSaving(true);
    if (report) {
      await base44.entities.Report.update(report.id, { sections });
    }
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={generateDraft} disabled={generating} className="bg-slate-900 hover:bg-slate-800 gap-2">
          <Sparkles className="w-4 h-4" /> {generating ? 'Generating...' : report ? 'Regenerate Draft' : 'Generate Draft Report'}
        </Button>
        {report && (
          <>
            <Button variant="outline" onClick={saveSection} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <StatusBadge status={report.status} />
            <span className="text-xs text-slate-500 self-center">v{report.version}</span>
          </>
        )}
      </div>

      {!report && !generating ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900">No report generated yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete risk and control assessments, then generate a draft report.</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Section nav */}
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

          {/* Editor */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{activeSect}</h3>
              <Textarea
                value={sections[activeSect] || ''}
                onChange={e => setSections({ ...sections, [activeSect]: e.target.value })}
                rows={16}
                className="font-serif text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}