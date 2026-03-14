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
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/ui/PageHeader';
import { FileText, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AuditReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const auditId = urlParams.get('id');

  const [showFindingDialog, setShowFindingDialog] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [findingFormData, setFindingFormData] = useState({
    management_response: '',
    target_remediation_date: ''
  });

  const queryClient = useQueryClient();

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => base44.entities.Audit.filter({ id: auditId }).then(r => r[0]),
    enabled: !!auditId
  });

  const { data: engagement } = useQuery({
    queryKey: ['engagement', audit?.engagement_id],
    queryFn: () => base44.entities.Engagement.filter({ id: audit.engagement_id }).then(r => r[0]),
    enabled: !!audit?.engagement_id
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings', auditId],
    queryFn: () => base44.entities.AuditFinding.filter({ audit_id: auditId }),
    enabled: !!auditId
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.ControlLibrary.list('-created_date', 100)
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.RiskLibrary.list('-created_date', 100)
  });

  const updateAuditMutation = useMutation({
    mutationFn: async (data) => {
      // Lock evidence when entering review phase (NW-UPGRADE-064)
      if (data.status === 'review' && audit.status !== 'review') {
        const allEvidence = await base44.entities.EvidenceItem.filter({ engagement_id: engagement?.id });
        await Promise.all(
          allEvidence.map(ev => 
            base44.entities.EvidenceItem.update(ev.id, { locked_for_audit: true })
          )
        );
      }
      return base44.entities.Audit.update(auditId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    }
  });

  const updateFindingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AuditFinding.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', auditId] });
      setShowFindingDialog(false);
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Audit.update(auditId, {
        report_status: 'review',
        report_generated_at: new Date().toISOString(),
        report_generated_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      window.location.href = createPageUrl(`AuditReport?id=${auditId}`);
    }
  });

  function openFindingDialog(finding) {
    setSelectedFinding(finding);
    setFindingFormData({
      management_response: finding.management_response || '',
      target_remediation_date: finding.target_remediation_date || ''
    });
    setShowFindingDialog(true);
  }

  async function handleFindingSubmit(e) {
    e.preventDefault();
    updateFindingMutation.mutate({
      id: selectedFinding.id,
      data: findingFormData
    });
  }

  async function toggleIncludedInReport(finding) {
    updateFindingMutation.mutate({
      id: finding.id,
      data: { included_in_report: !finding.included_in_report }
    });
  }

  if (isLoading || !audit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const severityColors = {
    'low': 'bg-blue-100 text-blue-700',
    'medium': 'bg-amber-100 text-amber-700',
    'high': 'bg-red-100 text-red-700',
    'critical': 'bg-red-200 text-red-900'
  };

  const statusColors = {
    'planned': 'bg-slate-100 text-slate-700',
    'active': 'bg-blue-100 text-blue-700',
    'fieldwork': 'bg-purple-100 text-purple-700',
    'review': 'bg-amber-100 text-amber-700',
    'completed': 'bg-green-100 text-green-700'
  };

  const reportStatusColors = {
    'draft': 'bg-slate-100 text-slate-700',
    'review': 'bg-amber-100 text-amber-700',
    'finalized': 'bg-green-100 text-green-700'
  };

  const reportableFindings = findings.filter(f => f.included_in_report);
  const excludedFindings = findings.filter(f => !f.included_in_report);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Review" subtitle={audit.name}>
        <div className="flex gap-2">
          <Badge className={statusColors[audit.status]}>{audit.status}</Badge>
          <Badge className={reportStatusColors[audit.report_status]}>{audit.report_status}</Badge>
          {audit.report_status !== 'finalized' && (
            <Button onClick={() => generateReportMutation.mutate()} size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          )}
          {audit.report_status !== 'draft' && (
            <Button onClick={() => window.location.href = createPageUrl(`AuditReport?id=${auditId}`)} size="sm" variant="outline">
              View Report
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Audit Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500">Engagement:</span>{' '}
              <span className="font-medium text-slate-900">{engagement?.engagement_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500">Type:</span>{' '}
              <span className="font-medium text-slate-900 capitalize">{audit.audit_type || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500">Lead Auditor:</span>{' '}
              <span className="font-medium text-slate-900">{audit.lead_auditor || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500">Period:</span>{' '}
              <span className="font-medium text-slate-900">
                {audit.start_date && audit.end_date 
                  ? `${new Date(audit.start_date).toLocaleDateString()} - ${new Date(audit.end_date).toLocaleDateString()}`
                  : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Overall Rating</label>
              <Select 
                value={audit.overall_rating || ''} 
                onValueChange={v => updateAuditMutation.mutate({ overall_rating: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select rating..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                  <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-700">Final Summary</label>
            <Textarea
              value={audit.final_summary || ''}
              onChange={e => updateAuditMutation.mutate({ final_summary: e.target.value })}
              rows={4}
              placeholder="Executive summary of audit findings and conclusions..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Findings to Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reportable Findings ({reportableFindings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reportableFindings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No findings marked for reporting</p>
          ) : (
            <div className="space-y-3">
              {reportableFindings.map(finding => {
                const control = controls.find(c => c.id === finding.related_control_id);
                const risk = risks.find(r => r.id === finding.related_risk_id);
                
                return (
                  <div key={finding.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <Checkbox
                          checked={finding.included_in_report}
                          onCheckedChange={() => toggleIncludedInReport(finding)}
                        />
                        <h4 className="text-sm font-semibold text-slate-900">{finding.title}</h4>
                        <Badge className={severityColors[finding.severity]}>{finding.severity}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {finding.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openFindingDialog(finding)}>
                        Edit
                      </Button>
                    </div>
                    
                    {finding.description && (
                      <p className="text-xs text-slate-600 mb-2 ml-6">{finding.description}</p>
                    )}
                    
                    {(control || risk) && (
                      <div className="flex gap-2 text-xs text-slate-500 ml-6 mb-2">
                        {control && <span>Control: {control.control_name}</span>}
                        {risk && <span>Risk: {risk.risk_name}</span>}
                      </div>
                    )}
                    
                    {finding.recommendation && (
                      <div className="text-xs text-slate-700 bg-blue-50 border border-blue-200 rounded p-2 ml-6 mb-2">
                        <span className="font-medium">Recommendation:</span> {finding.recommendation}
                      </div>
                    )}
                    
                    {finding.management_response && (
                      <div className="text-xs text-slate-700 bg-green-50 border border-green-200 rounded p-2 ml-6 mb-2">
                        <span className="font-medium">Management Response:</span> {finding.management_response}
                      </div>
                    )}
                    
                    {finding.target_remediation_date && (
                      <div className="flex items-center gap-1 text-xs text-amber-700 ml-6">
                        <Calendar className="w-3 h-3" />
                        <span>Target: {new Date(finding.target_remediation_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excluded Findings */}
      {excludedFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Excluded from Report ({excludedFindings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {excludedFindings.map(finding => (
                <div key={finding.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded p-2">
                  <Checkbox
                    checked={finding.included_in_report}
                    onCheckedChange={() => toggleIncludedInReport(finding)}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-slate-900">{finding.title}</span>
                    <Badge className={severityColors[finding.severity]} variant="outline">
                      {finding.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finding Dialog */}
      <Dialog open={showFindingDialog} onOpenChange={setShowFindingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Finding</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFindingSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Management Response</label>
              <Textarea
                value={findingFormData.management_response}
                onChange={e => setFindingFormData({...findingFormData, management_response: e.target.value})}
                rows={4}
                placeholder="Management's response to this finding..."
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Target Remediation Date</label>
              <Input
                type="date"
                value={findingFormData.target_remediation_date}
                onChange={e => setFindingFormData({...findingFormData, target_remediation_date: e.target.value})}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowFindingDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Finding</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}