import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Search, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';

const CATEGORIES = ['Governance', 'CDD', 'EDD', 'Sanctions', 'Transaction Monitoring', 'Reporting', 'Technology Security', 'Vendor Oversight', 'Training', 'Operations'];

export default function AdminControlLibrary() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { setControls(await base44.entities.ControlLibrary.list('-control_category', 200)); setLoading(false); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    if (editId) {
      await base44.entities.ControlLibrary.update(editId, form);
    } else {
      await base44.entities.ControlLibrary.create({ ...form, status: form.status || 'Active', version: 1 });
    }
    setShowForm(false); setForm({}); setEditId(null);
    await load(); setSaving(false);
  }

  const filtered = controls.filter(c => {
    const matchSearch = !search || c.control_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || c.control_category === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Control Library" subtitle={`${controls.length} controls`}>
          <Button onClick={() => { setForm({}); setEditId(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 gap-2"><Plus className="w-4 h-4" /> Add Control</Button>
        </PageHeader>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search controls..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Control</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{c.control_name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-md">{c.description}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{c.control_category}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3">
                    <Button variant="ghost" size="icon" onClick={() => { setForm(c); setEditId(c.id); setShowForm(true); }} className="h-7 w-7"><Edit2 className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Control' : 'New Control'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div><Label>Control Name *</Label><Input required value={form.control_name || ''} onChange={e => setForm({...form, control_name: e.target.value})} /></div>
            <div><Label>Category *</Label>
              <Select value={form.control_category || ''} onValueChange={v => setForm({...form, control_category: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
            <div><Label>Evidence Expected</Label><Input value={form.evidence_expected || ''} onChange={e => setForm({...form, evidence_expected: e.target.value})} /></div>
            <div><Label>Regulatory Reference</Label><Input value={form.regulatory_reference || ''} onChange={e => setForm({...form, regulatory_reference: e.target.value})} /></div>
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