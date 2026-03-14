import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, FileText, Paperclip, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import EvidenceCard from '@/components/evidence/EvidenceCard';

export default function ControlTests() {
  const [tests, setTests] = useState([]);
  const [controls, setControls] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testFormData, setTestFormData] = useState({
    control_library_id: '',
    test_cycle_id: '',
    status: 'Planned',
    effectiveness_rating: '',
    prepared_by: '',
    reviewed_by: '',
    review_date: '',
    remediation_required: false,
    remediation_notes: '',
    remediation_target_date: '',
    evidence_sufficiency: 'Pending'
  });
  const [evidenceFormData, setEvidenceFormData] = useState({
    evidence_type: 'Text',
    text_description: '',
    evidence_date: '',
    sufficiency_flag: true,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [testsData, controlsData, cyclesData, resultsData] = await Promise.all([
        base44.entities.ControlTest.list('-created_date'),
        base44.entities.ControlLibrary.filter({ status: 'Active' }),
        base44.entities.TestCycle.list(),
        base44.entities.TestResult.list('-created_date')
      ]);
      setTests(testsData);
      setControls(controlsData);
      setCycles(cyclesData);
      setTestResults(resultsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEvidence(testId) {
    try {
      const data = await base44.entities.Evidence.filter({ control_test_id: testId });
      setEvidence(data);
    } catch (error) {
      console.error('Error loading evidence:', error);
    }
  }

  function openTestDialog(test = null) {
    if (test) {
      setEditingTest(test);
      setTestFormData({
        control_library_id: test.control_library_id || test.control_id || '',
        test_cycle_id: test.test_cycle_id || '',
        status: test.status || 'Draft',
        effectiveness_rating: test.effectiveness_rating || '',
        prepared_by: test.prepared_by || '',
        reviewed_by: test.reviewed_by || '',
        review_date: test.review_date || '',
        remediation_required: test.remediation_required || false,
        remediation_notes: test.remediation_notes || '',
        remediation_target_date: test.remediation_target_date || '',
        evidence_sufficiency: test.evidence_sufficiency || 'Pending'
      });
    } else {
      setEditingTest(null);
      setTestFormData({
        control_library_id: '',
        test_cycle_id: '',
        status: 'Planned',
        effectiveness_rating: '',
        prepared_by: '',
        reviewed_by: '',
        review_date: '',
        remediation_required: false,
        remediation_notes: '',
        remediation_target_date: '',
        evidence_sufficiency: 'Pending'
      });
    }
    setShowTestDialog(true);
  }

  async function openEvidenceDialog(test) {
    setSelectedTest(test);
    await loadEvidence(test.id);
    setEvidenceFormData({
      evidence_type: 'Text',
      text_description: '',
      evidence_date: '',
      sufficiency_flag: true,
      notes: ''
    });
    setShowEvidenceDialog(true);
  }

  async function handleTestSubmit(e) {
    e.preventDefault();
    try {
      // Validate test cycle status
      const cycle = cycles.find(c => c.id === testFormData.test_cycle_id);
      if (cycle && cycle.status !== 'Active' && cycle.status !== 'Draft') {
        alert(`Cannot create or update tests for a ${cycle.status} test cycle. Please select an Active or Draft cycle.`);
        return;
      }

      // Validate state transitions
      if (editingTest && editingTest.status === 'Completed') {
        alert('Cannot modify Completed tests');
        return;
      }

      const user = await base44.auth.me();
      const control = controls.find(c => c.id === testFormData.control_library_id);

      if (editingTest) {
        // When transitioning to In Progress, capture snapshot
        const isTransitioningToInProgress = 
          editingTest.status !== 'In Progress' && testFormData.status === 'In Progress';

        if (isTransitioningToInProgress && control) {
          const snapshot = {
            control_id: control.id,
            control_name: control.control_name,
            control_description: control.description,
            control_type: control.control_category,
            control_requirement_flag: control.status === 'Active',
            control_tags: control.scope_tags || []
          };
          testFormData.control_snapshot = JSON.stringify(snapshot);
          testFormData.snapshot_captured_at = new Date().toISOString();
        }

        await base44.entities.ControlTest.update(editingTest.id, testFormData);
      } else {
        // For new tests, capture snapshot on creation
        const snapshot = control ? {
          control_id: control.id,
          control_name: control.control_name,
          control_description: control.description,
          control_type: control.control_category,
          control_requirement_flag: control.status === 'Active',
          control_tags: control.scope_tags || []
        } : null;

        await base44.entities.ControlTest.create({
          ...testFormData,
          prepared_by: user.email,
          control_snapshot: snapshot ? JSON.stringify(snapshot) : null,
          snapshot_captured_at: testFormData.status === 'In Progress' ? new Date().toISOString() : null
        });
      }
      setShowTestDialog(false);
      loadData();
    } catch (error) {
      console.error('Error saving test:', error);
    }
  }

  async function handleEvidenceSubmit(e) {
    e.preventDefault();
    try {
      // Validate that test is In Progress
      if (selectedTest.status !== 'In Progress') {
        alert(`Cannot attach evidence to ${selectedTest.status} tests. Evidence can only be added to In Progress tests.`);
        return;
      }

      const user = await base44.auth.me();

      // Compute SHA-256 hash for all evidence types
      let fileHash = null;
      if (evidenceFormData.evidence_type === 'File' && evidenceFormData.file_reference) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(evidenceFormData.file_reference + evidenceFormData.evidence_date || new Date().toISOString());
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (hashError) {
          console.error('Error computing file hash:', hashError);
        }
      }

      const timestamp = new Date().toISOString();
      await base44.entities.Evidence.create({
        control_test_id: selectedTest.id,
        uploaded_by: user.email,
        uploaded_at: timestamp,
        upload_timestamp: timestamp,
        review_status: 'Pending',
        ...evidenceFormData,
        file_hash: fileHash,
        hash_algorithm: fileHash ? 'SHA-256' : null
      });
      await loadEvidence(selectedTest.id);
      setEvidenceFormData({
        evidence_type: 'Text',
        text_description: '',
        evidence_date: '',
        sufficiency_flag: true,
        notes: ''
      });
    } catch (error) {
      console.error('Error saving evidence:', error);
    }
  }

  const statusColors = {
    'Planned': 'bg-slate-100 text-slate-600',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800'
  };

  const ratingColors = {
    'Effective': 'bg-green-100 text-green-800',
    'Partially Effective': 'bg-amber-100 text-amber-800',
    'Ineffective': 'bg-red-100 text-red-800',
    'Not Tested': 'bg-slate-100 text-slate-600'
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Control Tests" subtitle="Control testing results and evidence">
        <Button onClick={() => openTestDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Button>
      </PageHeader>

      {tests.length === 0 ? (
        <EmptyState icon={FileText} title="No control tests" description="Create a control test to record testing results." />
      ) : (
        <div className="grid gap-4">
          {tests.map(t => {
            const control = controls.find(c => c.id === (t.control_library_id || t.control_id));
            const cycle = cycles.find(c => c.id === t.test_cycle_id);
            const result = testResults.find(r => r.test_id === t.id);
            return (
              <div key={t.id} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">{control?.control_name || control?.name || 'Unknown Control'}</h3>
                      <Badge className={statusColors[t.status]}>{t.status}</Badge>
                      {t.effectiveness_rating && (
                        <Badge className={ratingColors[t.effectiveness_rating]}>{t.effectiveness_rating}</Badge>
                      )}
                      {result && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {result.result_status}
                          </Badge>
                          {result.result_score !== null && result.result_score !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Score: {result.result_score}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>Cycle: {cycle?.name || 'Unknown'}</div>
                      {t.prepared_by && <div>Prepared by: {t.prepared_by}</div>}
                      {t.reviewed_by && <div>Reviewed by: {t.reviewed_by} on {t.review_date}</div>}
                      {result && result.review_status && (
                        <div>Result Review: {result.review_status}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEvidenceDialog(t)}>
                      <Paperclip className="w-3 h-3 mr-1" />
                      Evidence
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openTestDialog(t)}
                      disabled={t.status === 'Completed'}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {t.remediation_required && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs">
                    <div className="font-medium text-amber-900 mb-1">Remediation Required</div>
                    <div className="text-amber-700">{t.remediation_notes}</div>
                    {t.remediation_target_date && <div className="text-amber-600 mt-1">Target: {t.remediation_target_date}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTest ? 'Edit Control Test' : 'New Control Test'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTestSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Control *</label>
                <Select value={testFormData.control_library_id} onValueChange={v => setTestFormData({...testFormData, control_library_id: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select control..." /></SelectTrigger>
                  <SelectContent>
                    {controls.map(c => <SelectItem key={c.id} value={c.id}>{c.control_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Test Cycle *</label>
                <Select value={testFormData.test_cycle_id} onValueChange={v => setTestFormData({...testFormData, test_cycle_id: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select cycle..." /></SelectTrigger>
                  <SelectContent>
                    {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Status</label>
                <Select value={testFormData.status} onValueChange={v => setTestFormData({...testFormData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Effectiveness Rating</label>
                <Select value={testFormData.effectiveness_rating} onValueChange={v => setTestFormData({...testFormData, effectiveness_rating: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Effective">Effective</SelectItem>
                    <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                    <SelectItem value="Ineffective">Ineffective</SelectItem>
                    <SelectItem value="Not Tested">Not Tested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Reviewed By</label>
                <Input value={testFormData.reviewed_by} onChange={e => setTestFormData({...testFormData, reviewed_by: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Review Date</label>
                <Input type="date" value={testFormData.review_date} onChange={e => setTestFormData({...testFormData, review_date: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={testFormData.remediation_required} onCheckedChange={v => setTestFormData({...testFormData, remediation_required: v})} />
              <label className="text-xs font-medium text-slate-700">Remediation Required</label>
            </div>
            {testFormData.remediation_required && (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-700">Remediation Notes</label>
                  <Textarea value={testFormData.remediation_notes} onChange={e => setTestFormData({...testFormData, remediation_notes: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Remediation Target Date</label>
                  <Input type="date" value={testFormData.remediation_target_date} onChange={e => setTestFormData({...testFormData, remediation_target_date: e.target.value})} />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTestDialog(false)}>Cancel</Button>
              <Button type="submit">{editingTest ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evidence for {controls.find(c => c.id === (selectedTest?.control_library_id || selectedTest?.control_id))?.control_name || controls.find(c => c.id === (selectedTest?.control_library_id || selectedTest?.control_id))?.name || 'Control'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTest && selectedTest.status !== 'In Progress' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-900">Evidence Attachment Disabled</div>
                  <div className="text-amber-700">Evidence can only be added when test is In Progress.</div>
                </div>
              </div>
            )}

            {evidence.length > 0 && (
              <div className="space-y-2">
                {evidence.map(e => (
                  <EvidenceCard key={e.id} evidence={e} />
                ))}
              </div>
            )}

            {selectedTest && selectedTest.status === 'In Progress' && (
              <form onSubmit={handleEvidenceSubmit} className="space-y-3 pt-3 border-t">
              <div>
                <label className="text-xs font-medium text-slate-700">Evidence Type</label>
                <Select value={evidenceFormData.evidence_type} onValueChange={v => setEvidenceFormData({...evidenceFormData, evidence_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Text">Text</SelectItem>
                    <SelectItem value="File">File</SelectItem>
                    <SelectItem value="URL">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <Textarea value={evidenceFormData.text_description} onChange={e => setEvidenceFormData({...evidenceFormData, text_description: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Evidence Date</label>
                <Input type="date" value={evidenceFormData.evidence_date} onChange={e => setEvidenceFormData({...evidenceFormData, evidence_date: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Notes</label>
                <Textarea value={evidenceFormData.notes} onChange={e => setEvidenceFormData({...evidenceFormData, notes: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Add Evidence</Button>
              </form>
              )}
              </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}