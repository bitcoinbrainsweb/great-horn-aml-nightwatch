import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../components/ui/PageHeader';

const STATUS_CONFIG = {
  COVERED: { className: 'bg-green-100 text-green-800 border-green-200', label: 'Covered', icon: CheckCircle2 },
  PARTIALLY_COVERED: { className: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Partial', icon: AlertTriangle },
  INEFFECTIVE: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Ineffective', icon: XCircle },
  UNCONTROLLED: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Uncontrolled', icon: XCircle },
  NOT_TESTED: { className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Not Tested', icon: ShieldCheck },
};

export default function ControlCoverageMap() {
  const [risks, setRisks] = useState([]);
  const [controls, setControls] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [r, c, t] = await Promise.all([
        base44.entities.RiskLibrary.list('-created_date', 500),
        base44.entities.ControlLibrary.filter({ status: 'Active' }, '-created_date', 500),
        base44.entities.ControlTest.list('-created_date', 1000)
      ]);
      setRisks(r);
      setControls(c);
      setTests(t);
    } catch (err) {
      console.error('Failed to load coverage data:', err);
    }
    setLoading(false);
  }

  const controlsWithTests = new Set();
  const controlEffectiveness = {};
  for (const test of tests) {
    const cid = test.control_library_id || test.control_id;
    if (cid) {
      controlsWithTests.add(cid);
      if (!controlEffectiveness[cid] || test.effectiveness_rating === 'Effective') {
        controlEffectiveness[cid] = test.effectiveness_rating;
      }
    }
  }

  const riskCoverage = risks.map(risk => {
    const linkedIds = risk.linked_control_ids || [];
    const totalControls = linkedIds.length;
    if (totalControls === 0) return { ...risk, status: 'UNCONTROLLED', totalControls: 0, testedControls: 0, effectiveControls: 0 };

    let testedControls = 0;
    let effectiveControls = 0;
    for (const cid of linkedIds) {
      if (controlsWithTests.has(cid)) {
        testedControls++;
        if (controlEffectiveness[cid] === 'Effective') effectiveControls++;
      }
    }

    let status;
    if (testedControls === 0) status = 'NOT_TESTED';
    else if (effectiveControls === 0) status = 'INEFFECTIVE';
    else if (effectiveControls >= totalControls) status = 'COVERED';
    else status = 'PARTIALLY_COVERED';

    return { ...risk, status, totalControls, testedControls, effectiveControls };
  });

  const summary = {
    total: risks.length,
    covered: riskCoverage.filter(r => r.status === 'COVERED').length,
    partial: riskCoverage.filter(r => r.status === 'PARTIALLY_COVERED').length,
    ineffective: riskCoverage.filter(r => r.status === 'INEFFECTIVE').length,
    notTested: riskCoverage.filter(r => r.status === 'NOT_TESTED').length,
    uncontrolled: riskCoverage.filter(r => r.status === 'UNCONTROLLED').length,
  };
  const coveragePct = summary.total > 0 ? Math.round((summary.covered / summary.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader title="Control Coverage Map" subtitle={`${risks.length} risks | ${controls.length} active controls`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard label="Total Risks" value={summary.total} color="text-slate-900" />
        <SummaryCard label="Covered" value={summary.covered} color="text-green-700" />
        <SummaryCard label="Partial" value={summary.partial} color="text-amber-700" />
        <SummaryCard label="Ineffective" value={summary.ineffective} color="text-red-700" />
        <SummaryCard label="Not Tested" value={summary.notTested} color="text-slate-500" />
        <SummaryCard label="Uncontrolled" value={summary.uncontrolled} color="text-red-700" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Overall Coverage</span>
          <span className="text-lg font-bold text-slate-900">{coveragePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all"
            style={{ width: `${coveragePct}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Risk</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Controls</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tested</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Effective</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskCoverage.map(risk => {
                const cfg = STATUS_CONFIG[risk.status] || STATUS_CONFIG.NOT_TESTED;
                return (
                  <tr key={risk.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{risk.risk_name || risk.name || '—'}</p>
                      {risk.risk_category && <p className="text-xs text-slate-500">{risk.risk_category}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{risk.risk_category || '—'}</td>
                    <td className="px-5 py-3 text-slate-900 font-medium">{risk.totalControls}</td>
                    <td className="px-5 py-3 text-slate-900">{risk.testedControls}</td>
                    <td className="px-5 py-3 text-slate-900">{risk.effectiveControls}</td>
                    <td className="px-5 py-3">
                      <Badge className={cfg.className}>{cfg.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
