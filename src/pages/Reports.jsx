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
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Load from canonical PublishedOutput entity, reports only
    // STRICT FILTER: classification = "report" AND status = "published"
    // This ensures only compliance/engagement reports appear, not verification/audit records
    base44.entities.PublishedOutput.filter({ 
      classification: 'report', 
      status: 'published' 
    })
      .then(r => { 
        const mapped = r.map(o => ({
          id: o.id,
          reportTitle: o.outputName,
          upgradeId: o.upgrade_id,
          productVersion: o.product_version,
          reportType: o.report_type || o.subtype,
          reportDate: o.published_at,
        }));
        setReports(mapped.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate))); 
        setLoading(false); 
      });
  }, []);

  const filtered = reports.filter(r => {
    const matchSearch = !search || r.reportTitle?.toLowerCase().includes(search.toLowerCase()) || r.upgradeId?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.reportType === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${reports.length} published reports`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by title or upgrade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="implementation">Implementation</SelectItem>
            <SelectItem value="verification">Verification</SelectItem>
            <SelectItem value="audit">Audit</SelectItem>
            <SelectItem value="delivery_gate">Delivery Gate</SelectItem>
            <SelectItem value="documentation_update">Documentation</SelectItem>
            <SelectItem value="architecture_check">Architecture</SelectItem>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Upgrade</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Version</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Generated</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{r.reportTitle}</p>
                      {r.legacyTitle && <p className="text-xs text-slate-500">(Legacy: {r.legacyTitle})</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600 hidden md:table-cell font-mono text-xs">{r.upgradeId}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell font-mono text-xs">{r.productVersion}</td>
                    <td className="px-5 py-3 text-slate-600 hidden lg:table-cell text-xs">{r.reportDate ? format(new Date(r.reportDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-5 py-3"><span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{r.reportType}</span></td>
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