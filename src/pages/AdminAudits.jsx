import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, FileText, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminAudits() {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    engagement_id: '',
    audit_type: 'internal',
    start_date: '',
    end_date: '',
    lead_auditor: ''
  });

  const queryClient = useQueryClient();

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => base44.entities.Audit.list('-created_date')
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => base44.entities.Engagement.list()
  });

  const createAuditMutation = useMutation({
    mutationFn: async (data) => {
      const audit = await base44.entities.Audit.create(data);
      
      // Create default phases
      const defaultPhases = [
        { name: 'Planning', phase_order: 1 },
        { name: 'Fieldwork', phase_order: 2 },
        { name: 'Review', phase_order: 3 },
        { name: 'Reporting', phase_order: 4 }
      ];
      
      for (const phase of defaultPhases) {
        await base44.entities.AuditPhase.create({
          audit_id: audit.id,
          name: phase.name,
          phase_order: phase.order,
          status: 'pending'
        });
      }
      
      return audit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setShowDialog(false);
      setFormData({
        name: '',
        description: '',
        engagement_id: '',
        audit_type: 'internal',
        start_date: '',
        end_date: '',
        lead_auditor: ''
      });
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    createAuditMutation.mutate(formData);
  }

  const statusColors = {
    'planned': 'bg-slate-100 text-slate-700',
    'active': 'bg-blue-100 text-blue-700',
    'fieldwork': 'bg-purple-100 text-purple-700',
    'review': 'bg-amber-100 text-amber-700',
    'completed': 'bg-green-100 text-green-700'
  };

  const typeColors = {
    'internal': 'bg-blue-100 text-blue-700',
    'external': 'bg-purple-100 text-purple-700',
    'regulatory': 'bg-red-100 text-red-700'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audits" subtitle="Manage audit engagements and procedures">
        <Button onClick={() => setShowDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Audit
        </Button>
      </PageHeader>

      {audits.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audits"
          description="Create your first audit engagement"
        />
      ) : (
        <div className="grid gap-4">
          {audits.map(audit => {
            const engagement = engagements.find(e => e.id === audit.engagement_id);
            
            return (
              <Card key={audit.id} className="hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Link to={createPageUrl(`AuditDetail?id=${audit.id}`)}>
                          <h3 className="text-sm font-semibold text-slate-900 hover:text-blue-600">
                            {audit.name}
                          </h3>
                        </Link>
                        <Badge className={statusColors[audit.status]}>
                          {audit.status}
                        </Badge>
                        <Badge className={typeColors[audit.audit_type]} variant="outline">
                          {audit.audit_type}
                        </Badge>
                      </div>
                      
                      {audit.description && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{audit.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {engagement && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{engagement.engagement_name}</span>
                          </div>
                        )}
                        {audit.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{audit.start_date}</span>
                            {audit.end_date && <span>→ {audit.end_date}</span>}
                          </div>
                        )}
                        {audit.lead_auditor && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{audit.lead_auditor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Audit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Audit Name *</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                placeholder="e.g., Q4 2025 AML Compliance Audit"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="Audit objectives and scope"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Engagement *</label>
                <Select
                  value={formData.engagement_id}
                  onValueChange={v => setFormData({...formData, engagement_id: v})}
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
                <label className="text-xs font-medium text-slate-700">Audit Type</label>
                <Select
                  value={formData.audit_type}
                  onValueChange={v => setFormData({...formData, audit_type: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Start Date</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-700">End Date</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-700">Lead Auditor</label>
              <Input
                value={formData.lead_auditor}
                onChange={e => setFormData({...formData, lead_auditor: e.target.value})}
                placeholder="Email address"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAuditMutation.isPending}>
                {createAuditMutation.isPending ? 'Creating...' : 'Create Audit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}