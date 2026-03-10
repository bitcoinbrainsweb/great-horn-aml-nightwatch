import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Edit2, Building2, FileStack, FileUp, ListTodo, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge, RiskBadge } from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { logAudit } from '../components/util/auditLog';

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  const [client, setClient] = useState(null);
  const [engagements, setEngagements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => { if (clientId) loadData(); }, [clientId]);

  async function loadData() {
    const [c, e, d, t, a, u, me] = await Promise.all([
      base44.entities.Client.list().then(all => all.find(x => x.id === clientId)),
      base44.entities.Engagement.filter({ client_id: clientId }),
      base44.entities.Document.filter({ client_id: clientId }),
      base44.entities.Task.list('-created_date', 200).then(all => all.filter(t => engagements.some(e => e.id === t.engagement_id) || t.client_name === '')),
      base44.entities.ActivityLog.filter({ client_id: clientId }),
      base44.entities.User.list(),
      base44.auth.me(),
    ]);
    setClient(c);
    setEngagements(e);
    setDocuments(d);
    setActivities(a);
    setUsers(u);
    setUser(me);
    // Get tasks for client's engagements
    if (e.length > 0) {
      const engIds = new Set(e.map(x => x.id));
      const allTasks = await base44.entities.Task.list('-created_date', 200);
      setTasks(allTasks.filter(t => engIds.has(t.engagement_id)));
    }
    setLoading(false);
  }

  async function handleSave() {
    const changedFields = Object.keys(form).filter(k => form[k] !== client[k]);
    await base44.entities.Client.update(clientId, form);
    await logAudit({
      userEmail: user?.email,
      objectType: 'Client',
      objectId: clientId,
      action: 'updated',
      fieldChanged: changedFields.join(', '),
      oldValue: changedFields.map(k => `${k}: ${client[k]}`).join('; '),
      newValue: changedFields.map(k => `${k}: ${form[k]}`).join('; '),
      details: `Updated client: ${form.legal_name || client.legal_name}`,
    });
    setEditing(false);
    await loadData();
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Document.create({
      client_id: clientId,
      file_name: file.name,
      file_url,
      document_type: 'Client Material',
      uploaded_by: (await base44.auth.me()).email
    });
    await loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (!client) {
    return <EmptyState icon={Building2} title="Client not found" />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Clients')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{client.legal_name}</h1>
          <p className="text-sm text-slate-500">{client.operating_name && client.operating_name !== client.legal_name ? `${client.operating_name} · ` : ''}{client.industry || 'No industry'} · <StatusBadge status={client.status} /></p>
        </div>
        <Button variant="outline" onClick={() => { setForm(client); setEditing(true); }} className="gap-2">
          <Edit2 className="w-4 h-4" /> Edit
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagements">Engagements ({engagements.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Client Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Legal Name', client.legal_name],
                  ['Operating Name', client.operating_name],
                  ['Industry', client.industry],
                  ['Client Type', client.client_type],
                  ['Jurisdiction', client.primary_jurisdiction],
                  ['Website', client.website],
                  ['Status', client.status],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-medium text-slate-900 mt-0.5">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Contacts & Assignments</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Contact Name', client.compliance_contact_name],
                  ['Contact Email', client.compliance_contact_email],
                  ['Contact Phone', client.compliance_contact_phone],
                  ['Analyst', client.assigned_analyst],
                  ['Reviewer', client.assigned_reviewer],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-medium text-slate-900 mt-0.5">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engagements">
          {engagements.length === 0 ? (
            <EmptyState icon={FileStack} title="No engagements" description="Create an engagement for this client." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Methodology</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Risk</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {engagements.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <Link to={createPageUrl(`EngagementDetail?id=${e.id}`)} className="font-medium text-blue-600 hover:underline">{e.engagement_type}</Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{e.methodology_name || '—'}</td>
                      <td className="px-5 py-3"><RiskBadge rating={e.overall_risk_rating} /></td>
                      <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="mb-4">
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleUpload} />
              <Button variant="outline" className="gap-2" asChild><span><FileUp className="w-4 h-4" /> Upload Document</span></Button>
            </label>
          </div>
          {documents.length === 0 ? (
            <EmptyState icon={FileUp} title="No documents" description="Upload documents for this client." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100">
              {documents.map(d => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{d.file_name}</a>
                    <p className="text-xs text-slate-500">{d.document_type} · {d.uploaded_by}</p>
                  </div>
                  <StatusBadge status={d.document_type} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          {tasks.length === 0 ? (
            <EmptyState icon={ListTodo} title="No tasks" />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100">
              {tasks.map(t => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.task_name}</p>
                    <p className="text-xs text-slate-500">{t.engagement_name}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {activities.length === 0 ? (
            <EmptyState icon={Clock} title="No activity recorded" />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100">
              {activities.map(a => (
                <div key={a.id} className="px-5 py-3">
                  <p className="text-sm"><span className="font-medium">{a.user_name || a.user_email}</span> {a.action} <span className="font-medium">{a.object_name}</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.created_date ? format(new Date(a.created_date), 'MMM d, h:mm a') : ''}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Legal Name</Label><Input value={form.legal_name || ''} onChange={e => setForm({...form, legal_name: e.target.value})} /></div>
            <div><Label>Operating Name</Label><Input value={form.operating_name || ''} onChange={e => setForm({...form, operating_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Industry</Label><Input value={form.industry || ''} onChange={e => setForm({...form, industry: e.target.value})} /></div>
              <div><Label>Jurisdiction</Label><Input value={form.primary_jurisdiction || ''} onChange={e => setForm({...form, primary_jurisdiction: e.target.value})} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || ''} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}