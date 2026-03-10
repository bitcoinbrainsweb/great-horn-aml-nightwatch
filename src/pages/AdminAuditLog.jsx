import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { format } from 'date-fns';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AuditLog.list('-created_date', 100).then(l => { setLogs(l); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Audit Log" subtitle={`${logs.length} entries`} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Time</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Object</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Details</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 text-slate-600 text-xs">{l.created_date ? format(new Date(l.created_date), 'MMM d, h:mm a') : ''}</td>
                <td className="px-5 py-3 text-slate-900 font-medium">{l.user_email}</td>
                <td className="px-5 py-3 text-slate-600">{l.action}</td>
                <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{l.object_type}</td>
                <td className="px-5 py-3 text-slate-500 hidden lg:table-cell truncate max-w-xs">{l.details || l.field_changed || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}