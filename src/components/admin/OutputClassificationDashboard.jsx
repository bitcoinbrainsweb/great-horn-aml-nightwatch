import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export default function OutputClassificationDashboard() {
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOutputs();
  }, []);

  async function loadOutputs() {
    try {
      const all = await base44.entities.OutputRegistryItem.list();
      setOutputs(all.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
    } catch (error) {
      console.error('Failed to load outputs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runNormalization() {
    setLoading(true);
    try {
      await base44.functions.invoke('NormalizeOutputClassification', {});
      await loadOutputs();
    } catch (error) {
      console.error('Normalization failed:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = outputs.filter(o => {
    if (filter === 'misclassified') return o.status === 'misclassified';
    if (filter === 'report') return o.outputClass === 'report';
    if (filter === 'documentation') return o.outputClass === 'documentation';
    if (filter === 'tool') return o.outputClass === 'tool';
    return true;
  });

  const stats = {
    total: outputs.length,
    reports: outputs.filter(o => o.outputClass === 'report').length,
    docs: outputs.filter(o => o.outputClass === 'documentation').length,
    tools: outputs.filter(o => o.outputClass === 'tool').length,
    misclassified: outputs.filter(o => o.status === 'misclassified').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Output Classification Dashboard</h1>
        <Button onClick={runNormalization} disabled={loading} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Normalize Classification
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Card className="p-4 bg-slate-50 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-600 mt-1">Total Items</p>
        </Card>
        <Card className="p-4 bg-blue-50 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.reports}</p>
          <p className="text-xs text-blue-600 mt-1">Reports</p>
        </Card>
        <Card className="p-4 bg-green-50 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.docs}</p>
          <p className="text-xs text-green-600 mt-1">Docs/Help</p>
        </Card>
        <Card className="p-4 bg-purple-50 text-center">
          <p className="text-2xl font-bold text-purple-700">{stats.tools}</p>
          <p className="text-xs text-purple-600 mt-1">Tools</p>
        </Card>
        <Card className={`p-4 text-center ${stats.misclassified > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <p className={`text-2xl font-bold ${stats.misclassified > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{stats.misclassified}</p>
          <p className={`text-xs mt-1 ${stats.misclassified > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Misclassified</p>
        </Card>
      </div>

      <div className="flex gap-2">
        {['all', 'report', 'documentation', 'tool', 'misclassified'].map(f => (
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
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-8"><p className="text-slate-500">No items found.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(o => (
            <Card key={o.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{o.title}</h3>
                  <p className="text-xs text-slate-600">{o.upgradeId} · v{o.productVersion}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={o.outputClass === 'report' ? 'default' : o.outputClass === 'documentation' ? 'secondary' : 'outline'}>
                    {o.outputClass}
                  </Badge>
                  <Badge variant={o.status === 'published' ? 'default' : 'warning'}>
                    {o.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {o.visibleInReports && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">In Reports</span>}
                {o.visibleInDocs && <span className="px-2 py-1 bg-green-50 text-green-700 rounded">In Docs</span>}
                {o.visibleInHelp && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">In Help</span>}
                {o.visibleInAdminTools && <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">In AdminTools</span>}
              </div>
              {o.legacyClassification && (
                <p className="text-xs text-slate-500 mt-2">Legacy: {o.legacyClassification}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}