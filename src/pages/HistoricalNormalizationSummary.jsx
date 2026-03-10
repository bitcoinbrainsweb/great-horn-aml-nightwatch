import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';

export default function HistoricalNormalizationSummary() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const res = await base44.functions.invoke('deliveryGateNW011A', {});
      setReport(res.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center p-8"><p className="text-slate-500">Failed to load report.</p></div>;
  }

  const downloadReport = () => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nightwatch_HistoricalNormalization_v0.5.0_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="NW-UPGRADE-011A: Historical Versioning Normalization"
        subtitle="Canonical product version model and naming standardization"
      >
        <Button onClick={downloadReport} className="gap-2">
          <Download className="w-4 h-4" /> Download Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-50 text-center">
          <p className="text-2xl font-bold text-slate-900">{report.productVersion}</p>
          <p className="text-xs text-slate-600 mt-1">Current Version</p>
        </Card>
        <Card className="p-4 bg-blue-50 text-center">
          <p className="text-2xl font-bold text-blue-700">5</p>
          <p className="text-xs text-blue-600 mt-1">Product Versions</p>
        </Card>
        <Card className="p-4 bg-green-50 text-center">
          <p className="text-2xl font-bold text-green-700">✓</p>
          <p className="text-xs text-green-600 mt-1">Ready</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Canonical Product Version Map</h2>
        <div className="space-y-3">
          {Object.entries(report.documentation.canonicalProductVersions).map(([version, desc]) => (
            <div key={version} className="flex items-center justify-between p-3 bg-slate-50 rounded">
              <span className="font-mono font-semibold text-slate-900">{version}</span>
              <span className="text-sm text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Implementation Details</h2>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-slate-700 mb-2">New Entities</p>
            <ul className="text-slate-600 space-y-1">
              {report.implementation.entities.map(e => <li key={e}>✓ {e}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-2">Normalized Records</p>
            <ul className="text-slate-600 space-y-1">
              {report.implementation.normalizedEntities.map(e => <li key={e}>✓ {e}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Verification Results</h2>
        <div className="space-y-2">
          {report.verification.checks.map((check, idx) => (
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Standards Going Forward</h2>
        <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
          {report.documentation.standards.map((std, idx) => <li key={idx}>{std}</li>)}
        </ul>
      </Card>

      <Card className="p-6 bg-amber-50 border-amber-200">
        <h2 className="text-lg font-semibold text-amber-900 mb-3">Remaining Cleanup Gaps</h2>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          {report.remainingCleanupGaps.map((gap, idx) => <li key={idx}>{gap}</li>)}
        </ul>
      </Card>

      <p className="text-xs text-slate-400 text-center pb-6">
        Nightwatch v0.5.0 · NW-UPGRADE-011A · {new Date(report.timestamp).toLocaleString()}
      </p>
    </div>
  );
}