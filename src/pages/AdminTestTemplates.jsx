import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Search, Edit2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../components/ui/PageHeader';

const TEST_TYPES = [
  'sample_review',
  'data_validation',
  'process_walkthrough',
  'inquiry',
  'observation',
  'reperformance',
  'inspection',
  'confirmation'
];

const EXECUTION_MODELS = ['manual', 'scheduled', 'automated'];

const CATEGORIES = [
  'CDD', 'EDD', 'Transaction Monitoring', 'Sanctions',
  'Governance', 'Reporting', 'Training', 'Operations', 'General'
];

export default function AdminTestTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const records = await base44.entities.TestTemplate.list('-created_date', 200);
      setTemplates(records);
    } catch (err) {
      console.error('Failed to load TestTemplate records:', err);
      setTemplates([]);
    }
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await base44.entities.TestTemplate.update(editId, form);
      } else {
        await base44.entities.TestTemplate.create({ ...form, active: form.active !== false });
      }
      setShowForm(false);
      setForm({});
      setEditId(null);
      await load();
    } catch (err) {
      console.error('Failed to save TestTemplate:', err);
    }
    setSaving(false);
  }

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase())
      || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.test_type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader title="Test Templates" subtitle={`${templates.length} templates`}>
          <Button
            onClick={() => { setForm({}); setEditId(null); setShowForm(true); }}
            className="bg-slate-900 hover:bg-slate-800 gap-2"
          >
            <Plus className="w-4 h-4" /> Add Template
          </Button>
        </PageHeader>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TEST_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {templates.length === 0 ? 'No test templates created yet.' : 'No templates match your filters.'}
          </p>
          {templates.length === 0 && (
            <Button
              onClick={() => { setForm({}); setEditId(null); setShowForm(true); }}
              variant="outline"
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Template
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Template</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Execution</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{t.name}</p>
                      {t.description && <p className="text-xs text-slate-500 truncate max-w-md">{t.description}</p>}
                      {t.category && <p className="text-xs text-slate-400 mt-0.5">{t.category}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {t.test_type?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell capitalize">
                      {t.default_execution_model || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={t.active
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                      }>
                        {t.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setForm(t); setEditId(t.id); setShowForm(true); }}
                        className="h-7 w-7"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Template' : 'New Test Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <Label>Template Name *</Label>
              <Input
                required
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Test Type *</Label>
              <Select
                value={form.test_type || ''}
                onValueChange={v => setForm({ ...form, test_type: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select test type..." /></SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.category || ''}
                onValueChange={v => setForm({ ...form, category: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Execution Model</Label>
              <Select
                value={form.default_execution_model || ''}
                onValueChange={v => setForm({ ...form, default_execution_model: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {EXECUTION_MODELS.map(m => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Test Objective Template</Label>
              <Textarea
                value={form.test_objective_template || ''}
                onChange={e => setForm({ ...form, test_objective_template: e.target.value })}
                rows={2}
                placeholder="Default test objective text..."
              />
            </div>
            <div>
              <Label>Test Procedure Template</Label>
              <Textarea
                value={form.test_procedure_template || ''}
                onChange={e => setForm({ ...form, test_procedure_template: e.target.value })}
                rows={2}
                placeholder="Default test procedure steps..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="template-active"
                checked={form.active !== false}
                onChange={e => setForm({ ...form, active: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="template-active" className="mb-0 cursor-pointer">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
