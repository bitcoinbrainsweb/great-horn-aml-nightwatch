import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Edit2, Plus, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';
import { Badge } from '@/components/ui/badge';

const SMOKE_EMAIL = 'smoke@nightwatch.test';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Technical Admin' },
  { value: 'compliance_admin', label: 'Compliance Admin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'test_automation', label: 'Test Automation (Read-Only)' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editName, setEditName] = useState('');
  const [smokeEnsureLoading, setSmokeEnsureLoading] = useState(false);
  const [smokeEnsureResult, setSmokeEnsureResult] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetSent, setResetSent] = useState(null);

  useEffect(() => { load(); }, []);
  async function load() { setUsers(await base44.entities.User.list()); setLoading(false); }

  async function ensureSmokeUser() {
    setSmokeEnsureLoading(true);
    setSmokeEnsureResult(null);
    try {
      const res = await base44.functions.invoke('ensureSmokeUser', {});
      const data = res?.data ?? res;
      setSmokeEnsureResult(data);
      if (data?.success) await load();
    } catch (e) {
      setSmokeEnsureResult({ success: false, error: e.message || String(e) });
    }
    setSmokeEnsureLoading(false);
  }

  async function saveUser() {
    const payload = { role: editRole };
    if (editName !== undefined && editName !== editUser?.full_name) payload.full_name = editName.trim() || null;
    await base44.entities.User.update(editUser.id, payload);
    setEditUser(null);
    await load();
  }

  async function deleteUser(user) {
    try {
      await base44.entities.User.delete(user.id);
      setDeleteConfirm(null);
      await load();
    } catch (e) {
      setSmokeEnsureResult({ success: false, error: `Delete failed: ${e.message || e}` });
    }
  }

  async function sendPasswordReset(user) {
    try {
      await base44.auth.resetPasswordRequest(user.email);
      setResetSent(user.id);
      setTimeout(() => setResetSent(null), 4000);
    } catch (e) {
      setSmokeEnsureResult({ success: false, error: `Reset email failed: ${e.message || e}` });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  const roleLabel = (role) => ROLES.find(r => r.value === role)?.label || role || 'Analyst';

  return (
    <div data-test="page-admin-users">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Users" subtitle={`${users.length} team members`}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={ensureSmokeUser} disabled={smokeEnsureLoading} data-test="ensure-smoke-user-button">
              {smokeEnsureLoading ? '...' : <><ShieldCheck className="w-4 h-4 mr-1" /> Ensure smoke user</>}
            </Button>
            <Link to={createPageUrl('AdminInvitations')}>
              <Button size="sm" className="gap-2" data-test="invite-user-button">
                <Plus className="w-4 h-4" /> Invite user
              </Button>
            </Link>
          </div>
        </PageHeader>
      </div>

      {smokeEnsureResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${smokeEnsureResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {smokeEnsureResult.success ? (smokeEnsureResult.message || 'Done.') : (smokeEnsureResult.error || 'Error')}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Role</th>
            <th className="w-32 text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{u.full_name || '—'}</span>
                    {u.email === SMOKE_EMAIL && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Smoke test</Badge>
                    )}
                    {u.account_label && (
                      <Badge variant="outline" className="bg-slate-100 text-slate-600">
                        {u.account_label}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={roleLabel(u.role)} />
                    {u.role === 'test_automation' && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-300">READ-ONLY</Badge>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditUser(u); setEditRole(u.role || 'analyst'); setEditName(u.full_name || ''); }} className="h-7 w-7" title="Edit"><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => sendPasswordReset(u)} disabled={!!resetSent} className="h-7 w-7 text-slate-500" title="Send password reset email">
                      {resetSent === u.id ? <span className="text-xs">Sent</span> : <KeyRound className="w-3.5 h-3.5" />}
                    </Button>
                    {u.email !== SMOKE_EMAIL && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(u)} className="h-7 w-7 text-red-600 hover:text-red-700" title="Delete user"><Trash2 className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{editUser?.email}</p>
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={saveUser} className="bg-slate-900 hover:bg-slate-800">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete user</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Remove <strong>{deleteConfirm?.full_name || deleteConfirm?.email}</strong>? They will lose access to this workspace.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteUser(deleteConfirm)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}