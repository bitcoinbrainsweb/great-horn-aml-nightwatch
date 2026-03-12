import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Plus, Edit, Search } from 'lucide-react';

export default function Controls() {
  const [search, setSearch] = useState('');
  const [editControl, setEditControl] = useState(null);
  const queryClient = useQueryClient();

  const { data: controls = [], isLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['controls']);
      setEditControl(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Control.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['controls']);
      setEditControl(null);
    }
  });

  const filtered = controls.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Controls" subtitle="Manage control framework">
        <Button onClick={() => setEditControl({})}>
          <Plus className="w-4 h-4 mr-2" />
          Add Control
        </Button>
      </PageHeader>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search controls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(control => (
            <div key={control.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">{control.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{control.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {control.department && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded">{control.department}</span>
                    )}
                    {control.testing_frequency && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{control.testing_frequency}</span>
                    )}
                    {control.testing_method && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">{control.testing_method}</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditControl(control)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editControl && (
        <Dialog open={!!editControl} onOpenChange={() => setEditControl(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editControl.id ? 'Edit Control' : 'New Control'}</DialogTitle>
            </DialogHeader>
            <ControlForm
              control={editControl}
              onSave={(data) => {
                if (editControl.id) {
                  updateMutation.mutate({ id: editControl.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => setEditControl(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ControlForm({ control, onSave, onCancel }) {
  const [form, setForm] = useState(control || {});

  return (
    <div className="space-y-4">
      <Input
        placeholder="Control Name"
        value={form.name || ''}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Textarea
        placeholder="Description"
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <Input
        placeholder="Owner Email"
        value={form.owner || ''}
        onChange={(e) => setForm({ ...form, owner: e.target.value })}
      />
      <Input
        placeholder="Department"
        value={form.department || ''}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />
      <Select value={form.testing_method || ''} onValueChange={(v) => setForm({ ...form, testing_method: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Testing Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Inquiry">Inquiry</SelectItem>
          <SelectItem value="Observation">Observation</SelectItem>
          <SelectItem value="Inspection">Inspection</SelectItem>
          <SelectItem value="Re-performance">Re-performance</SelectItem>
        </SelectContent>
      </Select>
      <Select value={form.testing_frequency || ''} onValueChange={(v) => setForm({ ...form, testing_frequency: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Testing Frequency" />
        </SelectTrigger>
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
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} className="flex-1">Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}