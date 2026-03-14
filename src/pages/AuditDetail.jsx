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
import { FileText, Calendar, User, CheckCircle, Clock, AlertTriangle, Package, ArrowLeft, List } from 'lucide-react';

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
      <div className="grid grid-cols-4 gap-4">
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
              <p className="text-3xl font-bold text-amber-600">{findings.length}</p>
              <p className="text-xs text-slate-500 mt-1">Findings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{criticalFindings + highFindings}</p>
              <p className="text-xs text-slate-500 mt-1">Critical/High</p>
            </div>
          </CardContent>
        </Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Phases</CardTitle>
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

      {/* Audit Workflow */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Audit Workflow</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-2">Audit Flow:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>1. <strong>Audit Program</strong> → Schedule audits</p>
              <p>2. <strong>Audit</strong> → Define scope and phases</p>
              <p>3. <strong>Phase</strong> → Organize procedures</p>
              <p>4. <strong>Procedure</strong> → Execute testing</p>
              <p>5. <strong>Sample / Evidence</strong> → Collect and review</p>
              <p>6. <strong>Finding</strong> → Document issues</p>
              <p>7. <strong>Remediation</strong> → Verify resolution</p>
              <p>8. <strong>Defense Package</strong> → Export for regulators</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}