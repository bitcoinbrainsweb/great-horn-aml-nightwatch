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
import EmptyState from '@/components/ui/EmptyState';
import NextStepGuidance from '@/components/help/NextStepGuidance';
import { Plus, Calendar, CheckCircle } from 'lucide-react';

export default function AdminAuditPrograms() {
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programFormData, setProgramFormData] = useState({
    name: '',
    description: '',
    frequency: 'annual',
    owner: '',
    active: true
  });
  const [scheduleFormData, setScheduleFormData] = useState({
    engagement_id: '',
    scheduled_date: ''
  });

  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['auditPrograms'],
    queryFn: () => base44.entities.AuditProgram.list('-created_date')
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['auditSchedules'],
    queryFn: () => base44.entities.AuditSchedule.list('-scheduled_date')
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => base44.entities.Engagement.list('-created_date', 100)
  });

  const createProgramMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.AuditProgram.create({
        ...data,
        owner: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditPrograms'] });
      setShowProgramDialog(false);
      setProgramFormData({
        name: '',
        description: '',
        frequency: 'annual',
        owner: '',
        active: true
      });
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.AuditSchedule.create({
      ...data,
      audit_program_id: selectedProgram.id,
      status: 'scheduled'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditSchedules'] });
      setShowScheduleDialog(false);
      setScheduleFormData({
        engagement_id: '',
        scheduled_date: ''
      });
    }
  });

  function openScheduleDialog(program) {
    setSelectedProgram(program);
    setShowScheduleDialog(true);
  }

  async function handleProgramSubmit(e) {
    e.preventDefault();
    createProgramMutation.mutate(programFormData);
  }

  async function handleScheduleSubmit(e) {
    e.preventDefault();
    createScheduleMutation.mutate(scheduleFormData);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const frequencyColors = {
    'annual': 'bg-blue-100 text-blue-700',
    'semi_annual': 'bg-purple-100 text-purple-700',
    'quarterly': 'bg-green-100 text-green-700',
    'ad_hoc': 'bg-slate-100 text-slate-700'
  };

  const scheduleStatusColors = {
    'scheduled': 'bg-blue-100 text-blue-700',
    'in_progress': 'bg-amber-100 text-amber-700',
    'completed': 'bg-green-100 text-green-700'
  };

  // Next step logic
  const activePrograms = programs.filter(p => p.active);
  const programsWithNoSchedules = activePrograms.filter(prog => {
    const hasSchedules = schedules.some(s => s.audit_program_id === prog.id);
    return !hasSchedules;
  });
  
  const showNextStepNoPrograms = programs.length === 0;
  const showNextStepNoSchedules = activePrograms.length > 0 && programsWithNoSchedules.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Programs" subtitle="Manage recurring audit programs and schedules">
        <Button onClick={() => setShowProgramDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Program
        </Button>
      </PageHeader>

      {showNextStepNoPrograms && (
        <NextStepGuidance
          currentState="No audit programs exist yet."
          recommendedAction="Create an audit program for recurring audits like annual AML reviews."
          explanation="Programs let you schedule the same audit repeatedly. Set frequency and the system helps you stay on schedule."
          ctaText="Create Program"
          onCtaClick={() => setShowProgramDialog(true)}
        />
      )}

      {showNextStepNoSchedules && (
        <NextStepGuidance
          currentState={`${programsWithNoSchedules.length} active program${programsWithNoSchedules.length > 1 ? 's have' : ' has'} no scheduled audits yet.`}
          recommendedAction="Schedule audits from these programs."
          explanation="Programs are templates - you still need to schedule actual audit instances based on your calendar."
          variant="warning"
        />
      )}

      {programs.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No audit programs"
          description="Create an audit program to manage recurring audits"
        />
      ) : (
        <div className="grid gap-4">
          {programs.map(program => {
            const programSchedules = schedules.filter(s => s.audit_program_id === program.id);
            const upcomingSchedules = programSchedules.filter(s => s.status === 'scheduled');
            
            return (
              <Card key={program.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">{program.name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={frequencyColors[program.frequency]}>
                          {program.frequency.replace('_', ' ')}
                        </Badge>
                        {program.active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700">Inactive</Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          {programSchedules.length} scheduled audit{programSchedules.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => openScheduleDialog(program)} size="sm" variant="outline">
                      <Plus className="w-3 h-3 mr-1" />
                      Schedule Audit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {program.description && (
                    <p className="text-sm text-slate-600">{program.description}</p>
                  )}
                  
                  {program.owner && (
                    <p className="text-xs text-slate-500">Owner: {program.owner}</p>
                  )}
                  
                  {upcomingSchedules.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-slate-700 mb-2">Upcoming Audits:</p>
                      <div className="space-y-2">
                        {upcomingSchedules.slice(0, 3).map(schedule => {
                          const engagement = engagements.find(e => e.id === schedule.engagement_id);
                          
                          return (
                            <div key={schedule.id} className="flex items-center justify-between text-xs bg-blue-50 border border-blue-200 rounded p-2">
                              <div>
                                <span className="font-medium text-slate-900">
                                  {engagement?.engagement_name || 'Unknown Engagement'}
                                </span>
                                <span className="text-slate-500 ml-2">
                                  • {new Date(schedule.scheduled_date).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge className={scheduleStatusColors[schedule.status]}>
                                {schedule.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Program Dialog */}
      <Dialog open={showProgramDialog} onOpenChange={setShowProgramDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Audit Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProgramSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Name *</label>
              <Input
                value={programFormData.name}
                onChange={e => setProgramFormData({...programFormData, name: e.target.value})}
                required
                placeholder="Annual AML Compliance Review"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea
                value={programFormData.description}
                onChange={e => setProgramFormData({...programFormData, description: e.target.value})}
                rows={3}
                placeholder="Program objectives and scope"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Frequency</label>
              <Select
                value={programFormData.frequency}
                onValueChange={v => setProgramFormData({...programFormData, frequency: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="ad_hoc">Ad-hoc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowProgramDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Program</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Audit for {selectedProgram?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Engagement *</label>
              <Select
                value={scheduleFormData.engagement_id}
                onValueChange={v => setScheduleFormData({...scheduleFormData, engagement_id: v})}
                required
              >
                <SelectTrigger><SelectValue placeholder="Select engagement..." /></SelectTrigger>
                <SelectContent>
                  {engagements.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-500 italic">No engagements available.</div>
                  ) : (
                    engagements.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.engagement_name || e.engagement_type || `Engagement ${e.id}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Scheduled Date *</label>
              <Input
                type="date"
                value={scheduleFormData.scheduled_date}
                onChange={e => setScheduleFormData({...scheduleFormData, scheduled_date: e.target.value})}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Schedule Audit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}