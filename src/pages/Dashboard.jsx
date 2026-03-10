import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileStack, Clock, AlertTriangle, CheckCircle2, ArrowRight,
  Calendar, User, FileBarChart
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { StatusBadge, RiskBadge, PriorityBadge } from '../components/ui/RiskBadge';
import { format } from 'date-fns';

export default function Dashboard() {
  const [engagements, setEngagements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [me, eng, tsk, rpt, act] = await Promise.all([
      base44.auth.me(),
      base44.entities.Engagement.list('-created_date', 50),
      base44.entities.Task.list('-created_date', 50),
      base44.entities.Report.list('-created_date', 10),
      base44.entities.ActivityLog.list('-created_date', 15),
    ]);
    setUser(me);
    setEngagements(eng);
    setTasks(tsk);
    setReports(rpt);
    setActivities(act);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const active = engagements.filter(e => !['Completed', 'Not Started'].includes(e.status));
  const awaitingReview = engagements.filter(e => e.status === 'Under Review');
  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
  const dueThisWeek = engagements.filter(e => {
    if (!e.target_delivery_date) return false;
    const d = new Date(e.target_delivery_date);
    return d >= now && d <= weekEnd && e.status !== 'Completed';
  });
  const overdue = engagements.filter(e => {
    if (!e.target_delivery_date) return false;
    return new Date(e.target_delivery_date) < now && e.status !== 'Completed';
  });

  const myTasks = tasks.filter(t => t.assigned_user === user?.email && t.status !== 'Completed').slice(0, 8);
  const drafts = engagements.filter(e => ['Intake In Progress', 'Risk Analysis', 'Draft Report'].includes(e.status)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Engagements" value={active.length} icon={FileStack} color="blue" />
        <StatCard title="Awaiting Review" value={awaitingReview.length} icon={Clock} color="amber" />
        <StatCard title="Due This Week" value={dueThisWeek.length} icon={Calendar} color="purple" />
        <StatCard title="Overdue" value={overdue.length} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">My Tasks</h3>
            <Link to={createPageUrl('Tasks')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {myTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No pending tasks</div>
            ) : (
              myTasks.map(task => (
                <div key={task.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.task_name}</p>
                    <p className="text-xs text-slate-500 truncate">{task.client_name} · {task.engagement_name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No recent activity</div>
            ) : (
              activities.map(a => (
                <div key={a.id} className="px-5 py-3">
                  <p className="text-xs text-slate-900">
                    <span className="font-medium">{a.user_name || a.user_email}</span>{' '}
                    <span className="text-slate-500">{a.action}</span>{' '}
                    <span className="font-medium">{a.object_name}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.created_date ? format(new Date(a.created_date), 'MMM d, h:mm a') : ''}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Draft Engagements */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Engagements in Progress</h3>
            <Link to={createPageUrl('Engagements')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {drafts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No active engagements</div>
            ) : (
              drafts.map(e => (
                <Link key={e.id} to={createPageUrl(`EngagementDetail?id=${e.id}`)} className="block px-5 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{e.client_name}</p>
                      <p className="text-xs text-slate-500">{e.engagement_type} · {e.methodology_name || 'No methodology'}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent Reports</h3>
            <Link to={createPageUrl('Reports')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No reports generated yet</div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.client_name} — {r.report_type}</p>
                    <p className="text-xs text-slate-500">v{r.version} · {r.generated_date ? format(new Date(r.generated_date), 'MMM d, yyyy') : ''}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}