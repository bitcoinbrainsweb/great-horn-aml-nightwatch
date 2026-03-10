import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import OutputClassificationDashboard from '@/components/admin/OutputClassificationDashboard';

export default function OutputClassificationDebug() {
  const [deliveryGateReport, setDeliveryGateReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const res = await base44.functions.invoke('deliveryGateNW010B', {});
      setDeliveryGateReport(res.data);
    } catch (error) {
      console.error('Failed to load report:', error);
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
    a.download = `Nightwatch_OutputClassification_v0.5.0_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="NW-010B: Output Classification Correction"
        subtitle="Fix report/doc routing and clean up misclassifications"
      >
        <Button onClick={downloadReport} className="gap-2" disabled={loading || !deliveryGateReport}>
          <Download className="w-4 h-4" /> Download Report
        </Button>
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
            <Card className="p-4 bg-orange-50 text-center">
              <p className="text-2xl font-bold text-orange-700">{deliveryGateReport.normalization?.reclassified || 0}</p>
              <p className="text-xs text-orange-600 mt-1">Items Reclassified</p>
            </Card>
            <Card className="p-4 bg-green-50 text-center">
              <p className="text-2xl font-bold text-green-700">{deliveryGateReport.verification?.passed || 0}✓</p>
              <p className="text-xs text-green-600 mt-1">Verification Passed</p>
            </Card>
            <Card className={`p-4 text-center ${deliveryGateReport.internalToolsNowCorrect ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <p className={`text-xl font-bold ${deliveryGateReport.internalToolsNowCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                {deliveryGateReport.internalToolsNowCorrect ? '✓' : '!'}
              </p>
              <p className={`text-xs mt-1 ${deliveryGateReport.internalToolsNowCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
                Tools Filter Correct
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Classification Rules Enforced</h2>
            <div className="space-y-3 text-sm">
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
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Implementation Changes</h2>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              {deliveryGateReport.implementation?.changes?.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <div className="text-center p-8"><p className="text-slate-500">Failed to load report.</p></div>
      )}

      <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Output Classification Dashboard</h2>
        <OutputClassificationDashboard />
      </div>
    </div>
  );
}