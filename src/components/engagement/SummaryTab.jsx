import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RiskBadge } from '../ui/RiskBadge';
import { getRiskColor } from '../scoring/riskScoringEngine';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function SummaryTab({ engagement }) {
  const [engRisks, setEngRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }).then(r => {
      setEngRisks(r);
      setLoading(false);
    });
  }, [engagement.id]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  const highRisks = engRisks.filter(r => r.residual_risk_rating === 'High');
  const moderateRisks = engRisks.filter(r => r.residual_risk_rating === 'Moderate');
  const lowRisks = engRisks.filter(r => r.residual_risk_rating === 'Low');
  const unrated = engRisks.filter(r => !r.residual_risk_rating);

  const chartData = [
    { name: 'High', count: highRisks.length, color: '#EF4444' },
    { name: 'Moderate', count: moderateRisks.length, color: '#F59E0B' },
    { name: 'Low', count: lowRisks.length, color: '#10B981' },
    { name: 'Unrated', count: unrated.length, color: '#94A3B8' },
  ];

  // Category breakdown
  const byCategory = engRisks.reduce((acc, r) => {
    const cat = r.risk_category || 'Other';
    if (!acc[cat]) acc[cat] = { total: 0, high: 0, moderate: 0, low: 0 };
    acc[cat].total++;
    if (r.residual_risk_rating === 'High') acc[cat].high++;
    else if (r.residual_risk_rating === 'Moderate') acc[cat].moderate++;
    else if (r.residual_risk_rating === 'Low') acc[cat].low++;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 text-center">
          <p className="text-2xl font-bold text-slate-900">{engRisks.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Risks</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
          <p className="text-2xl font-bold text-red-700">{highRisks.length}</p>
          <p className="text-xs text-red-600 mt-1">High Residual</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 text-center">
          <p className="text-2xl font-bold text-amber-700">{moderateRisks.length}</p>
          <p className="text-xs text-amber-600 mt-1">Moderate Residual</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 text-center">
          <p className="text-2xl font-bold text-emerald-700">{lowRisks.length}</p>
          <p className="text-xs text-emerald-600 mt-1">Low Residual</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Residual Risk Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Risk by Category</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-2 text-xs font-semibold text-slate-500">Category</th>
              <th className="text-center px-5 py-2 text-xs font-semibold text-slate-500">Total</th>
              <th className="text-center px-5 py-2 text-xs font-semibold text-red-500">High</th>
              <th className="text-center px-5 py-2 text-xs font-semibold text-amber-500">Moderate</th>
              <th className="text-center px-5 py-2 text-xs font-semibold text-emerald-500">Low</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(byCategory).map(([cat, data]) => (
              <tr key={cat}>
                <td className="px-5 py-2 font-medium text-slate-900">{cat}</td>
                <td className="px-5 py-2 text-center">{data.total}</td>
                <td className="px-5 py-2 text-center text-red-600 font-semibold">{data.high || '-'}</td>
                <td className="px-5 py-2 text-center text-amber-600 font-semibold">{data.moderate || '-'}</td>
                <td className="px-5 py-2 text-center text-emerald-600 font-semibold">{data.low || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* High residual risks detail */}
      {highRisks.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-200">
            <h3 className="text-sm font-semibold text-red-800">High Residual Risk Items</h3>
          </div>
          <div className="divide-y divide-red-100">
            {highRisks.map(r => (
              <div key={r.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.risk_name}</p>
                    <p className="text-xs text-slate-500">{r.risk_category} · Inherent: {r.inherent_risk_rating} · Controls: {r.overall_control_effectiveness || 'Not assessed'}</p>
                  </div>
                  <RiskBadge rating="High" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}