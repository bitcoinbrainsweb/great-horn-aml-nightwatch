import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TEMPLATE_ANCHORS = {
  '{{scope_summary}}': 'Scope Summary',
  '{{risk_summary}}': 'Risk Assessment Summary',
  '{{control_summary}}': 'Control Environment Summary',
  '{{finding_summary}}': 'Key Findings',
  '{{remediation_summary}}': 'Remediation Plan'
};

export default function NarrativeTemplateRenderer({ engagementId }) {
  const [template, setTemplate] = useState('');
  const [renderedNarrative, setRenderedNarrative] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    renderNarrative();
  }, [engagementId]);

  async function renderNarrative() {
    setLoading(true);
    try {
      // Fetch engagement data and related records
      const [engagements, risks, controls, findings, remediations] = await Promise.all([
        base44.entities.Engagement?.list() || [],
        base44.entities.RiskLibrary?.list() || [],
        base44.entities.ControlLibrary?.list() || [],
        base44.entities.Finding?.list() || [],
        base44.entities.RemediationAction?.list() || []
      ]);

      const engagement = engagements.find(e => e.id === engagementId);
      if (!engagement) {
        setLoading(false);
        return;
      }

      const sections = {
        scope_summary: generateScopeSummary(engagement),
        risk_summary: generateRiskSummary(risks),
        control_summary: generateControlSummary(controls),
        finding_summary: generateFindingSummary(findings),
        remediation_summary: generateRemediationSummary(remediations)
      };

      setRenderedNarrative(sections);
    } catch (error) {
      console.error('Error rendering narrative:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Narrative (Auto-Generated)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(TEMPLATE_ANCHORS).map(([anchor, label]) => (
            <div key={anchor} className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">{label}</div>
              <div className="bg-slate-50 rounded p-3 text-xs text-slate-700 min-h-[60px]">
                {renderedNarrative[anchor.replace(/[{}]/g, '').replace(/_/g, '')] || (
                  <span className="text-slate-400 italic">Section will populate as data is added...</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function generateScopeSummary(engagement) {
  if (!engagement) return 'Engagement scope details pending.';
  return `Engagement: ${engagement.client_name || 'TBD'}. Assessment period: ${engagement.assessment_start_date || 'TBD'} to ${engagement.assessment_end_date || 'TBD'}.`;
}

function generateRiskSummary(risks) {
  if (!risks || risks.length === 0) return 'Risk assessment pending.';
  const high = risks.filter(r => r.default_inherent_risk === 'High').length;
  return `Identified ${risks.length} risks. ${high} high-risk areas require immediate attention.`;
}

function generateControlSummary(controls) {
  if (!controls || controls.length === 0) return 'Control environment assessment pending.';
  const active = controls.filter(c => c.status === 'Active').length;
  return `${active} active controls assessed. Control environment provides baseline governance structure.`;
}

function generateFindingSummary(findings) {
  if (!findings || findings.length === 0) return 'No findings identified.';
  const critical = findings.filter(f => f.severity === 'Critical').length;
  return `${findings.length} findings identified. ${critical} critical items require remediation.`;
}

function generateRemediationSummary(remediations) {
  if (!remediations || remediations.length === 0) return 'Remediation plan pending.';
  const completed = remediations.filter(r => r.status === 'Completed').length;
  return `${remediations.length} remediation actions planned. ${completed} completed to date.`;
}