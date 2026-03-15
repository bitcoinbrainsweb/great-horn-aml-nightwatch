import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, ListTodo, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge, PriorityBadge } from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import { format } from 'date-fns';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [myOnly, setMyOnly] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const t = await base44.entities.Task.list('-created_date', 200);
    setTasks(t);
    setLoading(false);
  }

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.task_name?.toLowerCase().includes(search.toLowerCase()) || t.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchMy = !myOnly || t.assigned_user === user?.email;
    return matchSearch && matchStatus && matchMy;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${tasks.length} total tasks`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['Not Started', 'In Progress', 'Waiting Review', 'Completed', 'Overdue'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => setMyOnly(!myOnly)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${myOnly ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          My Tasks
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks found" description="Tasks are created automatically when engagements are added." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Assigned To</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{t.task_name}</p>
                      <p className="text-xs text-slate-500">{t.task_type}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                      {t.engagement_id ? (
                        <Link to={createPageUrl(`EngagementDetail?id=${t.engagement_id}`)} className="text-blue-600 hover:underline">{t.client_name || '—'}</Link>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{t.assigned_user || 'Unassigned'}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{t.due_date ? format(new Date(t.due_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}