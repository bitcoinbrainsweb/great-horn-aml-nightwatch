import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Search, Edit2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';
import CoverageBadge from '@/components/coverage/CoverageBadge.jsx';

const CATEGORIES = ['Products', 'Delivery Channels', 'Clients', 'Geography', 'Technology', 'Sanctions', 'Third Parties', 'Operational'];

export default function AdminRiskLibrary() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coverage, setCoverage] = useState({});

  useEffect(() => { load(); }, []);
  async function load() { 
    const riskList = await base44.entities.RiskLibrary.list('-risk_category', 200);
    setRisks(riskList);
    // Pre-calculate coverage for all risks
    const coverageMap = {};
    for (const risk of riskList) {
      if (risk.linked_control_ids && risk.linked_control_ids.length > 0) {
        try {
          const response = await base44.functions.invoke('calculateRiskCoverage', {
            risk_id: risk.id,
            linked_control_ids: risk.linked_control_ids
          });
          coverageMap[risk.id] = response.data.coverage_status;
        } catch (error) {
          coverageMap[risk.id] = 'NOT_TESTED';
        }
      } else {
        coverageMap[risk.id] = 'UNCONTROLLED';
      }
    }
    setCoverage(coverageMap);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    if (editId) {
      await base44.entities.RiskLibrary.update(editId, form);
    } else {
      await base44.entities.RiskLibrary.create({ ...form, status: form.status || 'Active', version: 1, source: 'Great Horn AML' });
    }
    setShowForm(false); setForm({}); setEditId(null);
    await load(); setSaving(false);
  }

  function openEdit(risk) { setForm(risk); setEditId(risk.id); setShowForm(true); }

  const filtered = risks.filter(r => {
    const matchSearch = !search || r.risk_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || r.risk_category === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Risk Library" subtitle={`${risks.length} risks`}>
          <Button onClick={() => { setForm({}); setEditId(null); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 gap-2"><Plus className="w-4 h-4" /> Add Risk</Button>
        </PageHeader>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search risks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
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
               <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Risk</th>
               <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
               <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Coverage</th>
               <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Library Source</th>
               <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
               <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Actions</th>
             </tr></thead>
             <tbody className="divide-y divide-slate-100">
               {filtered.map(r => (
                 <tr key={r.id} className="hover:bg-slate-50/50">
                   <td className="px-5 py-3">
                     <p className="font-medium text-slate-900">{r.risk_name}</p>
                     <p className="text-xs text-slate-500 truncate max-w-md">{r.description}</p>
                   </td>
                   <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{r.risk_category}</td>
                   <td className="px-5 py-3">
                     <CoverageBadge status={coverage[r.id] || 'NOT_TESTED'} />
                   </td>
                   <td className="px-5 py-3 hidden lg:table-cell">
                     {r.library_source === 'amanda_framework' ? (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                         <BookOpen className="w-3 h-3" /> Amanda Framework
                       </span>
                     ) : r.library_source === 'legacy' ? (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Legacy</span>
                     ) : r.library_source === 'proposed' ? (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">Proposed</span>
                     ) : (
                       <span className="text-xs text-slate-400">{r.source || '—'}</span>
                     )}
                     {r.status === 'needs_review' && (
                       <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">⚑ Needs Review</span>
                     )}
                   </td>
                   <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                   <td className="px-5 py-3">
                     <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="h-7 w-7"><Edit2 className="w-3.5 h-3.5" /></Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Risk' : 'New Risk'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div><Label>Risk Name *</Label><Input required value={form.risk_name || ''} onChange={e => setForm({...form, risk_name: e.target.value})} /></div>
            <div><Label>Category *</Label>
              <Select value={form.risk_category || ''} onValueChange={v => setForm({...form, risk_category: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
            <div><Label>Status</Label>
              <Select value={form.status || 'Active'} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Draft', 'Active', 'Archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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