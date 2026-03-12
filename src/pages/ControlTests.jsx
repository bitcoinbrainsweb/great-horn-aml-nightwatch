import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardCheck, Plus, Upload } from 'lucide-react';
import { format } from 'date-fns';

export default function ControlTests() {
  const [editTest, setEditTest] = useState(null);
  const [evidenceDialog, setEvidenceDialog] = useState(null);
  const queryClient = useQueryClient();

  const { data: tests = [] } = useQuery({
    queryKey: ['control-tests'],
    queryFn: () => base44.entities.ControlTest.list()
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list()
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ['test-cycles'],
    queryFn: () => base44.entities.TestCycle.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ControlTest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['control-tests']);
      setEditTest(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ControlTest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['control-tests']);
      setEditTest(null);
    }
  });

  const getControlName = (id) => controls.find(c => c.id === id)?.name || 'Unknown';
  const getCycleName = (id) => cycles.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div>
      <PageHeader title="Control Tests" subtitle="Testing execution and evidence">
        <Button onClick={() => setEditTest({})}>
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Button>
      </PageHeader>

      <div className="grid gap-4">
        {tests.map(test => (
          <div key={test.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-slate-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">{getControlName(test.control_id)}</h3>
                  <p className="text-xs text-slate-500">{getCycleName(test.test_cycle_id)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEvidenceDialog(test)}>
                  <Upload className="w-4 h-4 mr-1" />
                  Evidence
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditTest(test)}>Edit</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${test.status === 'Reviewed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {test.status}
              </span>
              {test.effectiveness_rating && (
                <span className={`px-2 py-1 rounded ${test.effectiveness_rating === 'Effective' ? 'bg-emerald-100 text-emerald-700' : test.effectiveness_rating === 'Ineffective' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {test.effectiveness_rating}
                </span>
              )}
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{test.evidence_sufficiency}</span>
            </div>
          </div>
        ))}
      </div>

      {editTest && (
        <Dialog open={!!editTest} onOpenChange={() => setEditTest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTest.id ? 'Edit Test' : 'New Test'}</DialogTitle>
            </DialogHeader>
            <TestForm
              test={editTest}
              controls={controls}
              cycles={cycles}
              onSave={(data) => {
                if (editTest.id) {
                  updateMutation.mutate({ id: editTest.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => setEditTest(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {evidenceDialog && (
        <EvidenceDialog test={evidenceDialog} onClose={() => setEvidenceDialog(null)} />
      )}
    </div>
  );
}

function TestForm({ test, controls, cycles, onSave, onCancel }) {
  const [form, setForm] = useState(test || {});

  return (
    <div className="space-y-4">
      <Select value={form.control_id || ''} onValueChange={(v) => setForm({ ...form, control_id: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Select Control" />
        </SelectTrigger>
        <SelectContent>
          {controls.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={form.test_cycle_id || ''} onValueChange={(v) => setForm({ ...form, test_cycle_id: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Select Test Cycle" />
        </SelectTrigger>
        <SelectContent>
          {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={form.status || 'Draft'} onValueChange={(v) => setForm({ ...form, status: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Draft">Draft</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Complete">Complete</SelectItem>
          <SelectItem value="Reviewed">Reviewed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={form.effectiveness_rating || ''} onValueChange={(v) => setForm({ ...form, effectiveness_rating: v })}>
        <SelectTrigger>
          <SelectValue placeholder="Effectiveness Rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Effective">Effective</SelectItem>
          <SelectItem value="Partially Effective">Partially Effective</SelectItem>
          <SelectItem value="Ineffective">Ineffective</SelectItem>
          <SelectItem value="Not Tested">Not Tested</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} className="flex-1">Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function EvidenceDialog({ test, onClose }) {
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  const { data: evidence = [] } = useQuery({
    queryKey: ['evidence', test.id],
    queryFn: () => base44.entities.Evidence.filter({ control_test_id: test.id })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Evidence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evidence', test.id]);
      setForm({});
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Evidence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {evidence.map(e => (
              <div key={e.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">{e.evidence_type}</span>
                  {e.evidence_date && <span className="text-xs text-slate-500">{format(new Date(e.evidence_date), 'MMM d, yyyy')}</span>}
                </div>
                <p className="text-slate-700">{e.text_description || e.url_reference || e.file_reference}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-3">
            <Select value={form.evidence_type || ''} onValueChange={(v) => setForm({ ...form, evidence_type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Evidence Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="URL">URL</SelectItem>
                <SelectItem value="File">File</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Evidence description..."
              value={form.text_description || ''}
              onChange={(e) => setForm({ ...form, text_description: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Evidence Date"
              value={form.evidence_date || ''}
              onChange={(e) => setForm({ ...form, evidence_date: e.target.value })}
            />
            <Button onClick={() => {
              createMutation.mutate({
                control_test_id: test.id,
                evidence_type: form.evidence_type || 'Text',
                text_description: form.text_description,
                evidence_date: form.evidence_date,
                uploaded_by: 'system',
                upload_timestamp: new Date().toISOString(),
                sufficiency_flag: true
              });
            }}>
              Add Evidence
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}