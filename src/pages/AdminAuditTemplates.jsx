import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, FileText } from 'lucide-react';

export default function AdminAuditTemplates() {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    default_phases: '',
    default_procedures: '',
    active: true
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['auditTemplates'],
    queryFn: () => base44.entities.AuditTemplate.list('-created_date')
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.AuditTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditTemplates'] });
      setShowTemplateDialog(false);
      setTemplateFormData({
        name: '',
        description: '',
        default_phases: '',
        default_procedures: '',
        active: true
      });
    }
  });

  async function handleTemplateSubmit(e) {
    e.preventDefault();
    createTemplateMutation.mutate(templateFormData);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Templates" subtitle="Manage reusable audit templates">
        <Button onClick={() => setShowTemplateDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </PageHeader>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit templates"
          description="Create a template to standardize audit structures"
        />
      ) : (
        <div className="grid gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base mb-2">{template.name}</CardTitle>
                    <Badge className={template.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                      {template.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-slate-600">{template.description}</p>
                )}
                
                {template.default_phases && (
                  <div className="text-xs">
                    <p className="font-medium text-slate-700 mb-1">Default Phases:</p>
                    <p className="text-slate-500">{template.default_phases}</p>
                  </div>
                )}
                
                {template.default_procedures && (
                  <div className="text-xs">
                    <p className="font-medium text-slate-700 mb-1">Default Procedures:</p>
                    <p className="text-slate-500">{template.default_procedures}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Audit Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Name *</label>
              <Input
                value={templateFormData.name}
                onChange={e => setTemplateFormData({...templateFormData, name: e.target.value})}
                required
                placeholder="Standard AML Audit Template"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea
                value={templateFormData.description}
                onChange={e => setTemplateFormData({...templateFormData, description: e.target.value})}
                rows={3}
                placeholder="Template description and purpose"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Default Phases (JSON)</label>
              <Textarea
                value={templateFormData.default_phases}
                onChange={e => setTemplateFormData({...templateFormData, default_phases: e.target.value})}
                rows={3}
                placeholder='[{"name": "Planning", "order": 1}, {"name": "Fieldwork", "order": 2}]'
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Default Procedures (JSON)</label>
              <Textarea
                value={templateFormData.default_procedures}
                onChange={e => setTemplateFormData({...templateFormData, default_procedures: e.target.value})}
                rows={3}
                placeholder='[{"name": "Control Testing", "type": "validation"}]'
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Template</Button>
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
                  {engagements.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.engagement_name}</SelectItem>
                  ))}
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