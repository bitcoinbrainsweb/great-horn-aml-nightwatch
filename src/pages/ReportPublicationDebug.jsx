import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, RotateCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ReportPublicationDashboard from '@/components/admin/ReportPublicationDashboard';

export default function ReportPublicationDebug() {
  const [deliveryGateReport, setDeliveryGateReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const res = await base44.functions.invoke('deliveryGateNW010A', {});
      setDeliveryGateReport(res.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runBackfill() {
    setLoading(true);
    try {
      await base44.functions.invoke('BackfillGeneratedReports', {});
      await loadReport();
    } catch (error) {
      console.error('Backfill failed:', error);
    } finally {
      setLoading(false);
    }
  }

  const downloadReport = () => {
    if (!deliveryGateReport) return;
    const json = JSON.stringify(deliveryGateReport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nightwatch_ReportPublication_v0.5.0_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="NW-010A: Report Publication Pipeline Fix"
        subtitle="Monitor report generation, publication, and discovery"
      >
        <div className="flex gap-2">
          <Button onClick={runBackfill} variant="outline" className="gap-2" disabled={loading}>
            <RotateCw className="w-4 h-4" /> Backfill Reports
          </Button>
          <Button onClick={downloadReport} className="gap-2" disabled={loading || !deliveryGateReport}>
            <Download className="w-4 h-4" /> Download Report
          </Button>
        </div>
      </PageHeader>

      {loading && !deliveryGateReport ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : deliveryGateReport ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-4 bg-slate-50 text-center">
              <p className="text-2xl font-bold text-slate-900">{deliveryGateReport.productVersion}</p>
              <p className="text-xs text-slate-600 mt-1">Current Version</p>
            </Card>
            <Card className="p-4 bg-green-50 text-center">
              <p className="text-2xl font-bold text-green-700">{deliveryGateReport.backfill?.backfilledCount || 0}</p>
              <p className="text-xs text-green-600 mt-1">Reports Backfilled</p>
            </Card>
            <Card className="p-4 bg-blue-50 text-center">
              <p className="text-2xl font-bold text-blue-700">{deliveryGateReport.verification?.checks?.length || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Verification Checks</p>
            </Card>
            <Card className="p-4 bg-amber-50 text-center">
              <p className="text-2xl font-bold text-amber-700">{deliveryGateReport.verification?.passed || 0}✓</p>
              <p className="text-xs text-amber-600 mt-1">Passed</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Implementation Summary</h2>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-semibold text-slate-700 mb-2">New Entities</p>
                <ul className="text-slate-600 space-y-1">
                  {deliveryGateReport.implementation?.entities?.map(e => <li key={e}>✓ {e}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-2">New Functions</p>
                <ul className="text-slate-600 space-y-1">
                  {deliveryGateReport.implementation?.functions?.slice(0, 3).map(f => <li key={f}>✓ {f}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600 font-mono">
                {deliveryGateReport.implementation?.changes?.length} architectural changes implemented
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Verification Results</h2>
            <div className="space-y-2">
              {deliveryGateReport.verification?.checks?.map((check, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded text-sm">
                  <span>{check.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{check.details}</span>
                    <Badge variant={check.status === 'pass' ? 'default' : 'destructive'}>
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Documentation Pipeline</h2>
            <div className="space-y-4 text-sm">
              {deliveryGateReport.documentation?.pipeline && (
                <div>
                  <p className="font-semibold text-slate-700 mb-2">Report Publication Flow</p>
                  <ol className="text-slate-600 space-y-1 list-decimal list-inside">
                    {Object.entries(deliveryGateReport.documentation.pipeline).map(([key, val]) => (
                      <li key={key}>{val}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center p-8"><p className="text-slate-500">Failed to load report.</p></div>
      )}

      <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Publication Dashboard</h2>
        <ReportPublicationDashboard />
      </div>
    </div>
  );
}