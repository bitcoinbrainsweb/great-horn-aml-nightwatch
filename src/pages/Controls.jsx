import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { Shield } from 'lucide-react';

export default function Controls() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: '',
    department: '',
    testing_method: '',
    testing_frequency: '',
    scope_tags: []
  });

  useEffect(() => {
    loadControls();
  }, []);

  async function loadControls() {
    setLoading(true);
    try {
      const data = await base44.entities.Control.list('-created_date');
      setControls(data);
    } catch (error) {
      console.error('Error loading controls:', error);
    } finally {
      setLoading(false);
    }
  }

  function openDialog(control = null) {
    if (control) {
      setEditing(control);
      setFormData({
        name: control.name || '',
        description: control.description || '',
        owner: control.owner || '',
        department: control.department || '',
        testing_method: control.testing_method || '',
        testing_frequency: control.testing_frequency || '',
        scope_tags: control.scope_tags || []
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        description: '',
        owner: '',
        department: '',
        testing_method: '',
        testing_frequency: '',
        scope_tags: []
      });
    }
    setShowDialog(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await base44.entities.Control.update(editing.id, formData);
      } else {
        await base44.entities.Control.create(formData);
      }
      setShowDialog(false);
      loadControls();
    } catch (error) {
      console.error('Error saving control:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this control?')) return;
    try {
      await base44.entities.Control.delete(id);
      loadControls();
    } catch (error) {
      console.error('Error deleting control:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Controls" subtitle="Internal controls and testing procedures">
        <Button onClick={() => openDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Control
        </Button>
      </PageHeader>

      {controls.length === 0 ? (
        <EmptyState icon={Shield} title="No controls" description="Create your first control to begin testing." />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Testing Frequency</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {controls.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.owner}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.department || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.testing_frequency || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openDialog(c)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Control' : 'New Control'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Name *</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Owner *</label>
                <Input value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Department</label>
                <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Testing Method</label>
                <Select value={formData.testing_method} onValueChange={v => setFormData({...formData, testing_method: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inquiry">Inquiry</SelectItem>
                    <SelectItem value="Observation">Observation</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Re-performance">Re-performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Testing Frequency</label>
                <Select value={formData.testing_frequency} onValueChange={v => setFormData({...formData, testing_frequency: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Semi-Annually">Semi-Annually</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                    <SelectItem value="Ad-hoc">Ad-hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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