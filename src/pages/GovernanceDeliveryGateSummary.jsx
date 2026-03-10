import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';

export default function GovernanceDeliveryGateSummary() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const res = await base44.functions.invoke('deliveryGateNW011', {});
      setReport(res.data);
    } catch (error) {
      console.error('Failed to load delivery gate report:', error);
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
    return (
      <div className="text-center p-8">
        <p className="text-slate-500">Failed to load delivery gate report.</p>
      </div>
    );
  }

  const downloadReport = () => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nightwatch_DeliveryGate_NW-UPGRADE-011_v0.11.0_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="NW-UPGRADE-011: Delivery Gate Summary"
        subtitle="Role/Permission Model + Override Governance + Report Naming Standardization"
      >
        <Button onClick={downloadReport} className="gap-2">
          <Download className="w-4 h-4" /> Download Report
        </Button>
      </PageHeader>

      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Upgrade ID', value: report.upgradeId, color: 'bg-slate-50' },
          { label: 'Product Version', value: report.productVersion, color: 'bg-blue-50' },
          { label: 'Status', value: report.status.toUpperCase(), color: report.status === 'ready' ? 'bg-green-50' : 'bg-yellow-50' },
          { label: 'Readiness', value: report.releaseReadiness.toUpperCase(), color: report.releaseReadiness === 'ready' ? 'bg-green-50' : 'bg-yellow-50' },
        ].map(({ label, value, color }) => (
          <Card key={label} className={`p-4 text-center ${color}`}>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-600 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Implementation Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Implementation Summary</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Entities (5)</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {report.implementation.entities.map(e => <li key={e}>✓ {e}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Functions (7)</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {report.implementation.functions.map(f => <li key={f}>✓ {f}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Components (5)</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {report.implementation.components.map(c => <li key={c}>✓ {c}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Roles & Permissions</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>✓ {report.implementation.roles.length} Roles Defined</li>
              <li>✓ {report.implementation.permissions} Permissions Seeded</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Verification Results */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Verification Results</h2>
        <div className="space-y-2">
          {report.verification.checks.map((check, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
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
        <p className="text-xs text-slate-500 mt-4">
          Summary: <strong>{report.verification.summary}</strong>
        </p>
      </Card>

      {/* Architecture Assessment */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Architecture Assessment</h2>
        <div className="space-y-4">
          {report.architecture.sections.map((section, idx) => (
            <div key={idx} className="border-l-4 border-blue-300 pl-4">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-slate-900">{section.section}</p>
                <Badge variant={section.status === 'pass' ? 'default' : 'outline'}>
                  {section.status.toUpperCase()}
                </Badge>
              </div>
              <ul className="text-xs text-slate-600 mt-2 space-y-1">
                {(section.details || []).map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
              {section.summary && <p className="text-xs text-slate-600 mt-2 italic">{section.summary}</p>}
            </div>
          ))}
        </div>
      </Card>

      {/* Documentation Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Documentation Delivered</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Entities</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {report.documentation.entities.map((e, i) => <li key={i}>✓ {e}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Functions</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {report.documentation.functions.map((f, i) => <li key={i}>✓ {f}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-2">Components</p>
            <ul className="text-xs text-slate-600 space-y-1">
              {report.documentation.components.map((c, i) => <li key={i}>✓ {c}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      {/* Recommended Actions */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h2 className="text-lg font-semibold text-amber-900 mb-4">Recommended Actions</h2>
        <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
          {report.recommendedActions.map((action, idx) => (
            <li key={idx}>{action}</li>
          ))}
        </ol>
      </Card>

      {/* Footer */}
      <p className="text-xs text-slate-400 text-center pb-6">
        Nightwatch v0.11.0 · NW-UPGRADE-011 · {new Date(report.timestamp).toLocaleString()}
      </p>
    </div>
  );
}