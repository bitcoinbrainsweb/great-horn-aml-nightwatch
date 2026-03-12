import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';

export default function RemediationActions() {
  const [actions, setActions] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterFindingId, setFilterFindingId] = useState(null);
  const [formData, setFormData] = useState({
    finding_id: '',
    title: '',
    description: '',
    owner: '',
    target_date: '',
    completion_date: '',
    status: 'Planned',
    evidence_of_completion: '',
    notes: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const findingId = params.get('finding_id');
    if (findingId) setFilterFindingId(findingId);
    loadData();
  }, []);

  // Validate finding_id exists
  const findingExists = filterFindingId ? findings.some(f => f.id === filterFindingId) : true;
  const linkedFinding = filterFindingId ? findings.find(f => f.id === filterFindingId) : null;

  async function loadData() {
    setLoading(true);
    try {
      const [actionsData, findingsData] = await Promise.all([
        base44.entities.RemediationAction.list('-created_date'),
        base44.entities.Finding.list()
      ]);
      setActions(actionsData);
      setFindings(findingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openDialog(action = null) {
    if (action) {
      setEditing(action);
      setFormData({
        finding_id: action.finding_id || '',
        title: action.title || '',
        description: action.description || '',
        owner: action.owner || '',
        target_date: action.target_date || '',
        completion_date: action.completion_date || '',
        status: action.status || 'Open',
        evidence_of_completion: action.evidence_of_completion || '',
        notes: action.notes || ''
      });
    } else {
      setEditing(null);
      setFormData({
        finding_id: filterFindingId || '',
        title: '',
        description: '',
        owner: '',
        target_date: '',
        completion_date: '',
        status: 'Planned',
        evidence_of_completion: '',
        notes: ''
      });
    }
    setShowDialog(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await base44.entities.RemediationAction.update(editing.id, formData);
      } else {
        await base44.entities.RemediationAction.create(formData);
      }
      setShowDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving remediation action:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this remediation action?')) return;
    try {
      await base44.entities.RemediationAction.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting remediation action:', error);
    }
  }

  const statusColors = {
    'Open': 'bg-red-100 text-red-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Complete': 'bg-amber-100 text-amber-800',
    'Verified': 'bg-green-100 text-green-800',
    'Closed': 'bg-slate-100 text-slate-600'
  };

  const filteredActions = filterFindingId 
    ? actions.filter(a => a.finding_id === filterFindingId)
    : actions;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      {filterFindingId && !loading && !findingExists && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-semibold">⚠️ Warning: Finding not found</p>
          <p className="text-xs mt-1">The finding ID in the URL does not exist. It may have been deleted.</p>
        </div>
      )}
      <PageHeader 
        title="Remediation Actions" 
        subtitle={filterFindingId && linkedFinding ? `Actions for finding: ${linkedFinding.title}` : filterFindingId && !linkedFinding ? "Filtered by invalid finding ID" : "Remediation actions across all findings"}
      >
        <Button onClick={() => openDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Action
        </Button>
      </PageHeader>

      {filteredActions.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No remediation actions" description="Create actions to track finding remediation." />
      ) : (
        <div className="grid gap-4">
          {filteredActions.map(a => {
            const finding = findings.find(f => f.id === a.finding_id);
            return (
              <div key={a.id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                      <Badge className={statusColors[a.status]}>{a.status}</Badge>
                    </div>
                    {a.description && <p className="text-xs text-slate-600 mb-2">{a.description}</p>}
                    <div className="flex items-center gap-6 text-xs text-slate-500">
                      <span>Finding: {finding?.title || 'Unknown'}</span>
                      {a.owner && <span>Owner: {a.owner}</span>}
                      {a.target_date && <span>Target: {a.target_date}</span>}
                      {a.completion_date && <span>Completed: {a.completion_date}</span>}
                    </div>
                    {a.evidence_of_completion && (
                      <div className="mt-2 bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800">
                        <strong>Evidence:</strong> {a.evidence_of_completion}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(a)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Remediation Action' : 'New Remediation Action'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Finding *</label>
              <Select value={formData.finding_id} onValueChange={v => setFormData({...formData, finding_id: v})} required>
                <SelectTrigger><SelectValue placeholder="Select finding..." /></SelectTrigger>
                <SelectContent>
                  {findings.map(f => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Title *</label>
              <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Owner</label>
                <Input value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Target Date</label>
                <Input type="date" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Completion Date</label>
                <Input type="date" value={formData.completion_date} onChange={e => setFormData({...formData, completion_date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Evidence of Completion</label>
              <Textarea value={formData.evidence_of_completion} onChange={e => setFormData({...formData, evidence_of_completion: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Notes</label>
              <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}