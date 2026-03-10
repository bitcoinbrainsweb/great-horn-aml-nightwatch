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

export default function AdminMethodologies() {
  const [methodologies, setMethodologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { setMethodologies(await base44.entities.Methodology.list()); setLoading(false); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    if (editId) await base44.entities.Methodology.update(editId, form);
    else await base44.entities.Methodology.create({ ...form, status: form.status || 'Active' });
    setShowForm(false); setForm({}); setEditId(null);
    await load(); setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Methodologies" subtitle={`${methodologies.length} methodologies`}>
          <Button onClick={() => { setForm({}); setEditId(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 gap-2"><Plus className="w-4 h-4" /> Add Methodology</Button>
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methodologies.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{m.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setForm(m); setEditId(m.id); setShowForm(true); }} className="h-7 w-7">
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="mt-3"><StatusBadge status={m.status} /></div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Methodology' : 'New Methodology'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div><Label>Name *</Label><Input required value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
            <div><Label>Control Framework</Label><Input value={form.control_framework || ''} onChange={e => setForm({...form, control_framework: e.target.value})} /></div>
            <div><Label>Scoring Model</Label><Input value={form.scoring_model || ''} onChange={e => setForm({...form, scoring_model: e.target.value})} /></div>
            <div><Label>Status</Label>
              <Select value={form.status || 'Active'} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Active', 'Draft', 'Archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
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