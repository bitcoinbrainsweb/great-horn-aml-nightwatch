import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Send, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';
import { logAudit } from '../components/util/auditLog';
import { format } from 'date-fns';

const ROLES = [
  { value: 'compliance_admin', label: 'Compliance Admin' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'super_admin', label: 'Technical Admin' },
];

const ROLE_DISPLAY = {
  super_admin: 'Technical Admin',
  compliance_admin: 'Compliance Admin',
  analyst: 'Analyst',
  reviewer: 'Reviewer',
};

const STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Revoked: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function AdminInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'analyst', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [inv, me] = await Promise.all([
      base44.entities.UserInvitation.list('-created_date', 100),
      base44.auth.me(),
    ]);
    setInvitations(inv);
    setUser(me);
    setLoading(false);
  }

  const canManage = ['super_admin', 'compliance_admin', 'admin'].includes(user?.role);

  async function sendInvite(e) {
    e.preventDefault();
    setSaving(true);
    const workspace = await base44.entities.Workspace.filter({ is_default: true }).then(w => w[0]);
    const inv = await base44.entities.UserInvitation.create({
      email: form.email.toLowerCase().trim(),
      role: form.role,
      invited_by: user?.email,
      workspace_id: workspace?.id || '',
      notes: form.notes,
      status: 'Pending',
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'UserInvitation',
      objectId: inv.id,
      action: 'invitation_sent',
      details: `Invitation sent to ${form.email} with role ${form.role}`,
    });
    setShowInvite(false);
    setForm({ email: '', role: 'analyst', notes: '' });
    setSaving(false);
    await load();
  }

  async function revokeInvite(inv) {
    await base44.entities.UserInvitation.update(inv.id, { status: 'Revoked' });
    await logAudit({
      userEmail: user?.email,
      objectType: 'UserInvitation',
      objectId: inv.id,
      action: 'invitation_revoked',
      details: `Invitation to ${inv.email} revoked by ${user?.email}`,
    });
    await load();
  }

  async function resendInvite(inv) {
    await base44.entities.UserInvitation.update(inv.id, { status: 'Pending', invited_by: user?.email });
    await logAudit({
      userEmail: user?.email,
      objectType: 'UserInvitation',
      objectId: inv.id,
      action: 'invitation_resent',
      details: `Invitation to ${inv.email} resent by ${user?.email}`,
    });
    await load();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  const pending = invitations.filter(i => i.status === 'Pending');
  const active = invitations.filter(i => i.status === 'Active');
  const revoked = invitations.filter(i => i.status === 'Revoked');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader
          title="User Invitations"
          subtitle={`${pending.length} pending · ${active.length} active · ${revoked.length} revoked`}
        >
          {canManage && (
            <Button onClick={() => setShowInvite(true)} className="bg-slate-900 hover:bg-slate-800 gap-2">
              <Plus className="w-4 h-4" /> Invite User
            </Button>
          )}
        </PageHeader>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Invited By</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              {canManage && <th className="w-24"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invitations.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-500">No invitations yet.</td></tr>
            ) : invitations.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-900">{inv.email}</td>
                <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">{ROLE_DISPLAY[inv.role] || inv.role}</span>
                </td>
                <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{inv.invited_by || '—'}</td>
                <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">
                  {inv.created_date ? format(new Date(inv.created_date), 'MMM d, yyyy') : '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                    {inv.status}
                  </span>
                </td>
                {canManage && (
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {inv.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => resendInvite(inv)}
                            title="Resend invite"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => revokeInvite(inv)}
                            title="Revoke invite"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {inv.status === 'Revoked' && (
                        <button
                          onClick={() => resendInvite(inv)}
                          title="Re-invite"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
        <strong>Invitation-only access is enforced.</strong> Users from allowed domains who attempt to log in without a matching Pending invitation will see an access-denied message. 
        Only users with an Active or Pending invitation tied to their email can access this workspace.
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <form onSubmit={sendInvite} className="space-y-4">
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                required
                placeholder="user@greathornaml.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                placeholder="e.g. New analyst, Vancouver team"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 gap-2">
                <Send className="w-4 h-4" />
                {saving ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}