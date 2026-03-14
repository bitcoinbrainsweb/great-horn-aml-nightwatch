import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit2, Search, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const TEST_TYPES = [
  'sample_review',
  'data_validation',
  'process_walkthrough',
  'document_verification',
  'automated_rule_check',
  'observation',
  'inspection',
  're-performance'
];

const EXECUTION_MODELS = ['manual', 'scheduled', 'automated'];

export default function AdminTestTemplates() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['testTemplates'],
    queryFn: () => base44.entities.TestTemplate.list('-created_date', 200),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TestTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testTemplates'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TestTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testTemplates'] });
      resetForm();
    }
  });

  function resetForm() {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({});
  }

  function handleEdit(template) {
    setEditingTemplate(template);
    setFormData(template);
    setShowForm(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    const payload = {
      ...formData,
      active: formData.active !== false
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const filteredTemplates = templates.filter(t =>
    !search || 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.test_type?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader 
          title="Test Templates" 
          subtitle={`${templates.length} templates`}
        >
          <Button onClick={() => { setFormData({}); setEditingTemplate(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        </PageHeader>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {template.test_type}
                    </Badge>
                    {template.default_execution_model && (
                      <Badge variant="secondary" className="text-xs">
                        {template.default_execution_model}
                      </Badge>
                    )}
                    {template.active ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(template)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            {template.description && (
              <CardContent className="text-sm text-slate-600">
                {template.description}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            {search ? 'No templates match your search' : 'No test templates yet. Create one to get started.'}
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Test Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Type *</Label>
                <Select
                  value={formData.test_type || ''}
                  onValueChange={(v) => setFormData({ ...formData, test_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Default Execution Model</Label>
                <Select
                  value={formData.default_execution_model || 'manual'}
                  onValueChange={(v) => setFormData({ ...formData, default_execution_model: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXECUTION_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model.charAt(0).toUpperCase() + model.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Compliance, Security, Operations"
              />
            </div>

            <div>
              <Label>Test Objective Template</Label>
              <Textarea
                value={formData.test_objective_template || ''}
                onChange={(e) => setFormData({ ...formData, test_objective_template: e.target.value })}
                rows={3}
                placeholder="Template text for test objective..."
              />
            </div>

            <div>
              <Label>Test Procedure Template</Label>
              <Textarea
                value={formData.test_procedure_template || ''}
                onChange={(e) => setFormData({ ...formData, test_procedure_template: e.target.value })}
                rows={3}
                placeholder="Template text for test procedure..."
              />
            </div>

            <div>
              <Label>Required Inputs (JSON)</Label>
              <Textarea
                value={formData.required_inputs || ''}
                onChange={(e) => setFormData({ ...formData, required_inputs: e.target.value })}
                rows={3}
                placeholder='{"field1": "description", "field2": "description"}'
              />
            </div>

            <div>
              <Label>Evidence Schema (JSON)</Label>
              <Textarea
                value={formData.evidence_schema || ''}
                onChange={(e) => setFormData({ ...formData, evidence_schema: e.target.value })}
                rows={3}
                placeholder='{"type": "object", "properties": {...}}'
              />
            </div>

            <div>
              <Label>Result Metrics (JSON Array)</Label>
              <Textarea
                value={formData.result_metrics || ''}
                onChange={(e) => setFormData({ ...formData, result_metrics: e.target.value })}
                rows={2}
                placeholder='["records_examined", "exceptions_found", "exception_rate"]'
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active !== false}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="active" className="cursor-pointer">Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}