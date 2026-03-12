import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';

export default function TestCycles() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Planned'
  });

  useEffect(() => {
    loadCycles();
  }, []);

  async function loadCycles() {
    setLoading(true);
    try {
      const data = await base44.entities.TestCycle.list('-start_date');
      setCycles(data);
    } catch (error) {
      console.error('Error loading test cycles:', error);
    } finally {
      setLoading(false);
    }
  }

  function openDialog(cycle = null) {
    if (cycle) {
      setEditing(cycle);
      setFormData({
        name: cycle.name || '',
        description: cycle.description || '',
        start_date: cycle.start_date || '',
        end_date: cycle.end_date || '',
        status: cycle.status || 'Planned'
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'Draft'
      });
    }
    setShowDialog(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // Validate workflow state transitions
      if (editing) {
        const isImmutable = editing.status === 'Complete' || editing.status === 'Archived';
        if (isImmutable && editing.status !== formData.status) {
          alert(`Cannot modify ${editing.status} test cycles`);
          return;
        }
        await base44.entities.TestCycle.update(editing.id, formData);
      } else {
        await base44.entities.TestCycle.create(formData);
      }
      setShowDialog(false);
      loadCycles();
    } catch (error) {
      console.error('Error saving test cycle:', error);
      alert(error.message || 'Error saving test cycle');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this test cycle?')) return;
    try {
      await base44.entities.TestCycle.delete(id);
      loadCycles();
    } catch (error) {
      console.error('Error deleting test cycle:', error);
    }
  }

  const statusColors = {
    'Draft': 'bg-slate-100 text-slate-600',
    'Active': 'bg-blue-100 text-blue-800',
    'Complete': 'bg-green-100 text-green-800',
    'Archived': 'bg-slate-400 text-slate-50'
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Test Cycles" subtitle="Control testing periods and review events">
        <Button onClick={() => openDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Test Cycle
        </Button>
      </PageHeader>

      {cycles.length === 0 ? (
        <EmptyState icon={Calendar} title="No test cycles" description="Create a test cycle to begin control testing." />
      ) : (
        <div className="grid gap-4">
          {cycles.map(c => (
            <div key={c.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-slate-900">{c.name}</h3>
                    <Badge className={statusColors[c.status] || 'bg-slate-100 text-slate-600'}>{c.status}</Badge>
                  </div>
                  {c.description && <p className="text-xs text-slate-600 mb-3">{c.description}</p>}
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <span>Start: {c.start_date}</span>
                    {c.end_date && <span>End: {c.end_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openDialog(c)}
                    disabled={c.status === 'Complete' || c.status === 'Archived'}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(c.id)}
                    disabled={c.status === 'Complete' || c.status === 'Archived'}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Test Cycle' : 'New Test Cycle'}</DialogTitle>
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
                <label className="text-xs font-medium text-slate-700">Start Date *</label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">End Date</label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Status</label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
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