import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import { FileText, Download, CheckCircle, Package } from 'lucide-react';

export default function AuditReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const auditId = urlParams.get('id');

  const queryClient = useQueryClient();
  const [showDefensePackageDialog, setShowDefensePackageDialog] = useState(false);
  const [defensePackageData, setDefensePackageData] = useState(null);

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
    queryFn: () => base44.entities.AuditFinding.filter({ 
      audit_id: auditId,
      included_in_report: true 
    }),
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

  const { data: defensePackages = [] } = useQuery({
    queryKey: ['defensePackages', auditId],
    queryFn: () => base44.entities.DefensePackage.filter({ audit_id: auditId }),
    enabled: !!auditId
  });

  const { data: observations = [] } = useQuery({
    queryKey: ['observations'],
    queryFn: () => base44.entities.Observation.list('-created_date', 100)
  });

  const finalizeReportMutation = useMutation({
    mutationFn: () => base44.entities.Audit.update(auditId, {
      report_status: 'finalized',
      status: 'completed'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    }
  });

  const generateDefensePackageMutation = useMutation({
    mutationFn: async () => {
      return base44.functions.invoke('generateDefensePackage', { audit_id: auditId });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['defensePackages', auditId] });
      setDefensePackageData(response.data);
      setShowDefensePackageDialog(true);
    }
  });

  if (isLoading || !audit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const reportStatusColors = {
    'draft': 'bg-slate-100 text-slate-700',
    'review': 'bg-amber-100 text-amber-700',
    'finalized': 'bg-green-100 text-green-700'
  };

  const severityColors = {
    'low': 'bg-blue-100 text-blue-700',
    'medium': 'bg-amber-100 text-amber-700',
    'high': 'bg-red-100 text-red-700',
    'critical': 'bg-red-200 text-red-900'
  };

  const ratingColors = {
    'satisfactory': 'bg-green-100 text-green-700',
    'needs_improvement': 'bg-amber-100 text-amber-700',
    'unsatisfactory': 'bg-red-100 text-red-700'
  };

  const criticalFindings = findings.filter(f => f.severity === 'critical');
  const highFindings = findings.filter(f => f.severity === 'high');
  const mediumFindings = findings.filter(f => f.severity === 'medium');
  const lowFindings = findings.filter(f => f.severity === 'low');

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Report" subtitle={audit.name}>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => generateDefensePackageMutation.mutate()}
            disabled={generateDefensePackageMutation.isPending}
          >
            <Package className="w-4 h-4 mr-2" />
            {generateDefensePackageMutation.isPending ? 'Generating...' : 'Generate Defense Package'}
          </Button>
          <Badge className={reportStatusColors[audit.report_status]}>{audit.report_status}</Badge>
          {audit.report_status === 'review' && (
            <Button onClick={() => finalizeReportMutation.mutate()} size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalize Report
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Report Header */}
      <Card className="border-2 border-slate-300">
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {audit.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Engagement:</span>{' '}
              <span className="font-medium text-slate-900">{engagement?.engagement_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500">Audit Type:</span>{' '}
              <span className="font-medium text-slate-900 capitalize">{audit.audit_type || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500">Lead Auditor:</span>{' '}
              <span className="font-medium text-slate-900">{audit.lead_auditor || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500">Audit Period:</span>{' '}
              <span className="font-medium text-slate-900">
                {audit.start_date && audit.end_date 
                  ? `${new Date(audit.start_date).toLocaleDateString()} - ${new Date(audit.end_date).toLocaleDateString()}`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Report Generated:</span>{' '}
              <span className="font-medium text-slate-900">
                {audit.report_generated_at 
                  ? new Date(audit.report_generated_at).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Generated By:</span>{' '}
              <span className="font-medium text-slate-900">{audit.report_generated_by || 'N/A'}</span>
            </div>
          </div>
          
          {audit.overall_rating && (
            <div className="pt-3 border-t">
              <span className="text-slate-500 text-sm">Overall Rating:</span>{' '}
              <Badge className={ratingColors[audit.overall_rating]}>
                {audit.overall_rating.replace('_', ' ')}
              </Badge>
            </div>
          )}
          
          {audit.final_summary && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-slate-900 mb-2">Executive Summary:</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{audit.final_summary}</p>
            </div>
          )}

          {defensePackages.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-slate-700 mb-2">Defense Packages:</p>
              <div className="space-y-2">
                {defensePackages.map(pkg => (
                  <div key={pkg.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3" />
                          <span className="font-medium">Generated {new Date(pkg.generated_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-500 mt-1">By: {pkg.generated_by}</p>
                      </div>
                      <Badge variant="outline">{pkg.package_status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{findings.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total Findings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{criticalFindings.length}</p>
              <p className="text-xs text-slate-500 mt-1">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{highFindings.length}</p>
              <p className="text-xs text-slate-500 mt-1">High</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{mediumFindings.length + lowFindings.length}</p>
              <p className="text-xs text-slate-500 mt-1">Medium + Low</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Findings Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Findings</CardTitle>
        </CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No findings included in report</p>
          ) : (
            <div className="space-y-4">
              {findings.map((finding, idx) => {
                const control = controls.find(c => c.id === finding.related_control_id);
                const risk = risks.find(r => r.id === finding.related_risk_id);
                const observation = observations.find(o => o.id === finding.observation_id);
                
                return (
                  <div key={finding.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">#{idx + 1}</span>
                        <h4 className="text-sm font-semibold text-slate-900">{finding.title}</h4>
                        <Badge className={severityColors[finding.severity]}>{finding.severity}</Badge>
                      </div>
                    </div>
                    
                    {finding.description && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-700 mb-1">Description:</p>
                        <p className="text-xs text-slate-600">{finding.description}</p>
                      </div>
                    )}
                    
                    {(control || risk) && (
                      <div className="flex gap-4 text-xs text-slate-600 mb-3">
                        {control && (
                          <div>
                            <span className="font-medium">Related Control:</span> {control.control_name}
                          </div>
                        )}
                        {risk && (
                          <div>
                            <span className="font-medium">Related Risk:</span> {risk.risk_name}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {finding.root_cause && (
                      <div className="mb-3 bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="text-xs font-medium text-amber-900 mb-1">Root Cause:</p>
                        <p className="text-xs text-amber-700">{finding.root_cause}</p>
                      </div>
                    )}
                    
                    {finding.recommendation && (
                      <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs font-medium text-blue-900 mb-1">Recommendation:</p>
                        <p className="text-xs text-blue-700">{finding.recommendation}</p>
                      </div>
                    )}
                    
                    {finding.management_response && (
                      <div className="mb-3 bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-xs font-medium text-green-900 mb-1">Management Response:</p>
                        <p className="text-xs text-green-700">{finding.management_response}</p>
                      </div>
                    )}
                    
                    {finding.target_remediation_date && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-medium">Target Remediation:</span>
                        <span>{new Date(finding.target_remediation_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defense Package Dialog */}
      <Dialog open={showDefensePackageDialog} onOpenChange={setShowDefensePackageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Defense Package Generated</DialogTitle>
          </DialogHeader>
          {defensePackageData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-1">Package Successfully Generated</p>
                <p className="text-xs text-green-700">
                  Defense package ID: {defensePackageData.defense_package_id}
                </p>
                <p className="text-xs text-green-700">
                  Generated at: {new Date(defensePackageData.artifact_bundle.generated_at).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Procedures</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {defensePackageData.artifact_bundle.audit_procedures.length}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Evidence Items</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {defensePackageData.artifact_bundle.evidence_references.length}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Findings</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {defensePackageData.artifact_bundle.findings.length}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">Bundle Contents:</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Audit Metadata</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Audit Scope ({defensePackageData.artifact_bundle.audit_phases.length} phases)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Audit Procedures ({defensePackageData.artifact_bundle.audit_procedures.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Sampling Sets ({defensePackageData.artifact_bundle.sampling_sets.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Sample Items ({defensePackageData.artifact_bundle.sample_items.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Evidence References ({defensePackageData.artifact_bundle.evidence_references.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Findings ({defensePackageData.artifact_bundle.findings.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Remediation Actions ({defensePackageData.artifact_bundle.remediation_actions.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">✓ Remediation Verification Status</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(defensePackageData.artifact_bundle, null, 2)], 
                      { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `defense-package-${auditId}-${Date.now()}.json`;
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                <Button onClick={() => setShowDefensePackageDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}