import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Search, FileStack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge, RiskBadge } from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import { DEFAULT_TASKS } from '../components/scoring/riskScoringEngine';
import { format } from 'date-fns';

export default function Engagements() {
  const [engagements, setEngagements] = useState([]);
  const [clients, setClients] = useState([]);
  const [methodologies, setMethodologies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [e, c, m, u] = await Promise.all([
      base44.entities.Engagement.list('-created_date', 100),
      base44.entities.Client.list('-legal_name', 200),
      base44.entities.Methodology.list(),
      base44.entities.User.list()
    ]);
    setEngagements(e);
    setClients(c);
    setMethodologies(m);
    setUsers(u);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const client = clients.find(c => c.id === form.client_id);
    const meth = methodologies.find(m => m.id === form.methodology_id);
    const engagement = await base44.entities.Engagement.create({
      ...form,
      client_name: client?.legal_name || '',
      methodology_name: meth?.name || '',
      status: 'Not Started',
    });

    // Create default tasks
    const defaultTasks = DEFAULT_TASKS[form.engagement_type] || [];
    if (defaultTasks.length > 0) {
      await base44.entities.Task.bulkCreate(
        defaultTasks.map(t => ({
          ...t,
          engagement_id: engagement.id,
          engagement_name: `${client?.legal_name} - ${form.engagement_type}`,
          client_name: client?.legal_name || '',
          assigned_user: form.assigned_analyst || '',
          status: 'Not Started',
          priority: 'Medium',
        }))
      );
    }

    await loadData();
    setShowCreate(false);
    setForm({});
    setSaving(false);
  }

  const filtered = engagements.filter(e => {
    const matchSearch = !search || 
      e.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchType = typeFilter === 'all' || e.engagement_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Engagements" subtitle={`${engagements.length} total engagements`}>
        <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Plus className="w-4 h-4" /> New Engagement
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['Not Started', 'Intake In Progress', 'Risk Analysis', 'Draft Report', 'Under Review', 'Completed'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['Risk Assessment', 'Compliance Audit', 'Policy Package'].map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileStack} title="No engagements found" description="Create your first engagement to get started." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Methodology</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Target Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={createPageUrl(`EngagementDetail?id=${e.id}`)} className="group">
                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{e.client_name || 'Unnamed'}</p>
                        <p className="text-xs text-slate-500">{e.assigned_analyst || 'Unassigned'}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{e.engagement_type}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{e.methodology_name || '—'}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">
                      {e.target_delivery_date ? format(new Date(e.target_delivery_date), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-5 py-3"><RiskBadge rating={e.overall_risk_rating} /></td>
                    <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Engagement</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Client *</Label>
              <Select value={form.client_id || ''} onValueChange={v => setForm({...form, client_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Engagement Type *</Label>
                <Select value={form.engagement_type || ''} onValueChange={v => setForm({...form, engagement_type: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {['Risk Assessment', 'Compliance Audit', 'Policy Package'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Methodology</Label>
                <Select value={form.methodology_id || ''} onValueChange={v => setForm({...form, methodology_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {methodologies.filter(m => m.status === 'Active').map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Analyst</Label>
                <Select value={form.assigned_analyst || ''} onValueChange={v => setForm({...form, assigned_analyst: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Reviewer</Label>
                <Select value={form.assigned_reviewer || ''} onValueChange={v => setForm({...form, assigned_reviewer: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <Label>Target Delivery Date</Label>
                <Input type="date" value={form.target_delivery_date || ''} onChange={e => setForm({...form, target_delivery_date: e.target.value})} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority || 'Medium'} onValueChange={v => setForm({...form, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !form.client_id || !form.engagement_type} className="bg-slate-900 hover:bg-slate-800">{saving ? 'Creating...' : 'Create Engagement'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}