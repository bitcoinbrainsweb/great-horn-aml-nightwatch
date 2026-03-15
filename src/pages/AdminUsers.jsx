import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Edit2, Plus, Trash2, KeyRound, ShieldCheck, Link2, Copy, UserX, History } from 'lucide-react';
import { buildInviteLink } from '@/utils/inviteLink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';
import { Badge } from '@/components/ui/badge';
import { NW_AUTH_ROLES, NW_AUTH_STATUSES } from '@/lib/nw-auth-constants';

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
  const [invitations, setInvitations] = useState([]);
  const [smokeLinkCopied, setSmokeLinkCopied] = useState(false);

  // NW-UPGRADE-076A: Nightwatch auth users (new data layer)
  const [nwUsers, setNwUsers] = useState([]);
  const [nwLoading, setNwLoading] = useState(false);
  const [nwError, setNwError] = useState(null);
  const [nwCreateOpen, setNwCreateOpen] = useState(false);
  const [nwCreateForm, setNwCreateForm] = useState({ email: '', full_name: '', role: 'reviewer', status: 'pending' });
  const [nwEditUser, setNwEditUser] = useState(null);
  const [nwEditForm, setNwEditForm] = useState({ full_name: '', role: 'reviewer', status: 'pending' });
  const [nwDisableConfirm, setNwDisableConfirm] = useState(null);
  const [nwEventsUser, setNwEventsUser] = useState(null);
  const [nwEvents, setNwEvents] = useState([]);
  const [nwEventsLoading, setNwEventsLoading] = useState(false);

  useEffect(() => { load(); loadNwUsers(); }, []);
  async function load() {
    const [u, inv] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.UserInvitation.list('-created_date', 100),
    ]);
    setUsers(u);
    setInvitations(inv);
    setLoading(false);
  }

  async function loadNwUsers() {
    setNwError(null);
    setNwLoading(true);
    try {
      const res = await base44.functions.invoke('nwAuthListUsers', {});
      const data = res?.data ?? res;
      setNwUsers(Array.isArray(data?.users) ? data.users : []);
      if (data?.error && data.error.includes('not configured')) setNwError(data.error);
    } catch (e) {
      setNwError(e.message || String(e));
      setNwUsers([]);
    }
    setNwLoading(false);
  }

  async function nwCreateUser(e) {
    e?.preventDefault();
    setNwError(null);
    try {
      const res = await base44.functions.invoke('nwAuthCreateUser', {
        email: nwCreateForm.email.trim().toLowerCase(),
        full_name: nwCreateForm.full_name.trim() || null,
        role: nwCreateForm.role,
        status: nwCreateForm.status,
      });
      const data = res?.data ?? res;
      if (data?.error) {
        setNwError(data.error);
        return;
      }
      setNwCreateOpen(false);
      setNwCreateForm({ email: '', full_name: '', role: 'reviewer', status: 'pending' });
      await loadNwUsers();
    } catch (e) {
      setNwError(e.message || String(e));
    }
  }

  async function nwUpdateUser(e) {
    e?.preventDefault();
    if (!nwEditUser?.id) return;
    setNwError(null);
    try {
      const res = await base44.functions.invoke('nwAuthUpdateUser', {
        id: nwEditUser.id,
        full_name: nwEditForm.full_name.trim() || null,
        role: nwEditForm.role,
        status: nwEditForm.status,
      });
      const data = res?.data ?? res;
      if (data?.error) {
        setNwError(data.error);
        return;
      }
      setNwEditUser(null);
      await loadNwUsers();
    } catch (e) {
      setNwError(e.message || String(e));
    }
  }

  async function nwDisableUser(user) {
    setNwError(null);
    try {
      const res = await base44.functions.invoke('nwAuthDisableUser', { id: user.id });
      const data = res?.data ?? res;
      if (data?.error) {
        setNwError(data.error);
        return;
      }
      setNwDisableConfirm(null);
      await loadNwUsers();
    } catch (e) {
      setNwError(e.message || String(e));
    }
  }

  async function openNwEvents(user) {
    setNwEventsUser(user);
    setNwEvents([]);
    setNwEventsLoading(true);
    try {
      const res = await base44.functions.invoke('nwAuthListAuthEvents', { user_id: user.id });
      const data = res?.data ?? res;
      setNwEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (e) {
      setNwEvents([{ event_type: 'error', metadata: { error: e.message || String(e) } }]);
    }
    setNwEventsLoading(false);
  }

  const smokeInvitation = invitations.find(i => i.email === SMOKE_EMAIL && (i.status === 'Active' || i.status === 'Pending'));

  function copySmokeInviteLink() {
    if (!smokeInvitation) return;
    const url = buildInviteLink(smokeInvitation);
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        setSmokeLinkCopied(true);
        setTimeout(() => setSmokeLinkCopied(false), 2000);
      });
    }
  }

  function openSmokeInviteLink() {
    if (!smokeInvitation) return;
    const url = buildInviteLink(smokeInvitation);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

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
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={ensureSmokeUser} disabled={smokeEnsureLoading} data-test="ensure-smoke-user-button">
              {smokeEnsureLoading ? '...' : <><ShieldCheck className="w-4 h-4 mr-1" /> Ensure smoke user</>}
            </Button>
            {smokeInvitation && (
              <>
                <Button variant="outline" size="sm" onClick={copySmokeInviteLink} data-test="copy-smoke-invite-link">
                  {smokeLinkCopied ? 'Copied' : <><Copy className="w-4 h-4 mr-1" /> Copy smoke invite link</>}
                </Button>
                <Button variant="outline" size="sm" onClick={openSmokeInviteLink} data-test="open-smoke-invite-link">
                  <Link2 className="w-4 h-4 mr-1" /> Open smoke invite link
                </Button>
              </>
            )}
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

      {/* NW-UPGRADE-076A: Nightwatch-controlled user access (data layer only; no login cutover) */}
      <section className="mt-10 pt-8 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Nightwatch users (access control)</h2>
          <Button size="sm" onClick={() => setNwCreateOpen(true)} data-test="nw-create-user-button">
            <Plus className="w-4 h-4 mr-1" /> Create user
          </Button>
        </div>
        {nwError && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">{nwError}</div>
        )}
        {nwLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Status</th>
                <th className="w-36 text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {nwUsers.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-500">No Nightwatch users yet. Create a user to get started.</td></tr>
                ) : (
                  nwUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-900">{u.full_name || '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3 hidden md:table-cell"><StatusBadge status={NW_AUTH_ROLES.find(r => r.value === u.role)?.label || u.role} /></td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <Badge variant="outline" className={u.status === 'disabled' ? 'bg-slate-100 text-slate-600' : u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>{u.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setNwEditUser(u); setNwEditForm({ full_name: u.full_name || '', role: u.role || 'reviewer', status: u.status || 'pending' }); }} className="h-7 w-7" title="Edit"><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openNwEvents(u)} className="h-7 w-7 text-slate-500" title="View auth events"><History className="w-3.5 h-3.5" /></Button>
                          {u.status !== 'disabled' && (
                            <Button variant="ghost" size="icon" onClick={() => setNwDisableConfirm(u)} className="h-7 w-7 text-red-600 hover:text-red-700" title="Disable user"><UserX className="w-3.5 h-3.5" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={nwCreateOpen} onOpenChange={setNwCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Nightwatch user</DialogTitle></DialogHeader>
          <form onSubmit={nwCreateUser} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={nwCreateForm.email} onChange={e => setNwCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" required />
            </div>
            <div>
              <Label>Full name</Label>
              <Input value={nwCreateForm.full_name} onChange={e => setNwCreateForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={nwCreateForm.role} onValueChange={v => setNwCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NW_AUTH_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={nwCreateForm.status} onValueChange={v => setNwCreateForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NW_AUTH_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNwCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!nwEditUser} onOpenChange={() => setNwEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Nightwatch user</DialogTitle></DialogHeader>
          <form onSubmit={nwUpdateUser} className="space-y-4">
            <p className="text-sm text-slate-600">{nwEditUser?.email}</p>
            <div>
              <Label>Full name</Label>
              <Input value={nwEditForm.full_name} onChange={e => setNwEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={nwEditForm.role} onValueChange={v => setNwEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NW_AUTH_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={nwEditForm.status} onValueChange={v => setNwEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NW_AUTH_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNwEditUser(null)}>Cancel</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!nwDisableConfirm} onOpenChange={() => setNwDisableConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Disable user</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Disable <strong>{nwDisableConfirm?.full_name || nwDisableConfirm?.email}</strong>? They will not be able to log in once Nightwatch auth is enabled.</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setNwDisableConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => nwDisableUser(nwDisableConfirm)}>Disable</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!nwEventsUser} onOpenChange={() => setNwEventsUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Auth events — {nwEventsUser?.email}</DialogTitle></DialogHeader>
          {nwEventsLoading ? (
            <div className="flex justify-center py-6"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto text-sm">
              {nwEvents.length === 0 ? <li className="text-slate-500">No events yet.</li> : nwEvents.map((ev, i) => (
                <li key={ev.id || i} className="flex gap-2 py-1 border-b border-slate-100">
                  <span className="font-medium text-slate-700">{ev.event_type}</span>
                  <span className="text-slate-500">{ev.performed_by}</span>
                  <span className="text-slate-400">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}</span>
                  {ev.metadata && Object.keys(ev.metadata).length > 0 && <span className="text-slate-500">{JSON.stringify(ev.metadata)}</span>}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}