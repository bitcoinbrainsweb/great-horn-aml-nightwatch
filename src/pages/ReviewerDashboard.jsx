import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInDays } from 'date-fns';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge, RiskBadge, PriorityBadge } from '../components/ui/RiskBadge';
import { AlertTriangle, CheckCircle2, Clock, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OVERDUE_DAYS = 5; // "Under Review" overdue threshold in days

function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
      <AlertTriangle className="w-2.5 h-2.5" /> Overdue
    </span>
  );
}

export default function ReviewerDashboard() {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const engs = await base44.entities.Engagement.list('-updated_date', 300);
    setEngagements(engs);
    setLoading(false);
  }

  function isOverdue(eng) {
    if (!eng.updated_date) return false;
    return differenceInDays(new Date(), new Date(eng.updated_date)) > OVERDUE_DAYS;
  }

  const underReview = engagements.filter(e => e.status === 'Under Review');
  const overdue = underReview.filter(isOverdue);
  const inProgress = engagements.filter(e => ['Intake In Progress', 'Risk Analysis', 'Draft Report'].includes(e.status));
  const completed = engagements.filter(e => e.status === 'Completed');
  const recentlyFinalized = completed.slice(0, 8);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviewer Dashboard"
        subtitle={`${underReview.length} awaiting review · ${overdue.length} overdue`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Awaiting Review', value: underReview.length, cls: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'Overdue', value: overdue.length, cls: overdue.length > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-600' },
          { label: 'In Progress', value: inProgress.length, cls: 'bg-amber-50 border-amber-200 text-amber-800' },
          { label: 'Completed', value: completed.length, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.cls}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-900">
            {overdue.length} engagement{overdue.length > 1 ? 's' : ''} overdue for review (exceeds {OVERDUE_DAYS}-day threshold since last update).
          </p>
        </div>
      )}

      {/* Under Review table */}
      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Awaiting Review</h2>
          {overdue.length > 0 && (
            <span className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> {overdue.length} overdue
            </span>
          )}
        </div>
        {underReview.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No engagements awaiting review.</p>
            <p className="text-xs text-slate-400 mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Client</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Type</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Reviewer</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Risk</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Last Updated</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {underReview.map(eng => {
                  const engOverdue = isOverdue(eng);
                  return (
                    <tr key={eng.id} className={engOverdue ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}>
                      <td className="px-5 py-3">
                        <div className="flex items-start gap-2">
                          {engOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                          <div>
                            <p className="font-medium text-slate-900">{eng.client_name}</p>
                            {engOverdue ? (
                              <OverdueBadge />
                            ) : (
                              <StatusBadge status={eng.status} />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs hidden sm:table-cell">{eng.engagement_type}</td>
                      <td className="px-5 py-3 text-xs hidden md:table-cell">
                        {eng.assigned_reviewer
                          ? <span className="text-slate-700">{eng.assigned_reviewer}</span>
                          : <span className="text-red-500 italic font-medium">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <RiskBadge rating={eng.overall_risk_rating} />
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {eng.updated_date ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(eng.updated_date), 'MMM d, yyyy')}
                            {engOverdue && (
                              <span className="text-red-600 font-semibold ml-1">
                                ({differenceInDays(new Date(), new Date(eng.updated_date))}d ago)
                              </span>
                            )}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Link to={createPageUrl(`EngagementDetail?id=${eng.id}`)}>
                          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                            Review <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In Progress */}
      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">In Progress ({inProgress.length})</h2>
        </div>
        {inProgress.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-500">No engagements currently in progress.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {inProgress.map(eng => (
                  <tr key={eng.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{eng.client_name}</p>
                      <p className="text-xs text-slate-500">{eng.engagement_type}</p>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={eng.status} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500 hidden md:table-cell">{eng.assigned_analyst || 'No analyst'}</td>
                    <td className="px-5 py-3"><PriorityBadge priority={eng.priority} /></td>
                    <td className="px-5 py-3">
                      <Link to={createPageUrl(`EngagementDetail?id=${eng.id}`)}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">View <ArrowRight className="w-3 h-3" /></Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently Completed */}
      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recently Completed</h2>
        </div>
        {recentlyFinalized.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-500">No completed engagements yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentlyFinalized.map(eng => (
              <div key={eng.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{eng.client_name}</p>
                  <p className="text-xs text-slate-500">{eng.engagement_type} · Reviewer: {eng.assigned_reviewer || '—'}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <RiskBadge rating={eng.overall_risk_rating} />
                  <Link to={createPageUrl(`EngagementDetail?id=${eng.id}`)}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">View <ArrowRight className="w-3 h-3" /></Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}