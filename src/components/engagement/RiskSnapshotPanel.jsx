import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, TrendingUp, ClipboardCheck, FileText, CheckCircle2 } from 'lucide-react';

function SnapCard({ icon: IconComp, label, value, color = 'slate' }) {
  const Icon = IconComp;
  const colors = {
    slate: 'bg-slate-50 text-slate-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl p-4 flex items-center gap-3 ${colors[color]} border border-current/10`}>
      <Icon className="w-5 h-5 flex-shrink-0 opacity-70" />
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function riskColor(rating) {
  if (!rating || rating === 'Not Rated') return 'slate';
  if (rating === 'High') return 'red';
  if (rating === 'Moderate') return 'amber';
  return 'emerald';
}

export default function RiskSnapshotPanel({ engagement }) {
  const [data, setData] = useState(null);

  useEffect(() => { load(); }, [engagement.id]);

  async function load() {
    const [risks, controls, reports] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
      base44.entities.ControlAssessment.filter({ engagement_id: engagement.id }),
      base44.entities.Report.filter({ engagement_id: engagement.id }),
    ]);
    const suggested = risks.filter(r => r.is_suggested);
    const accepted = risks.filter(r => r.is_accepted !== false);
    const evaluated = controls.filter(c => c.control_rating && c.control_rating !== 'Not Assessed');
    const latestReport = reports.sort((a, b) => (b.version || 1) - (a.version || 1))[0];
    const highResidual = risks.filter(r => r.residual_risk_rating === 'High').length;
    const modResidual = risks.filter(r => r.residual_risk_rating === 'Moderate').length;
    const residualSummary = highResidual > 0 ? `${highResidual} High` : modResidual > 0 ? `${modResidual} Moderate` : risks.length > 0 ? 'All Low' : '—';
    setData({ risks, suggested, accepted, evaluated, latestReport, residualSummary });
  }

  if (!data) return null;

  const reportStatusColor = {
    Draft: 'slate', 'Under Review': 'amber', Approved: 'blue', Finalized: 'emerald', Exported: 'purple'
  }[data.latestReport?.status] || 'slate';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <SnapCard icon={Shield} label="Overall Risk" value={engagement.overall_risk_rating || 'Not Rated'} color={riskColor(engagement.overall_risk_rating)} />
      <SnapCard icon={AlertTriangle} label="Suggested Risks" value={data.suggested.length} color="amber" />
      <SnapCard icon={CheckCircle2} label="Accepted Risks" value={data.accepted.length} color="blue" />
      <SnapCard icon={ClipboardCheck} label="Controls Evaluated" value={`${data.evaluated.length}/${data.risks.length > 0 ? data.risks.length : '—'}`} color="slate" />
      <SnapCard icon={TrendingUp} label="Residual Risk" value={data.residualSummary} color={data.residualSummary?.includes('High') ? 'red' : data.residualSummary?.includes('Moderate') ? 'amber' : 'emerald'} />
      <SnapCard icon={FileText} label="Report Status" value={data.latestReport?.status || 'No Report'} color={reportStatusColor} />
    </div>
  );
}