import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, FileBarChart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    base44.entities.Report.list('-created_date', 100).then(r => { setReports(r); setLoading(false); });
  }, []);

  const filtered = reports.filter(r => {
    const matchSearch = !search || r.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${reports.length} total reports`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['Draft', 'Under Review', 'Approved', 'Finalized', 'Exported'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileBarChart} title="No reports yet" description="Reports are generated from engagement workflows." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Version</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Generated</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={createPageUrl(`EngagementDetail?id=${r.engagement_id}`)} className="font-medium text-slate-900 hover:text-blue-600">{r.client_name || 'Unknown'}</Link>
                      <p className="text-xs text-slate-500">{r.engagement_type}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{r.report_type}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">v{r.version}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell">{r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}