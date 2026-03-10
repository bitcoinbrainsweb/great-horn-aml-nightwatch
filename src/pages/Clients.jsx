import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Search, Building2, Trash2, Archive } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import { logAudit } from '../components/util/auditLog';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [c, u, me] = await Promise.all([
      base44.entities.Client.list('-created_date', 100),
      base44.entities.User.list(),
      base44.auth.me(),
    ]);
    setClients(c);
    setUsers(u);
    setUser(me);
    setLoading(false);
  }

  const isAdmin = ['admin', 'super_admin', 'compliance_admin'].includes(user?.role);

  async function handleArchive(client) {
    await base44.entities.Client.update(client.id, { status: 'Inactive' });
    await logAudit({ userEmail: user?.email, objectType: 'Client', objectId: client.id, action: 'archived', details: `Client ${client.legal_name} archived (set Inactive)` });
    setConfirmArchive(null);
    await loadData();
  }

  async function handleDelete(client) {
    // Guard: check for active engagements
    const engagements = await base44.entities.Engagement.filter({ client_id: client.id });
    const activeStatuses = ['Not Started', 'Intake In Progress', 'Risk Analysis', 'Draft Report', 'Under Review'];
    const activeEngs = engagements.filter(e => activeStatuses.includes(e.status));
    if (activeEngs.length > 0) {
      setDeleteError('This client cannot be deleted because it has active engagements. Complete or archive the engagements first.');
      return;
    }
    await logAudit({ userEmail: user?.email, objectType: 'Client', objectId: client.id, action: 'deleted', details: `Deleted client: ${client.legal_name}` });
    await base44.entities.Client.delete(client.id);
    setConfirmDelete(null);
    await loadData();
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const newClient = await base44.entities.Client.create({ ...form, status: form.status || 'Active' });
    await logAudit({ userEmail: user?.email, objectType: 'Client', objectId: newClient.id, action: 'created', details: `Created client: ${form.legal_name}` });
    await loadData();
    setShowCreate(false);
    setForm({});
    setSaving(false);
  }

  const filtered = clients.filter(c => {
    const matchSearch = !search || 
      c.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.operating_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${clients.length} total clients`}>
        <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Plus className="w-4 h-4" /> New Client
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Prospect">Prospect</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No clients found" description="Add your first client to get started." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Industry</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Jurisdiction</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Analyst</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="w-12"></th>}
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={createPageUrl(`ClientDetail?id=${c.id}`)} className="group">
                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{c.legal_name}</p>
                        {c.operating_name && c.operating_name !== c.legal_name && (
                          <p className="text-xs text-slate-500">{c.operating_name}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{c.industry || '—'}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{c.primary_jurisdiction || '—'}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{c.assigned_analyst || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {c.status !== 'Inactive' && (
                            <Button variant="ghost" size="icon" onClick={() => setConfirmArchive(c)} className="h-7 w-7 text-slate-400 hover:text-amber-600" title="Archive client">
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {(user?.role === 'super_admin' || user?.role === 'admin') && c.status === 'Inactive' && (
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteError(''); setConfirmDelete(c); }} className="h-7 w-7 text-slate-400 hover:text-red-600" title="Delete client (Inactive only)">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmArchive}
        onClose={() => setConfirmArchive(null)}
        onConfirm={() => handleArchive(confirmArchive)}
        title="Archive Client"
        description={<>Archive <strong>{confirmArchive?.legal_name}</strong>? The client will be set to Inactive but all data is preserved.</>}
        confirmWord={confirmArchive?.legal_name || 'ARCHIVE'}
        actionLabel="Archive Client"
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => { setConfirmDelete(null); setDeleteError(''); }}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Permanently Delete Client"
        description={
          deleteError
            ? <span className="text-amber-700">{deleteError}</span>
            : <><strong>{confirmDelete?.legal_name}</strong> and all associated data will be permanently removed. This cannot be undone.</>
        }
        confirmWord={confirmDelete?.legal_name || 'DELETE'}
        actionLabel="Delete Permanently"
      />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Legal Name *</Label>
                <Input required value={form.legal_name || ''} onChange={e => setForm({...form, legal_name: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Operating Name</Label>
                <Input value={form.operating_name || ''} onChange={e => setForm({...form, operating_name: e.target.value})} />
              </div>
              <div>
                <Label>Industry</Label>
                <Input value={form.industry || ''} onChange={e => setForm({...form, industry: e.target.value})} />
              </div>
              <div>
                <Label>Client Type</Label>
                <Select value={form.client_type || ''} onValueChange={v => setForm({...form, client_type: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {['MSB', 'DPMS', 'RE Agent', 'Accountant', 'Securities Dealer', 'Life Insurance', 'Virtual Asset Service Provider', 'Financial Entity', 'Other'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jurisdiction</Label>
                <Input value={form.primary_jurisdiction || ''} onChange={e => setForm({...form, primary_jurisdiction: e.target.value})} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status || 'Active'} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})} />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={form.compliance_contact_name || ''} onChange={e => setForm({...form, compliance_contact_name: e.target.value})} />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input value={form.compliance_contact_email || ''} onChange={e => setForm({...form, compliance_contact_email: e.target.value})} />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input value={form.compliance_contact_phone || ''} onChange={e => setForm({...form, compliance_contact_phone: e.target.value})} />
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
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">{saving ? 'Saving...' : 'Create Client'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}