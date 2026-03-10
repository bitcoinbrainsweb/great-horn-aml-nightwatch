import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Edit2, FileUp, Plus, Trash2, AlertTriangle, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, RiskBadge, PriorityBadge } from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import IntakeTab from '../components/engagement/IntakeTab';
import RisksTab from '../components/engagement/RisksTab';
import ControlsTab from '../components/engagement/ControlsTab';
import SummaryTab from '../components/engagement/SummaryTab';
import ReportTab from '../components/engagement/ReportTab';
import ReviewTab from '../components/engagement/ReviewTab';
import RiskSnapshotPanel from '../components/engagement/RiskSnapshotPanel';
import ProgressTracker from '../components/engagement/ProgressTracker';
import { format } from 'date-fns';
import { logAudit } from '../lib/auditLog';

const ENGAGEMENT_STATUSES = ['Not Started', 'Intake In Progress', 'Risk Analysis', 'Draft Report', 'Under Review', 'Completed', 'Archived'];

export default function EngagementDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const engId = urlParams.get('id');
  const [engagement, setEngagement] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [users, setUsers] = useState([]);
  const [methodologies, setMethodologies] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({});
  const [user, setUser] = useState(null);
  const [completionError, setCompletionError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [savingNotes, setSavingNotes] = useState(false);
  const [engNotes, setEngNotes] = useState('');

  useEffect(() => { if (engId) loadData(); }, [engId]);

  async function loadData() {
    const [engs, t, d, a, u, m, me, rpts] = await Promise.all([
      base44.entities.Engagement.list(),
      base44.entities.Task.filter({ engagement_id: engId }),
      base44.entities.Document.filter({ engagement_id: engId }),
      base44.entities.ActivityLog.filter({ engagement_id: engId }),
      base44.entities.User.list(),
      base44.entities.Methodology.list(),
      base44.auth.me(),
      base44.entities.Report.filter({ engagement_id: engId }),
    ]);
    const eng = engs.find(e => e.id === engId);
    setEngagement(eng);
    setEngNotes(eng?.engagement_notes || '');
    setTasks(t.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    setDocuments(d);
    setActivities(a);
    setUsers(u);
    setMethodologies(m);
    setUser(me);
    setReports(rpts);
    setLoading(false);
  }

  const isAdmin = ['admin', 'super_admin', 'compliance_admin'].includes(user?.role);

  async function saveNotes() {
    setSavingNotes(true);
    await base44.entities.Engagement.update(engId, { engagement_notes: engNotes });
    setSavingNotes(false);
  }

  async function handleSave() {
    const meth = methodologies.find(m => m.id === form.methodology_id);
    await base44.entities.Engagement.update(engId, { ...form, methodology_name: meth?.name || form.methodology_name });
    setEditing(false);
    await loadData();
  }

  async function handleStatusChange(newStatus) {
    setCompletionError('');
    if (newStatus === 'Completed') {
      const latestReport = reports[0];
      if (!latestReport) {
        setCompletionError('A report must be generated before marking this engagement as Completed.');
        return;
      }
      if (!['Approved', 'Finalized', 'Exported'].includes(latestReport.status)) {
        setCompletionError(`The report must be Approved or Finalized before marking this engagement as Completed. Current report status: ${latestReport.status}.`);
        return;
      }
    }
    await logAudit({ userEmail: user?.email, objectType: 'Engagement', objectId: engId, action: 'status_changed', fieldChanged: 'status', oldValue: engagement.status, newValue: newStatus, details: `Status: ${engagement.status} → ${newStatus}` });
    await base44.entities.Engagement.update(engId, { status: newStatus });
    await loadData();
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const me = await base44.auth.me();
    await base44.entities.Document.create({
      engagement_id: engId,
      client_id: engagement?.client_id,
      file_name: file.name,
      file_url,
      document_type: 'Supporting File',
      uploaded_by: me.email
    });
    await loadData();
  }

  async function updateTaskStatus(taskId, status) {
    const updates = { status };
    if (status === 'Completed') updates.completed_date = new Date().toISOString().split('T')[0];
    await base44.entities.Task.update(taskId, updates);
    await loadData();
  }

  async function addTask(e) {
    e.preventDefault();
    await base44.entities.Task.create({
      ...taskForm,
      engagement_id: engId,
      engagement_name: `${engagement.client_name} - ${engagement.engagement_type}`,
      client_name: engagement.client_name,
      status: 'Not Started',
      sort_order: tasks.length + 1
    });
    setShowAddTask(false);
    setTaskForm({});
    await loadData();
  }

  async function deleteTask(taskId) {
    await base44.entities.Task.delete(taskId);
    await loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (!engagement) {
    return <EmptyState title="Engagement not found" />;
  }

  const isTestData = engagement.notes?.includes('[TEST DATA');
  const noAnalyst = !engagement.assigned_analyst;
  const noReviewer = !engagement.assigned_reviewer;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to={createPageUrl('Engagements')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{engagement.client_name}</h1>
            {isTestData && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">Test Data</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-slate-500">
              <span className="font-medium text-slate-600">Status:</span>
            </span>
            <StatusBadge status={engagement.status} />
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              <span className="font-medium text-slate-600">Overall Risk:</span>
            </span>
            <RiskBadge rating={engagement.overall_risk_rating} />
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">{engagement.engagement_type} · {engagement.methodology_name || 'No methodology'}</span>
          </div>
        </div>
        <Select value={engagement.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENGAGEMENT_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setForm(engagement); setEditing(true); }} className="gap-2">
          <Edit2 className="w-4 h-4" /> Edit
        </Button>
      </div>

      {/* Assignment warnings */}
      {(noAnalyst || noReviewer) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {noAnalyst && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> No analyst assigned to this engagement.
            </div>
          )}
          {noReviewer && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> No reviewer assigned. Required before submitting for review.
            </div>
          )}
        </div>
      )}

      {/* Completion error */}
      {completionError && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {completionError}
        </div>
      )}

      {/* Risk snapshot */}
      <RiskSnapshotPanel engagement={engagement} />

      {/* Progress tracker */}
      <ProgressTracker engagement={engagement} onTabChange={tab => setActiveTab(tab)} />

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Engagement Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Client', engagement.client_name],
                  ['Type', engagement.engagement_type],
                  ['Methodology', engagement.methodology_name],
                  ['Priority', engagement.priority],
                  ['Analyst', engagement.assigned_analyst],
                  ['Reviewer', engagement.assigned_reviewer],
                  ['Start Date', engagement.start_date ? format(new Date(engagement.start_date), 'MMM d, yyyy') : '—'],
                  ['Target Delivery', engagement.target_delivery_date ? format(new Date(engagement.target_delivery_date), 'MMM d, yyyy') : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-medium text-slate-900 mt-0.5">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/60 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Tasks Progress</h3>
              {tasks.length === 0 ? <p className="text-xs text-slate-500">No tasks.</p> : (
                <div className="space-y-2">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1.5">
                      <p className="text-sm text-slate-700 truncate mr-2">{t.task_name}</p>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              )}
              {reports.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Report Status</h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={reports[0].status} />
                    <span className="text-xs text-slate-500">v{reports[0].version} · {reports[0].report_type}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intake">
          <IntakeTab engagement={engagement} />
        </TabsContent>

        <TabsContent value="risks">
          <RisksTab engagement={engagement} />
        </TabsContent>

        <TabsContent value="controls">
          <ControlsTab engagement={engagement} />
        </TabsContent>

        <TabsContent value="summary">
          <SummaryTab engagement={engagement} />
        </TabsContent>

        <TabsContent value="report">
          <ReportTab engagement={engagement} />
        </TabsContent>

        <TabsContent value="review">
          <ReviewTab engagement={engagement} />
        </TabsContent>

        <TabsContent value="documents">
          <div className="mb-4">
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleUpload} />
              <Button variant="outline" className="gap-2" asChild><span><FileUp className="w-4 h-4" /> Upload Document</span></Button>
            </label>
          </div>
          {documents.length === 0 ? (
            <EmptyState title="No documents" description="Upload documents for this engagement." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100">
              {documents.map(d => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{d.file_name}</a>
                    <p className="text-xs text-slate-500">{d.document_type} · {d.uploaded_by}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setShowAddTask(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100">
            {tasks.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No tasks.</p>}
            {tasks.map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{t.task_name}</p>
                  <p className="text-xs text-slate-500">{t.task_type} · {t.assigned_user || 'Unassigned'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={t.status} onValueChange={v => updateTaskStatus(t.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Not Started', 'In Progress', 'Waiting Review', 'Completed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id)} className="h-7 w-7 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="bg-white rounded-xl border border-slate-200/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Engagement Notes</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">Record observations, interview notes, internal commentary, and review comments. Visible to all team members on this engagement.</p>
            <Textarea
              value={engNotes}
              onChange={e => setEngNotes(e.target.value)}
              rows={14}
              placeholder="Enter observations, interview notes, findings, or internal commentary here..."
              className="font-mono text-sm leading-relaxed"
            />
            <div className="flex justify-end mt-3">
              <Button onClick={saveNotes} disabled={savingNotes} className="bg-slate-900 hover:bg-slate-800">
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          {activities.length === 0 ? (
            <EmptyState title="No activity recorded" />
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

      {/* Edit Engagement Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Engagement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Analyst</Label>
                <Select value={form.assigned_analyst || ''} onValueChange={v => setForm({...form, assigned_analyst: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reviewer</Label>
                <Select value={form.assigned_reviewer || ''} onValueChange={v => setForm({...form, assigned_reviewer: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Delivery</Label>
                <Input type="date" value={form.target_delivery_date || ''} onChange={e => setForm({...form, target_delivery_date: e.target.value})} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority || ''} onValueChange={v => setForm({...form, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Low', 'Medium', 'High', 'Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Methodology</Label>
                <Select value={form.methodology_id || ''} onValueChange={v => setForm({...form, methodology_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{methodologies.filter(m => m.status === 'Active').map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Overall Risk Rating</Label>
                <Select value={form.overall_risk_rating || ''} onValueChange={v => setForm({...form, overall_risk_rating: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Low', 'Moderate', 'High', 'Not Rated'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <form onSubmit={addTask} className="space-y-3">
            <div><Label>Task Name</Label><Input required value={taskForm.task_name || ''} onChange={e => setTaskForm({...taskForm, task_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={taskForm.task_type || 'Custom'} onValueChange={v => setTaskForm({...taskForm, task_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Intake', 'Analysis', 'Drafting', 'Review', 'Delivery', 'Custom'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned To</Label>
                <Select value={taskForm.assigned_user || ''} onValueChange={v => setTaskForm({...taskForm, assigned_user: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={taskForm.due_date || ''} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} /></div>
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority || 'Medium'} onValueChange={v => setTaskForm({...taskForm, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Low', 'Medium', 'High', 'Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">Add Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}