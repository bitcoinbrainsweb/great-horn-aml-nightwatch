import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import { FileText, Download, CheckCircle } from 'lucide-react';

export default function AuditReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const auditId = urlParams.get('id');

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
    </div>
  );
}