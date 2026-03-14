import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import { Play, CheckCircle, FileText, Paperclip, AlertTriangle, Plus } from 'lucide-react';

export default function AuditProcedureExecution() {
  const urlParams = new URLSearchParams(window.location.search);
  const procedureId = urlParams.get('id');

  const [showWorkpaperDialog, setShowWorkpaperDialog] = useState(false);
  const [showFindingDialog, setShowFindingDialog] = useState(false);
  const [workpaperFormData, setWorkpaperFormData] = useState({
    notes: '',
    conclusion: 'satisfactory',
    attachment_url: ''
  });
  const [findingFormData, setFindingFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    recommendation: '',
    root_cause: ''
  });
  const [showSampleSetDialog, setShowSampleSetDialog] = useState(false);
  const [showSampleItemDialog, setShowSampleItemDialog] = useState(false);
  const [selectedSampleSet, setSelectedSampleSet] = useState(null);
  const [sampleSetFormData, setSampleSetFormData] = useState({
    population_description: '',
    sampling_method: 'random',
    population_size: '',
    sample_size: '',
    sampling_rationale: ''
  });
  const [sampleItemFormData, setSampleItemFormData] = useState({
    item_identifier: '',
    item_description: '',
    test_result: 'not_tested',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: procedure, isLoading } = useQuery({
    queryKey: ['procedure', procedureId],
    queryFn: () => base44.entities.AuditProcedure.filter({ id: procedureId }).then(r => r[0]),
    enabled: !!procedureId
  });

  const { data: phase } = useQuery({
    queryKey: ['phase', procedure?.audit_phase_id],
    queryFn: () => base44.entities.AuditPhase.filter({ id: procedure.audit_phase_id }).then(r => r[0]),
    enabled: !!procedure?.audit_phase_id
  });

  const { data: audit } = useQuery({
    queryKey: ['audit', phase?.audit_id],
    queryFn: () => base44.entities.Audit.filter({ id: phase.audit_id }).then(r => r[0]),
    enabled: !!phase?.audit_id
  });

  const { data: workpapers = [] } = useQuery({
    queryKey: ['workpapers', procedureId],
    queryFn: () => base44.entities.AuditWorkpaper.filter({ audit_procedure_id: procedureId }),
    enabled: !!procedureId
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings', audit?.id],
    queryFn: () => base44.entities.AuditFinding.filter({ 
      audit_id: audit.id,
      detected_during_procedure_id: procedureId 
    }),
    enabled: !!audit?.id
  });

  const { data: evidenceItems = [] } = useQuery({
    queryKey: ['evidenceItems'],
    queryFn: () => base44.entities.EvidenceItem.list('-created_date', 50)
  });

  const { data: sampleSets = [] } = useQuery({
    queryKey: ['sampleSets', procedureId],
    queryFn: () => base44.entities.SampleSet.filter({ audit_procedure_id: procedureId }),
    enabled: !!procedureId
  });

  const { data: sampleItems = [] } = useQuery({
    queryKey: ['sampleItems', selectedSampleSet?.id],
    queryFn: () => base44.entities.SampleItem.filter({ sample_set_id: selectedSampleSet.id }),
    enabled: !!selectedSampleSet?.id
  });

  const startProcedureMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.AuditProcedure.update(procedureId, {
        execution_status: 'running',
        status: 'running',
        start_time: new Date().toISOString(),
        assigned_to: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
    }
  });

  const completeProcedureMutation = useMutation({
    mutationFn: () => base44.entities.AuditProcedure.update(procedureId, {
      execution_status: 'complete',
      status: 'completed',
      completed_time: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
    }
  });

  const createWorkpaperMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.AuditWorkpaper.create({
        ...data,
        audit_procedure_id: procedureId,
        prepared_by: user.email,
        prepared_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workpapers', procedureId] });
      setShowWorkpaperDialog(false);
      setWorkpaperFormData({ notes: '', conclusion: 'satisfactory', attachment_url: '' });
    }
  });

  const createFindingMutation = useMutation({
    mutationFn: (data) => base44.entities.AuditFinding.create({
      ...data,
      audit_id: audit.id,
      detected_during_procedure_id: procedureId,
      status: 'open'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', audit?.id] });
      setShowFindingDialog(false);
      setFindingFormData({
        title: '',
        description: '',
        severity: 'medium',
        recommendation: '',
        root_cause: ''
      });
    }
  });

  async function handleWorkpaperSubmit(e) {
    e.preventDefault();
    createWorkpaperMutation.mutate(workpaperFormData);
  }

  async function handleFindingSubmit(e) {
    e.preventDefault();
    createFindingMutation.mutate(findingFormData);
  }

  const createSampleSetMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.SampleSet.create({
        ...data,
        audit_procedure_id: procedureId,
        preparer: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sampleSets', procedureId] });
      setShowSampleSetDialog(false);
      setSampleSetFormData({
        population_description: '',
        sampling_method: 'random',
        population_size: '',
        sample_size: '',
        sampling_rationale: ''
      });
    }
  });

  const createSampleItemMutation = useMutation({
    mutationFn: (data) => base44.entities.SampleItem.create({
      ...data,
      sample_set_id: selectedSampleSet.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sampleItems', selectedSampleSet?.id] });
      setShowSampleItemDialog(false);
      setSampleItemFormData({
        item_identifier: '',
        item_description: '',
        test_result: 'not_tested',
        notes: ''
      });
    }
  });

  async function handleSampleSetSubmit(e) {
    e.preventDefault();
    createSampleSetMutation.mutate(sampleSetFormData);
  }

  async function handleSampleItemSubmit(e) {
    e.preventDefault();
    createSampleItemMutation.mutate(sampleItemFormData);
  }

  if (isLoading || !procedure) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors = {
    'pending': 'bg-slate-100 text-slate-700',
    'running': 'bg-blue-100 text-blue-700',
    'complete': 'bg-green-100 text-green-700',
    'completed': 'bg-green-100 text-green-700'
  };

  const severityColors = {
    'low': 'bg-blue-100 text-blue-700',
    'medium': 'bg-amber-100 text-amber-700',
    'high': 'bg-red-100 text-red-700',
    'critical': 'bg-red-200 text-red-900'
  };

  const conclusionColors = {
    'satisfactory': 'bg-green-100 text-green-700',
    'issue_found': 'bg-red-100 text-red-700',
    'inconclusive': 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="space-y-6">
      <PageHeader title={procedure.name} subtitle={`${phase?.name} — ${audit?.name}`}>
        <div className="flex gap-2">
          {procedure.execution_status === 'pending' && (
            <Button onClick={() => startProcedureMutation.mutate()} size="sm">
              <Play className="w-4 h-4 mr-2" />
              Start Procedure
            </Button>
          )}
          {procedure.execution_status === 'running' && (
            <Button onClick={() => completeProcedureMutation.mutate()} size="sm" className="bg-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Procedure
            </Button>
          )}
          <Badge className={statusColors[procedure.execution_status]}>
            {procedure.execution_status}
          </Badge>
        </div>
      </PageHeader>

      {/* Procedure Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Procedure Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {procedure.description && (
            <p className="text-slate-600">{procedure.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {procedure.procedure_type && (
              <div>
                <span className="text-slate-500">Type:</span>{' '}
                <span className="font-medium text-slate-900 capitalize">{procedure.procedure_type.replace('_', ' ')}</span>
              </div>
            )}
            {procedure.assigned_to && (
              <div>
                <span className="text-slate-500">Assigned to:</span>{' '}
                <span className="font-medium text-slate-900">{procedure.assigned_to}</span>
              </div>
            )}
            {procedure.start_time && (
              <div>
                <span className="text-slate-500">Started:</span>{' '}
                <span className="font-medium text-slate-900">{new Date(procedure.start_time).toLocaleString()}</span>
              </div>
            )}
            {procedure.completed_time && (
              <div>
                <span className="text-slate-500">Completed:</span>{' '}
                <span className="font-medium text-slate-900">{new Date(procedure.completed_time).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sampling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Sampling ({sampleSets.length})</span>
            {procedure.execution_status === 'running' && (
              <Button onClick={() => setShowSampleSetDialog(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Sample Set
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sampleSets.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No sample sets created</p>
          ) : (
            <div className="space-y-3">
              {sampleSets.map(ss => (
                <div key={ss.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-900">{ss.population_description}</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {ss.sampling_method || ss.sample_method}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>Population: {ss.population_size || 'N/A'}</span>
                        <span>Sample: {ss.sample_size || 'N/A'}</span>
                      </div>
                      {(ss.sampling_rationale || ss.rationale) && (
                        <p className="text-xs text-slate-500 mt-1">{ss.sampling_rationale || ss.rationale}</p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setSelectedSampleSet(ss);
                        setShowSampleItemDialog(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {/* Sample Items for this set */}
                  {selectedSampleSet?.id === ss.id && sampleItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      {sampleItems.map(item => {
                        const linkedEvidence = evidenceItems.find(e => e.id === item.evidence_item_id);
                        const resultColors = {
                          'pass': 'bg-green-100 text-green-700',
                          'Pass': 'bg-green-100 text-green-700',
                          'fail': 'bg-red-100 text-red-700',
                          'Fail': 'bg-red-100 text-red-700',
                          'exception': 'bg-amber-100 text-amber-700',
                          'Exception': 'bg-amber-100 text-amber-700',
                          'not_tested': 'bg-slate-100 text-slate-600',
                          'Not Tested': 'bg-slate-100 text-slate-600'
                        };
                        
                        return (
                          <div key={item.id} className="bg-white border border-slate-200 rounded p-2 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-900">{item.item_identifier}</span>
                              <Badge className={resultColors[item.test_result]}>
                                {item.test_result}
                              </Badge>
                            </div>
                            {item.item_description && (
                              <p className="text-slate-600 mb-1">{item.item_description}</p>
                            )}
                            {linkedEvidence && (
                              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 rounded px-2 py-1">
                                <Paperclip className="w-3 h-3" />
                                <span>{linkedEvidence.title}</span>
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-slate-500 mt-1">{item.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workpapers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Workpapers ({workpapers.length})</span>
            {procedure.execution_status === 'running' && (
              <Button onClick={() => setShowWorkpaperDialog(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Workpaper
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workpapers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No workpapers yet</p>
          ) : (
            <div className="space-y-3">
              {workpapers.map(wp => {
                const linkedEvidence = evidenceItems.find(e => e.id === wp.evidence_item_id);
                
                return (
                  <div key={wp.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={conclusionColors[wp.conclusion]}>
                        {wp.conclusion?.replace('_', ' ')}
                      </Badge>
                      {wp.prepared_by && (
                        <span className="text-xs text-slate-500">
                          {wp.prepared_by} • {new Date(wp.prepared_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {wp.notes && (
                      <p className="text-sm text-slate-700 mb-2">{wp.notes}</p>
                    )}
                    {linkedEvidence && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
                        <Paperclip className="w-3 h-3" />
                        <span>Linked Evidence: {linkedEvidence.title}</span>
                      </div>
                    )}
                    {wp.attachment_url && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <FileText className="w-3 h-3" />
                        <a href={wp.attachment_url} target="_blank" rel="noopener noreferrer" className="underline">
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Findings ({findings.length})</span>
            {procedure.execution_status === 'running' && (
              <Button onClick={() => setShowFindingDialog(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Record Finding
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No findings recorded</p>
          ) : (
            <div className="space-y-3">
              {findings.map(finding => (
                <div key={finding.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-900">{finding.title}</h4>
                      <Badge className={severityColors[finding.severity]}>
                        {finding.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {finding.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {finding.description && (
                    <p className="text-xs text-slate-600 mb-2">{finding.description}</p>
                  )}
                  {finding.root_cause && (
                    <div className="text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                      <span className="font-medium">Root Cause:</span> {finding.root_cause}
                    </div>
                  )}
                  {finding.recommendation && (
                    <div className="text-xs text-slate-700 bg-blue-50 border border-blue-200 rounded p-2">
                      <span className="font-medium">Recommendation:</span> {finding.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workpaper Dialog */}
      <Dialog open={showWorkpaperDialog} onOpenChange={setShowWorkpaperDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Workpaper</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWorkpaperSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Notes *</label>
              <Textarea
                value={workpaperFormData.notes}
                onChange={e => setWorkpaperFormData({...workpaperFormData, notes: e.target.value})}
                rows={4}
                required
                placeholder="Document your audit work..."
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Conclusion</label>
              <Select
                value={workpaperFormData.conclusion}
                onValueChange={v => setWorkpaperFormData({...workpaperFormData, conclusion: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="issue_found">Issue Found</SelectItem>
                  <SelectItem value="inconclusive">Inconclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Attachment URL</label>
              <Input
                value={workpaperFormData.attachment_url}
                onChange={e => setWorkpaperFormData({...workpaperFormData, attachment_url: e.target.value})}
                placeholder="Optional file or document URL"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowWorkpaperDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Workpaper</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sample Set Dialog */}
      <Dialog open={showSampleSetDialog} onOpenChange={setShowSampleSetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Sample Set</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSampleSetSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Population Description *</label>
              <Textarea
                value={sampleSetFormData.population_description}
                onChange={e => setSampleSetFormData({...sampleSetFormData, population_description: e.target.value})}
                rows={2}
                required
                placeholder="Describe the population being sampled"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Sampling Method</label>
              <Select
                value={sampleSetFormData.sampling_method}
                onValueChange={v => setSampleSetFormData({...sampleSetFormData, sampling_method: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="judgmental">Judgmental</SelectItem>
                  <SelectItem value="stratified">Stratified</SelectItem>
                  <SelectItem value="full_population">Full Population</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Population Size</label>
                <Input
                  type="number"
                  value={sampleSetFormData.population_size}
                  onChange={e => setSampleSetFormData({...sampleSetFormData, population_size: e.target.value})}
                  placeholder="Total population size"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-700">Sample Size</label>
                <Input
                  type="number"
                  value={sampleSetFormData.sample_size}
                  onChange={e => setSampleSetFormData({...sampleSetFormData, sample_size: e.target.value})}
                  placeholder="Number of items to sample"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Sampling Rationale</label>
              <Textarea
                value={sampleSetFormData.sampling_rationale}
                onChange={e => setSampleSetFormData({...sampleSetFormData, sampling_rationale: e.target.value})}
                rows={2}
                placeholder="Why this sampling approach?"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSampleSetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Sample Set</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sample Item Dialog */}
      <Dialog open={showSampleItemDialog} onOpenChange={setShowSampleItemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Sample Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSampleItemSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Item Identifier *</label>
              <Input
                value={sampleItemFormData.item_identifier}
                onChange={e => setSampleItemFormData({...sampleItemFormData, item_identifier: e.target.value})}
                required
                placeholder="Unique identifier (e.g., transaction ID, case number)"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea
                value={sampleItemFormData.item_description}
                onChange={e => setSampleItemFormData({...sampleItemFormData, item_description: e.target.value})}
                rows={2}
                placeholder="Description of this sample item"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Test Result</label>
              <Select
                value={sampleItemFormData.test_result}
                onValueChange={v => setSampleItemFormData({...sampleItemFormData, test_result: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="exception">Exception</SelectItem>
                  <SelectItem value="not_tested">Not Tested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Notes</label>
              <Textarea
                value={sampleItemFormData.notes}
                onChange={e => setSampleItemFormData({...sampleItemFormData, notes: e.target.value})}
                rows={2}
                placeholder="Additional notes"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSampleItemDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Sample Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Finding Dialog */}
      <Dialog open={showFindingDialog} onOpenChange={setShowFindingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Finding</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFindingSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Title *</label>
              <Input
                value={findingFormData.title}
                onChange={e => setFindingFormData({...findingFormData, title: e.target.value})}
                required
                placeholder="Brief finding title"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Description *</label>
              <Textarea
                value={findingFormData.description}
                onChange={e => setFindingFormData({...findingFormData, description: e.target.value})}
                rows={3}
                required
                placeholder="Detailed finding description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Severity</label>
                <Select
                  value={findingFormData.severity}
                  onValueChange={v => setFindingFormData({...findingFormData, severity: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Root Cause</label>
              <Textarea
                value={findingFormData.root_cause}
                onChange={e => setFindingFormData({...findingFormData, root_cause: e.target.value})}
                rows={2}
                placeholder="Root cause analysis"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Recommendation</label>
              <Textarea
                value={findingFormData.recommendation}
                onChange={e => setFindingFormData({...findingFormData, recommendation: e.target.value})}
                rows={2}
                placeholder="Recommended corrective action"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowFindingDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Finding</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}