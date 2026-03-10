import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
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

  useEffect(() => { load(); }, []);
  async function load() { setTemplates(await base44.entities.NarrativeTemplate.list()); setLoading(false); }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    if (editId) await base44.entities.NarrativeTemplate.update(editId, form);
    else await base44.entities.NarrativeTemplate.create({ ...form, status: form.status || 'Active', version: 1 });
    setShowForm(false); setForm({}); setEditId(null); await load(); setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Narrative Templates" subtitle={`${templates.length} templates`}>
          <Button onClick={() => { setForm({}); setEditId(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 gap-2"><Plus className="w-4 h-4" /> Add Template</Button>
        </PageHeader>
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
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-900">{t.template_name}</td>
                <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{t.section}</td>
                <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{t.methodology || 'All'}</td>
                <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3"><Button variant="ghost" size="icon" onClick={() => { setForm(t); setEditId(t.id); setShowForm(true); }} className="h-7 w-7"><Edit2 className="w-3.5 h-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
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
            <div><Label>Template Text</Label><Textarea value={form.template_text || ''} onChange={e => setForm({...form, template_text: e.target.value})} rows={8} placeholder="Use placeholders like {client_name}, {risk_name}..." /></div>
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