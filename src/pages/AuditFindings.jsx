import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { AlertTriangle, Repeat, Link2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function AuditFindings() {
  const urlParams = new URLSearchParams(window.location.search);
  const auditId = urlParams.get('id');

  const [showFindingDialog, setShowFindingDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [selectedRemediation, setSelectedRemediation] = useState(null);
  const [verificationFormData, setVerificationFormData] = useState({
    verification_status: 'verified',
    verification_notes: ''
  });

  const queryClient = useQueryClient();

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => base44.entities.Audit.filter({ id: auditId }).then(r => r[0]),
    enabled: !!auditId
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

  const { data: remediations = [] } = useQuery({
    queryKey: ['remediations'],
    queryFn: () => base44.entities.RemediationAction.list('-created_date', 100)
  });

  const updateFindingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AuditFinding.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', auditId] });
    }
  });

  const verifyRemediationMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.RemediationAction.update(selectedRemediation.id, {
        ...data,
        verified_by: user.email,
        verified_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] });
      setShowVerificationDialog(false);
      setVerificationFormData({
        verification_status: 'verified',
        verification_notes: ''
      });
    }
  });

  async function transitionLifecycle(finding, newStatus) {
    // Validate transitions (NW-UPGRADE-065)
    const validTransitions = {
      'draft': ['confirmed'],
      'confirmed': ['reported'],
      'reported': ['remediated'],
      'remediated': ['closed']
    };

    const allowed = validTransitions[finding.lifecycle_status];
    if (!allowed || !allowed.includes(newStatus)) {
      alert(`Invalid transition: ${finding.lifecycle_status} → ${newStatus}`);
      return;
    }

    // Enforce verification before close
    if (newStatus === 'closed' && finding.remediation_action_id) {
      const remediation = remediations.find(r => r.id === finding.remediation_action_id);
      if (remediation?.verification_status !== 'verified') {
        alert('Cannot close finding: remediation must be verified first');
        return;
      }
    }

    updateFindingMutation.mutate({
      id: finding.id,
      data: { lifecycle_status: newStatus }
    });
  }

  function openVerificationDialog(finding) {
    const remediation = remediations.find(r => r.id === finding.remediation_action_id);
    if (!remediation) {
      alert('No remediation action linked to this finding');
      return;
    }
    setSelectedFinding(finding);
    setSelectedRemediation(remediation);
    setVerificationFormData({
      verification_status: 'verified',
      verification_notes: remediation.verification_notes || ''
    });
    setShowVerificationDialog(true);
  }

  async function handleVerificationSubmit(e) {
    e.preventDefault();
    verifyRemediationMutation.mutate(verificationFormData);
  }

  if (isLoading || !audit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const lifecycleColors = {
    'draft': 'bg-slate-100 text-slate-700',
    'confirmed': 'bg-blue-100 text-blue-700',
    'reported': 'bg-purple-100 text-purple-700',
    'remediated': 'bg-green-100 text-green-700',
    'closed': 'bg-slate-200 text-slate-900'
  };

  const severityColors = {
    'low': 'bg-blue-100 text-blue-700',
    'medium': 'bg-amber-100 text-amber-700',
    'high': 'bg-red-100 text-red-700',
    'critical': 'bg-red-200 text-red-900'
  };

  const rootCauseColors = {
    'policy_gap': 'bg-purple-100 text-purple-700',
    'control_failure': 'bg-red-100 text-red-700',
    'human_error': 'bg-amber-100 text-amber-700',
    'system_design': 'bg-blue-100 text-blue-700',
    'unknown': 'bg-slate-100 text-slate-700'
  };

  const verificationColors = {
    'pending': 'bg-slate-100 text-slate-700',
    'verified': 'bg-green-100 text-green-700',
    'failed': 'bg-red-100 text-red-700'
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Findings" subtitle={audit.name}>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`AuditDetail?id=${auditId}`)}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Audit
            </Button>
          </Link>
          <Badge variant="outline">{findings.length} Finding{findings.length !== 1 ? 's' : ''}</Badge>
          <Badge variant="outline">{findings.filter(f => f.repeat_finding).length} Repeat</Badge>
        </div>
      </PageHeader>

      {findings.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No findings documented yet"
          description="Findings will appear here as issues are identified during audit procedures"
        />
      ) : (
        <div className="space-y-4">
          {findings.map(finding => {
            const control = controls.find(c => c.id === finding.related_control_id);
            const risk = risks.find(r => r.id === finding.related_risk_id);
            const remediation = remediations.find(r => r.id === finding.remediation_action_id);
            const previousFinding = findings.find(f => f.id === finding.previous_finding_id);
            
            return (
              <Card key={finding.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-900">{finding.title}</h3>
                        <Badge className={severityColors[finding.severity]}>{finding.severity}</Badge>
                        {finding.lifecycle_status && (
                          <Badge className={lifecycleColors[finding.lifecycle_status]}>
                            {finding.lifecycle_status}
                          </Badge>
                        )}
                        {finding.repeat_finding && (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Repeat className="w-3 h-3 mr-1" />
                            Repeat Finding
                          </Badge>
                        )}
                        {finding.root_cause && (
                          <Badge className={rootCauseColors[finding.root_cause]} variant="outline">
                            {finding.root_cause.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      {(control || risk) && (
                        <div className="flex gap-3 text-xs text-slate-500 mb-2">
                          {control && <span>Control: {control.control_name}</span>}
                          {risk && <span>Risk: {risk.risk_name}</span>}
                        </div>
                      )}
                    </div>
                    
                    {finding.lifecycle_status && finding.lifecycle_status !== 'closed' && (
                      <Select
                        value={finding.lifecycle_status}
                        onValueChange={v => transitionLifecycle(finding, v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {finding.lifecycle_status === 'draft' && <SelectItem value="confirmed">Confirm</SelectItem>}
                          {finding.lifecycle_status === 'confirmed' && <SelectItem value="reported">Report</SelectItem>}
                          {finding.lifecycle_status === 'reported' && <SelectItem value="remediated">Mark Remediated</SelectItem>}
                          {finding.lifecycle_status === 'remediated' && <SelectItem value="closed">Close</SelectItem>}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {finding.description && (
                    <p className="text-sm text-slate-700">{finding.description}</p>
                  )}
                  
                  {previousFinding && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-amber-900 mb-1">
                        <Link2 className="w-3 h-3" />
                        <span>Linked to Previous Finding:</span>
                      </div>
                      <p className="text-xs text-amber-700">{previousFinding.title}</p>
                      <p className="text-xs text-amber-600 mt-1">
                        From: {new Date(previousFinding.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {finding.recommendation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-900 mb-1">Recommendation:</p>
                      <p className="text-xs text-blue-700">{finding.recommendation}</p>
                    </div>
                  )}
                  
                  {finding.management_response && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-900 mb-1">Management Response:</p>
                      <p className="text-xs text-green-700">{finding.management_response}</p>
                    </div>
                  )}
                  
                  {remediation && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-900">Remediation Action:</p>
                          <Badge className={verificationColors[remediation.verification_status]}>
                            {remediation.verification_status}
                          </Badge>
                        </div>
                        {remediation.verification_status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => openVerificationDialog(finding)}>
                            Verify
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mb-1">{remediation.action_title}</p>
                      <div className="text-xs text-slate-500">
                        Owner: {remediation.owner} • Target: {remediation.target_date ? new Date(remediation.target_date).toLocaleDateString() : 'N/A'}
                      </div>
                      {remediation.verified_by && (
                        <div className="text-xs text-green-700 mt-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified by {remediation.verified_by} on {new Date(remediation.verified_at).toLocaleDateString()}</span>
                          </div>
                          {remediation.verification_notes && (
                            <p className="mt-1 text-green-600">{remediation.verification_notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {finding.target_remediation_date && (
                    <div className="text-xs text-slate-500">
                      Target Remediation: {new Date(finding.target_remediation_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verify Remediation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            {selectedRemediation && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-slate-900 mb-1">{selectedRemediation.action_title}</p>
                <p className="text-xs text-slate-600">{selectedRemediation.action_description}</p>
              </div>
            )}
            
            <div>
              <label className="text-xs font-medium text-slate-700">Verification Status</label>
              <Select
                value={verificationFormData.verification_status}
                onValueChange={v => setVerificationFormData({...verificationFormData, verification_status: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Verification Notes</label>
              <Textarea
                value={verificationFormData.verification_notes}
                onChange={e => setVerificationFormData({...verificationFormData, verification_notes: e.target.value})}
                rows={4}
                placeholder="Document verification results..."
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowVerificationDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Verification</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}