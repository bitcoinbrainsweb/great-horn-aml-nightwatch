import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';

export default function OutputClassificationSummary() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const res = await base44.functions.invoke('deliveryGateNW010B', {});
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
    a.download = `Nightwatch_OutputClassification_v0.5.0_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="NW-UPGRADE-010B: Output Classification Correction"
        subtitle="Fix report/doc routing and clean up misclassifications"
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
        <Card className="p-4 bg-orange-50 text-center">
          <p className="text-2xl font-bold text-orange-700">{report.normalization?.reclassified || 0}</p>
          <p className="text-xs text-orange-600 mt-1">Items Reclassified</p>
        </Card>
        <Card className={`p-4 text-center ${report.internalToolsNowCorrect ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <p className={`text-xl font-bold ${report.internalToolsNowCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
            {report.internalToolsNowCorrect ? '✓' : '!'}
          </p>
          <p className={`text-xs mt-1 ${report.internalToolsNowCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
            Internal Tools Correct
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Classification Rules Enforced</h2>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="font-semibold text-blue-900">Reports</p>
            <p className="text-blue-700 text-xs mt-1">visibleInReports=true, visibleInAdminTools=false</p>
          </div>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <p className="font-semibold text-green-900">Documentation</p>
            <p className="text-green-700 text-xs mt-1">visibleInDocs=true, visibleInAdminTools=false</p>
          </div>
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <p className="font-semibold text-purple-900">Tools</p>
            <p className="text-purple-700 text-xs mt-1">visibleInAdminTools=true, not reports/docs</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Verification Results</h2>
        <div className="space-y-2">
          {report.verification?.checks?.map((check, idx) => (
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Implementation Summary</h2>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-slate-700 mb-2">New Entity</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {report.implementation?.entities?.map(e => <li key={e}>✓ {e}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-2">Key Changes</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {report.implementation?.changes?.slice(0, 5).map((change, idx) => <li key={idx}>✓ {change}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Routing Guarantees</h2>
        <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
          {report.documentation?.routingGuarantees?.map((guarantee, idx) => <li key={idx}>{guarantee}</li>)}
        </ul>
      </Card>

      <p className="text-xs text-slate-400 text-center pb-6">
        Nightwatch v0.5.0 · NW-UPGRADE-010B · {new Date(report.timestamp).toLocaleString()}
      </p>
    </div>
  );
}