import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, AlertTriangle, ListTodo, FileStack, Calendar, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ComplianceOverview({ clientId, engagements }) {
  const [engRisks, setEngRisks] = useState([]);
  const [controlAssessments, setControlAssessments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId && engagements?.length > 0) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [clientId, engagements]);

  async function loadData() {
    const engIds = engagements.map(e => e.id);
    const [allRisks, allControls, allTasks] = await Promise.all([
      Promise.all(engIds.map(id => base44.entities.EngagementRisk.filter({ engagement_id: id }))).then(r => r.flat()),
      Promise.all(engIds.map(id => base44.entities.ControlAssessment.filter({ engagement_id: id }))).then(r => r.flat()),
      Promise.all(engIds.map(id => base44.entities.Task.filter({ engagement_id: id }))).then(r => r.flat()),
    ]);
    setEngRisks(allRisks);
    setControlAssessments(allControls);
    setTasks(allTasks);
    setLoading(false);
  }

  const activeEngagements = engagements?.filter(e => !['Completed', 'Archived'].includes(e.status)) || [];
  const highResidualRisks = engRisks.filter(r => r.residual_risk_rating === 'High');
  const weakControls = controlAssessments.filter(c => c.control_rating === 'Weak');
  const openTasks = tasks.filter(t => t.status !== 'Completed');

  const riskOrder = { High: 3, Moderate: 2, Low: 1, 'Not Rated': 0 };
  const overallRisk = (engagements || []).reduce((best, e) => {
    return (riskOrder[e.overall_risk_rating] || 0) > (riskOrder[best] || 0)
      ? e.overall_risk_rating
      : best;
  }, 'Not Rated');

  const completedAssessments = (engagements || [])
    .filter(e => e.status === 'Completed' && e.engagement_type === 'Risk Assessment')
    .sort((a, b) => new Date(b.completion_date || b.updated_date) - new Date(a.completion_date || a.updated_date));
  const lastAssessmentDate = completedAssessments[0]?.completion_date;

  const nextReviewDue = activeEngagements
    .filter(e => e.target_delivery_date)
    .sort((a, b) => new Date(a.target_delivery_date) - new Date(b.target_delivery_date))[0]?.target_delivery_date;
  const nextReviewOverdue = nextReviewDue && new Date(nextReviewDue) < new Date();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!engagements?.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-8 text-center">
        <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">No compliance data yet</p>
        <p className="text-xs text-slate-400 mt-1">Create an engagement for this client to generate a compliance overview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Row 1 – Risk & control summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall AML Risk"
          value={overallRisk || 'Not Rated'}
          icon={ShieldAlert}
          highlight={overallRisk === 'High' ? 'red' : overallRisk === 'Moderate' ? 'amber' : overallRisk === 'Low' ? 'green' : 'default'}
        />
        <StatCard
          title="High Residual Risks"
          value={highResidualRisks.length}
          icon={AlertTriangle}
          highlight={highResidualRisks.length > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Weak Controls"
          value={weakControls.length}
          icon={ShieldAlert}
          highlight={weakControls.length > 0 ? 'amber' : 'green'}
        />
        <StatCard
          title="Open Tasks"
          value={openTasks.length}
          icon={ListTodo}
          highlight={openTasks.length > 5 ? 'amber' : 'default'}
        />
      </div>

      {/* Row 2 – Engagement stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Engagements" value={activeEngagements.length} icon={FileStack} />
        <StatCard title="Risks Assessed" value={engRisks.length} icon={TrendingUp} />
        <StatCard
          title="Last Risk Assessment"
          value={lastAssessmentDate ? format(new Date(lastAssessmentDate), 'MMM d, yyyy') : '—'}
          icon={Calendar}
        />
        <StatCard
          title="Next Review Due"
          value={nextReviewDue ? format(new Date(nextReviewDue), 'MMM d, yyyy') : '—'}
          icon={Clock}
          highlight={nextReviewOverdue ? 'red' : 'default'}
        />
      </div>

      {/* High Residual Risks detail */}
      {highResidualRisks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            High Residual Risks ({highResidualRisks.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {highResidualRisks.slice(0, 6).map(r => {
              const eng = engagements.find(e => e.id === r.engagement_id);
              return (
                <div key={r.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-slate-900">{r.risk_name}</p>
                    <p className="text-xs text-slate-500">{r.risk_category} · {eng?.engagement_type || '—'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700">High</span>
                </div>
              );
            })}
            {highResidualRisks.length > 6 && (
              <p className="text-xs text-slate-400 pt-2">+{highResidualRisks.length - 6} more</p>
            )}
          </div>
        </div>
      )}

      {/* Weak Controls detail */}
      {weakControls.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Weak Controls ({weakControls.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {weakControls.slice(0, 6).map(c => {
              const eng = engagements.find(e => e.id === c.engagement_id);
              return (
                <div key={c.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-slate-900">{c.control_name}</p>
                    <p className="text-xs text-slate-500">{c.control_category} · {eng?.engagement_type || '—'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700">Weak</span>
                </div>
              );
            })}
            {weakControls.length > 6 && (
              <p className="text-xs text-slate-400 pt-2">+{weakControls.length - 6} more</p>
            )}
          </div>
        </div>
      )}

      {/* Open Tasks */}
      {openTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-blue-500" />
            Open Compliance Tasks ({openTasks.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {openTasks.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-slate-900">{t.task_name}</p>
                  <p className="text-xs text-slate-500">{t.engagement_name || '—'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  t.status === 'Overdue' ? 'bg-red-50 text-red-700' :
                  t.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{t.status}</span>
              </div>
            ))}
            {openTasks.length > 6 && (
              <p className="text-xs text-slate-400 pt-2">+{openTasks.length - 6} more</p>
            )}
          </div>
        </div>
      )}

      {/* Engagement History */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Engagement History</h3>
        <div className="divide-y divide-slate-100">
          {engagements.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{e.engagement_type}</p>
                <p className="text-xs text-slate-500">
                  {e.methodology_name || 'No methodology'}
                  {e.target_delivery_date ? ` · Due ${format(new Date(e.target_delivery_date), 'MMM d, yyyy')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {e.overall_risk_rating && e.overall_risk_rating !== 'Not Rated' && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    e.overall_risk_rating === 'High' ? 'bg-red-50 text-red-700' :
                    e.overall_risk_rating === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>{e.overall_risk_rating}</span>
                )}
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">{e.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, highlight = 'default' }) {
  const bg = { red: 'bg-red-50 border-red-200', amber: 'bg-amber-50 border-amber-200', green: 'bg-emerald-50 border-emerald-200', default: 'bg-white border-slate-200/60' };
  const ic = { red: 'text-red-500', amber: 'text-amber-500', green: 'text-emerald-500', default: 'text-slate-400' };
  return (
    <div className={`rounded-xl border p-4 ${bg[highlight]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 font-medium leading-tight">{title}</p>
        <Icon className={`w-4 h-4 flex-shrink-0 ${ic[highlight]}`} />
      </div>
      <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
    </div>
  );
}