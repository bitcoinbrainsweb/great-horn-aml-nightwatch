import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function ReportPublicationDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const all = await base44.entities.GeneratedReport.list();
      setReports(all.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate)));
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = reports.filter(r => {
    if (filter === 'published') return r.status === 'published' && r.visibleOnReportsPage;
    if (filter === 'failed') return r.status === 'failed';
    if (filter === 'draft') return r.status === 'draft';
    return true;
  });

  const statusIcon = {
    published: <CheckCircle className="w-4 h-4 text-green-600" />,
    failed: <XCircle className="w-4 h-4 text-red-600" />,
    draft: <Clock className="w-4 h-4 text-slate-400" />,
  };

  const statusBadge = {
    published: <Badge className="bg-green-100 text-green-800">Published</Badge>,
    failed: <Badge className="bg-red-100 text-red-800">Failed</Badge>,
    draft: <Badge className="bg-slate-100 text-slate-800">Draft</Badge>,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report Publication Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Monitor generated and published reports</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 bg-green-50 text-center">
          <p className="text-2xl font-bold text-green-700">{reports.filter(r => r.status === 'published').length}</p>
          <p className="text-xs text-green-600 mt-1">Published</p>
        </Card>
        <Card className="p-4 bg-red-50 text-center">
          <p className="text-2xl font-bold text-red-700">{reports.filter(r => r.status === 'failed').length}</p>
          <p className="text-xs text-red-600 mt-1">Failed</p>
        </Card>
        <Card className="p-4 bg-blue-50 text-center">
          <p className="text-2xl font-bold text-blue-700">{reports.length}</p>
          <p className="text-xs text-blue-600 mt-1">Total</p>
        </Card>
        <Card className="p-4 bg-amber-50 text-center">
          <p className="text-2xl font-bold text-amber-700">{reports.filter(r => r.status === 'draft').length}</p>
          <p className="text-xs text-amber-600 mt-1">Draft</p>
        </Card>
      </div>

      <div className="flex gap-2">
        {['all', 'published', 'failed', 'draft'].map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center p-8"><p className="text-slate-500">Loading reports...</p></div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-8"><p className="text-slate-500">No reports found.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {statusIcon[r.status]}
                    <h3 className="font-semibold text-slate-900">{r.reportTitle}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline">{r.reportType}</Badge>
                    <Badge variant="outline">{r.upgradeId}</Badge>
                    <Badge variant="outline">{r.productVersion}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Generated: {new Date(r.reportDate).toLocaleString()} | Source: {r.sourceType}
                  </p>
                  {r.publicationError && (
                    <div className="mt-2 p-2 bg-red-50 rounded flex gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-800">{r.publicationError}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {statusBadge[r.status]}
                  {r.visibleOnReportsPage && <Badge className="bg-blue-100 text-blue-800 text-xs">On Reports Page</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}