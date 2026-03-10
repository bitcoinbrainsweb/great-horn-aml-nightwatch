import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Edit2, Search, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';

const SECTIONS = ['Executive Summary', 'Methodology', 'Risk Explanation', 'Control Explanation', 'Residual Risk Narrative'];

export default function AdminNarratives() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [filterSection, setFilterSection] = useState('all');

  useEffect(() => { load(); }, []);
  async function load() { setTemplates(await base44.entities.NarrativeTemplate.list()); setLoading(false); }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery || 
      t.template_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.template_text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = filterSection === 'all' || t.section === filterSection;
    return matchesSearch && matchesSection;
  });

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    const user = await base44.auth.me();
    if (editId) {
      await base44.entities.NarrativeTemplate.update(editId, form);
      await base44.entities.AuditLog.create({
        user_email: user?.email,
        object_type: 'NarrativeTemplate',
        object_id: editId,
        action: 'narrative_template_updated',
        details: `Template "${form.template_name}" updated`
      });
    } else {
      await base44.entities.NarrativeTemplate.create({ ...form, status: form.status || 'Active', version: 1 });
      await base44.entities.AuditLog.create({
        user_email: user?.email,
        object_type: 'NarrativeTemplate',
        object_id: '',
        action: 'narrative_template_created',
        details: `Template "${form.template_name}" created`
      });
    }
    setShowForm(false); setForm({}); setEditId(null); await load(); setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Narrative Templates" subtitle={`${filteredTemplates.length} of ${templates.length} templates`}>
          <Button onClick={() => { setForm({}); setEditId(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 gap-2"><Plus className="w-4 h-4" /> Add Template</Button>
        </PageHeader>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name, section, or content..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Template</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Section</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Methodology</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="w-20"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTemplates.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-400">
                  {searchQuery || filterSection !== 'all' ? 'No templates match your filters' : 'No templates yet'}
                </td>
              </tr>
            ) : (
              filteredTemplates.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{t.template_name}</td>
                  <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{t.section}</td>
                  <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{t.methodology || 'All'}</td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(t)} className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setForm(t); setEditId(t.id); setShowForm(true); }} className="h-7 w-7"><Edit2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.template_name}</DialogTitle>
            <p className="text-xs text-slate-500 mt-1">Section: {previewTemplate?.section} · {previewTemplate?.methodology || 'All Methodologies'}</p>
          </DialogHeader>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-700">
              {previewTemplate?.template_text || 'No template text'}
            </pre>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => { setPreviewTemplate(null); setForm(previewTemplate); setEditId(previewTemplate.id); setShowForm(true); }} className="gap-2">
              <Edit2 className="w-3.5 h-3.5" /> Edit Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Template' : 'New Template'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div><Label>Template Name *</Label><Input required value={form.template_name || ''} onChange={e => setForm({...form, template_name: e.target.value})} /></div>
            <div><Label>Section *</Label>
              <Select value={form.section || ''} onValueChange={v => setForm({...form, section: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Methodology</Label><Input value={form.methodology || ''} onChange={e => setForm({...form, methodology: e.target.value})} placeholder="Leave empty for all" /></div>
            <div><Label>Template Text</Label><Textarea value={form.template_text || ''} onChange={e => setForm({...form, template_text: e.target.value})} rows={12} placeholder="Use {{client_name}} placeholder for client name..." className="font-serif text-sm" /></div>
            <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">
              <strong>Available Placeholders:</strong> {'{{client_name}}'} will be replaced with the client's name in generated reports.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}