import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { FileText, Calendar, User, CheckCircle, Clock, AlertTriangle, Package, ArrowLeft, List, Plus } from 'lucide-react';
import AuditJumpLinks from '@/components/audit/AuditJumpLinks';
import WorkflowProgress from '@/components/audit/WorkflowProgress';
import DefenseReadiness from '@/components/audit/DefenseReadiness';

export default function AuditDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const auditId = urlParams.get('id');

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => base44.entities.Audit.filter({ id: auditId }).then(r => r[0]),
    enabled: !!auditId
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['auditPhases', auditId],
    queryFn: () => base44.entities.AuditPhase.filter({ audit_id: auditId }, 'phase_order'),
    enabled: !!auditId
  });

  const { data: engagement } = useQuery({
    queryKey: ['engagement', audit?.engagement_id],
    queryFn: () => base44.entities.Engagement.filter({ id: audit.engagement_id }).then(r => r[0]),
    enabled: !!audit?.engagement_id
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ['procedures', auditId],
    queryFn: async () => {
      const allProcs = [];
      for (const phase of phases) {
        const procs = await base44.entities.AuditProcedure.filter({ audit_phase_id: phase.id });
        allProcs.push(...procs);
      }
      return allProcs;
    },
    enabled: phases.length > 0
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings', auditId],
    queryFn: () => base44.entities.AuditFinding.filter({ audit_id: auditId }),
    enabled: !!auditId
  });

  const { data: sampleSets = [] } = useQuery({
    queryKey: ['sampleSets', auditId],
    queryFn: async () => {
      const allSets = [];
      for (const proc of procedures) {
        const sets = await base44.entities.SampleSet.filter({ audit_procedure_id: proc.id });
        allSets.push(...sets);
      }
      return allSets;
    },
    enabled: procedures.length > 0
  });

  const { data: evidenceItems = [] } = useQuery({
    queryKey: ['evidenceItems', audit?.engagement_id],
    queryFn: () => base44.entities.EvidenceItem.filter({ engagement_id: audit.engagement_id }),
    enabled: !!audit?.engagement_id
  });

  const { data: defensePackages = [] } = useQuery({
    queryKey: ['defensePackages', auditId],
    queryFn: () => base44.entities.DefensePackage.filter({ audit_id: auditId }),
    enabled: !!auditId
  });

  if (isLoading || !audit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors = {
    'planned': 'bg-slate-100 text-slate-700',
    'active': 'bg-blue-100 text-blue-700',
    'fieldwork': 'bg-purple-100 text-purple-700',
    'review': 'bg-amber-100 text-amber-700',
    'completed': 'bg-green-100 text-green-700'
  };

  const phaseStatusColors = {
    'pending': 'bg-slate-100 text-slate-600',
    'active': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700'
  };

  const completedProcedures = procedures.filter(p => p.execution_status === 'complete').length;
  const totalProcedures = procedures.length;
  const criticalFindings = findings.filter(f => f.severity === 'critical').length;
  const highFindings = findings.filter(f => f.severity === 'high').length;

  const reviewedEvidence = evidenceItems.filter(e => e.review_status === 'reviewed').length;
  const verifiedRemediations = findings.filter(f => f.remediation_action_id).length;
  const defensePackageGenerated = defensePackages.length > 0;

  const workflowStages = [
    { id: 'planning', label: 'Planning', completed: audit.status !== 'planned' },
    { id: 'procedures', label: 'Procedures', completed: completedProcedures > 0 },
    { id: 'sampling', label: 'Sampling', completed: sampleSets.length > 0 },
    { id: 'evidence', label: 'Evidence', completed: reviewedEvidence > 0 },
    { id: 'findings', label: 'Findings', completed: findings.length > 0 },
    { id: 'report', label: 'Report', completed: audit.report_status === 'finalized' }
  ];

  const defenseReadinessChecks = [
    { label: 'Evidence Reviewed', completed: reviewedEvidence > 0, count: `${reviewedEvidence}/${evidenceItems.length}` },
    { label: 'Findings Documented', completed: findings.length > 0, count: findings.length },
    { label: 'Remediation Planned', completed: verifiedRemediations > 0, count: verifiedRemediations },
    { label: 'Defense Package Generated', completed: defensePackageGenerated, count: defensePackages.length }
  ];

  const jumpLinks = [
    { id: 'phases', label: 'Phases', count: phases.length },
    { id: 'procedures', label: 'Procedures', count: totalProcedures },
    { id: 'samples', label: 'Samples', count: sampleSets.length },
    { id: 'evidence', label: 'Evidence', count: evidenceItems.length },
    { id: 'findings', label: 'Findings', count: findings.length },
    { id: 'defense', label: 'Defense Package', count: defensePackages.length }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={audit.name} subtitle="Audit Dashboard">
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('AdminAudits')}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Audits
            </Button>
          </Link>
          <Badge className={statusColors[audit.status]}>{audit.status}</Badge>
        </div>
      </PageHeader>

      {/* Jump Links */}
      <AuditJumpLinks links={jumpLinks} />

      {/* Workflow Progress */}
      <WorkflowProgress currentStage={audit.status} stages={workflowStages} />

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        <Link to={createPageUrl(`AuditProcedureExecution?audit_id=${auditId}`)}>
          <Button variant="outline" className="w-full justify-start">
            <List className="w-4 h-4 mr-2" />
            Procedures
          </Button>
        </Link>
        <Link to={createPageUrl(`AuditFindings?id=${auditId}`)}>
          <Button variant="outline" className="w-full justify-start">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Findings
          </Button>
        </Link>
        <Link to={createPageUrl(`AuditReview?id=${auditId}`)}>
          <Button variant="outline" className="w-full justify-start">
            <CheckCircle className="w-4 h-4 mr-2" />
            Review
          </Button>
        </Link>
        <Link to={createPageUrl(`AuditReport?id=${auditId}`)}>
          <Button variant="outline" className="w-full justify-start">
            <Package className="w-4 h-4 mr-2" />
            Report
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{phases.length}</p>
                <p className="text-xs text-slate-500 mt-1">Phases</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{completedProcedures}/{totalProcedures}</p>
                <p className="text-xs text-slate-500 mt-1">Procedures</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{sampleSets.length}</p>
                <p className="text-xs text-slate-500 mt-1">Sample Sets</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-teal-600">{evidenceItems.length}</p>
                <p className="text-xs text-slate-500 mt-1">Evidence</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DefenseReadiness checks={defenseReadinessChecks} />
      </div>

      {/* Audit Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {audit.description && (
            <p className="text-sm text-slate-600">{audit.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {engagement && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Engagement:</span>
                <span className="font-medium text-slate-900">{engagement.engagement_name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Type:</span>
              <span className="font-medium text-slate-900 capitalize">{audit.audit_type}</span>
            </div>
            
            {audit.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Start:</span>
                <span className="font-medium text-slate-900">{audit.start_date}</span>
              </div>
            )}
            
            {audit.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">End:</span>
                <span className="font-medium text-slate-900">{audit.end_date}</span>
              </div>
            )}
            
            {audit.lead_auditor && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Lead Auditor:</span>
                <span className="font-medium text-slate-900">{audit.lead_auditor}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Phases */}
      <Card id="phases">
        <CardHeader>
          <CardTitle className="text-base">Audit Phases ({phases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {phases.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No phases configured"
              description="Audit phases will appear here once the audit is set up"
            />
          ) : (
            <div className="space-y-3">
              {phases.map(phase => {
                const phaseProcedures = procedures.filter(p => p.audit_phase_id === phase.id);
                const completedInPhase = phaseProcedures.filter(p => p.execution_status === 'complete').length;
                
                return (
                  <div
                    key={phase.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-300">
                        <span className="text-xs font-semibold text-slate-700">{phase.phase_order}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-slate-900">{phase.name}</h4>
                        {phase.description && (
                          <p className="text-xs text-slate-600">{phase.description}</p>
                        )}
                        {phaseProcedures.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            {completedInPhase}/{phaseProcedures.length} procedures complete
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={phaseStatusColors[phase.status]}>
                      {phase.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {phase.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {phase.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Procedures Summary */}
      <Card id="procedures">
        <CardHeader>
          <CardTitle className="text-base">Procedures ({totalProcedures})</CardTitle>
        </CardHeader>
        <CardContent>
          {procedures.length === 0 ? (
            <EmptyState
              icon={List}
              title="No procedures created"
              description="Add audit procedures to define testing activities"
            />
          ) : (
            <div className="space-y-2">
              {procedures.slice(0, 5).map(proc => (
                <Link key={proc.id} to={createPageUrl(`AuditProcedureExecution?procedure_id=${proc.id}`)}>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{proc.name}</p>
                      <Badge className={
                        proc.execution_status === 'complete' ? 'bg-green-100 text-green-700' :
                        proc.execution_status === 'running' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }>
                        {proc.execution_status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
              {procedures.length > 5 && (
                <p className="text-xs text-slate-500 text-center pt-2">
                  +{procedures.length - 5} more procedures
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Samples, Evidence, Findings, Defense Package Sections */}
      <div className="grid grid-cols-2 gap-4">
        <Card id="samples">
          <CardHeader>
            <CardTitle className="text-sm">Sample Sets ({sampleSets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sampleSets.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No sample sets created</p>
            ) : (
              <p className="text-xs text-slate-600">{sampleSets.length} sample set{sampleSets.length !== 1 ? 's' : ''} across all procedures</p>
            )}
          </CardContent>
        </Card>

        <Card id="evidence">
          <CardHeader>
            <CardTitle className="text-sm">Evidence Items ({evidenceItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {evidenceItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No evidence collected</p>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Reviewed:</span>
                  <span className="font-medium text-green-700">{reviewedEvidence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending:</span>
                  <span className="font-medium text-slate-700">{evidenceItems.length - reviewedEvidence}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="findings">
          <CardHeader>
            <CardTitle className="text-sm">Findings ({findings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No findings documented</p>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Critical/High:</span>
                  <span className="font-medium text-red-700">{criticalFindings + highFindings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Medium/Low:</span>
                  <span className="font-medium text-slate-700">{findings.length - criticalFindings - highFindings}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="defense">
          <CardHeader>
            <CardTitle className="text-sm">Defense Package ({defensePackages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {defensePackages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No package generated</p>
            ) : (
              <div className="text-xs text-green-700">
                Last generated: {new Date(defensePackages[0].generated_at).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}