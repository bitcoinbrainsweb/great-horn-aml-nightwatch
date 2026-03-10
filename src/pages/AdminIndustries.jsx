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
import { RiskBadge } from '../components/ui/RiskBadge';

export default function AdminIndustries() {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { setIndustries(await base44.entities.Industry.list()); setLoading(false); }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    if (editId) await base44.entities.Industry.update(editId, form);
    else await base44.entities.Industry.create(form);
    setShowForm(false); setForm({}); setEditId(null); await load(); setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Industries" subtitle={`${industries.length} industries`}>
          <Button onClick={() => { setForm({}); setEditId(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 gap-2"><Plus className="w-4 h-4" /> Add</Button>
        </PageHeader>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Industry</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Risk Rating</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Notes</th>
            <th className="w-20"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {industries.map(i => (
              <tr key={i.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-900">{i.industry_name}</td>
                <td className="px-5 py-3"><RiskBadge rating={i.default_risk_rating} /></td>
                <td className="px-5 py-3 text-slate-500 hidden md:table-cell truncate max-w-xs">{i.notes || '—'}</td>
                <td className="px-5 py-3"><Button variant="ghost" size="icon" onClick={() => { setForm(i); setEditId(i.id); setShowForm(true); }} className="h-7 w-7"><Edit2 className="w-3.5 h-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'New'} Industry</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div><Label>Industry Name *</Label><Input required value={form.industry_name || ''} onChange={e => setForm({...form, industry_name: e.target.value})} /></div>
            <div><Label>Default Risk Rating</Label>
              <Select value={form.default_risk_rating || ''} onValueChange={v => setForm({...form, default_risk_rating: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{['Low', 'Moderate', 'High'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={3} /></div>
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