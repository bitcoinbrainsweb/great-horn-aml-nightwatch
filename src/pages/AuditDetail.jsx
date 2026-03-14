import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import { FileText, Calendar, User, CheckCircle, Clock } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <PageHeader title={audit.name} subtitle="Audit Dashboard">
        <Badge className={statusColors[audit.status]}>{audit.status}</Badge>
      </PageHeader>

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
            <p className="text-sm text-slate-500 text-center py-4">No phases found</p>
          ) : (
            <div className="space-y-3">
              {phases.map(phase => (
                <div
                  key={phase.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-300">
                      <span className="text-xs font-semibold text-slate-700">{phase.phase_order}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{phase.name}</h4>
                      {phase.description && (
                        <p className="text-xs text-slate-600">{phase.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={phaseStatusColors[phase.status]}>
                    {phase.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                    {phase.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {phase.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Panel */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">About Audit Module</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>
            The Audit module provides structured workflows for AML program audits, linking to engagement-scoped 
            testing (EngagementControlTest → EvidenceItem → Observation → RemediationAction).
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="font-medium text-blue-900 mb-1">Graph Architecture:</p>
            <p className="text-xs text-blue-700">
              Audit → AuditPhase → AuditProcedure → AuditWorkpaper → EngagementControlTest
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}