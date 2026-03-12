import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import BulkActionBar from '@/components/bulk/BulkActionBar';

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source_type: 'Manual',
    source_reference_id: '',
    severity: 'Medium',
    status: 'Open',
    owner: '',
    due_date: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadFindings();
  }, []);

  async function loadFindings() {
    setLoading(true);
    try {
      const data = await base44.entities.Finding.list('-created_date');
      setFindings(data);
    } catch (error) {
      console.error('Error loading findings:', error);
    } finally {
      setLoading(false);
    }
  }

  function openDialog(finding = null) {
    if (finding) {
      setEditing(finding);
      setFormData({
        title: finding.title || '',
        description: finding.description || '',
        source_type: finding.source_type || 'Manual',
        source_reference_id: finding.source_reference_id || '',
        severity: finding.severity || 'Medium',
        status: finding.status || 'Open',
        owner: finding.owner || '',
        due_date: finding.due_date || ''
      });
    } else {
      setEditing(null);
      setFormData({
        title: '',
        description: '',
        source_type: 'Manual',
        source_reference_id: '',
        severity: 'Medium',
        status: 'Open',
        owner: '',
        due_date: ''
      });
    }
    setShowDialog(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // Validate closed findings cannot be modified
      if (editing && editing.status === 'Closed') {
        alert('Cannot modify closed findings');
        return;
      }

      if (editing) {
        await base44.entities.Finding.update(editing.id, formData);
      } else {
        await base44.entities.Finding.create(formData);
      }
      setShowDialog(false);
      loadFindings();
    } catch (error) {
      console.error('Error saving finding:', error);
      alert(error.message || 'Error saving finding');
    }
  }

  async function handleDelete(id) {
     if (!confirm('Delete this finding?')) return;
     try {
       await base44.entities.Finding.delete(id);
       loadFindings();
     } catch (error) {
       console.error('Error deleting finding:', error);
     }
   }

   function toggleSelect(id) {
     const newSet = new Set(selectedIds);
     if (newSet.has(id)) {
       newSet.delete(id);
     } else {
       newSet.add(id);
     }
     setSelectedIds(newSet);
   }

   function toggleSelectAll() {
     if (selectedIds.size === findings.length) {
       setSelectedIds(new Set());
     } else {
       setSelectedIds(new Set(findings.map(f => f.id)));
     }
   }

   async function handleBulkAction(action, value) {
     try {
       const ids = Array.from(selectedIds);
       const response = await base44.functions.invoke('bulkUpdateEntities', {
         entity_name: 'Finding',
         ids: ids,
         action: action,
         value: value
       });
       if (response.data.success) {
         alert(`Updated ${response.data.results.success} findings`);
         setSelectedIds(new Set());
         loadFindings();
       }
     } catch (error) {
       console.error('Error:', error);
       alert('Bulk action failed');
     }
   }

   async function handleExport() {
     try {
       const response = await base44.functions.invoke('exportEntityData', {
         entity_name: 'Finding',
         format: 'csv'
       });
       if (response.data.success) {
         const blob = new Blob([response.data.csv], { type: 'text/csv' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `findings-${new Date().toISOString().split('T')[0]}.csv`;
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
         document.body.removeChild(a);
       }
     } catch (error) {
       console.error('Error:', error);
       alert('Export failed');
     }
   }

  const severityColors = {
    'Low': 'bg-blue-100 text-blue-800',
    'Medium': 'bg-amber-100 text-amber-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800'
  };

  const statusColors = {
    'Open': 'bg-red-100 text-red-800',
    'Under Review': 'bg-amber-100 text-amber-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Closed': 'bg-slate-100 text-slate-600'
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Findings" subtitle="Control testing findings and governance issues">
        <Button onClick={() => openDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Finding
        </Button>
      </PageHeader>

      {findings.length === 0 ? (
         <EmptyState icon={AlertCircle} title="No findings" description="Create findings from control tests or manually." />
       ) : (
         <>
           <BulkActionBar 
             selectedIds={selectedIds} 
             onBulkAction={handleBulkAction}
             onExport={handleExport}
             entity_type="Finding"
             bulkActions={['status', 'owner']}
           />
           <div className="grid gap-4">
             {findings.map(f => (
               <div key={f.id} className="bg-white rounded-lg border border-slate-200 p-4 relative">
                 <Checkbox 
                   checked={selectedIds.has(f.id)}
                   onCheckedChange={() => toggleSelect(f.id)}
                   className="absolute top-4 right-4"
                 />
                 <div className="flex items-start justify-between mb-3">
                   <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                    <Badge className={severityColors[f.severity]}>{f.severity}</Badge>
                    <Badge className={statusColors[f.status]}>{f.status}</Badge>
                  </div>
                  {f.description && <p className="text-xs text-slate-600 mb-3">{f.description}</p>}
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <span>Source: {f.source_type}</span>
                    {f.owner && <span>Owner: {f.owner}</span>}
                    {f.due_date && <span>Due: {f.due_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('RemediationActions') + '?finding_id=' + f.id)}>
                    Actions
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openDialog(f)}
                    disabled={f.status === 'Closed'}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(f.id)}
                    disabled={f.status === 'Closed'}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          </div>
          </>
          )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Finding' : 'New Finding'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Title *</label>
              <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Source Type *</label>
                <Select value={formData.source_type} onValueChange={v => setFormData({...formData, source_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ControlTest">Control Test</SelectItem>
                    <SelectItem value="Audit">Audit</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Severity *</label>
                <Select value={formData.severity} onValueChange={v => setFormData({...formData, severity: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Status</label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Owner</label>
                <Input value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Due Date</label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Source Reference ID</label>
              <Input value={formData.source_reference_id} onChange={e => setFormData({...formData, source_reference_id: e.target.value})} placeholder="Optional ControlTest or Audit ID" />
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