import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ExecutionMetricsDashboard({ assessmentId }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [assessmentId]);

  async function loadMetrics() {
    setLoading(true);
    try {
      const query = assessmentId ? { assessmentId } : {};
      const data = await base44.entities.ExecutionMetric.filter(query);
      setMetrics(data || []);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-xs text-slate-500">Loading metrics...</p>;

  const totalTokens = metrics.reduce((sum, m) => sum + (m.promptTokens || 0) + (m.completionTokens || 0), 0);
  const cacheHits = metrics.filter(m => m.narrativeCacheHit).length;
  const cacheHitRate = metrics.length > 0 ? Math.round((cacheHits / metrics.length) * 100) : 0;
  const avgTime = metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + (m.executionTime || 0), 0) / metrics.length) : 0;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900">Execution Metrics</h3>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-600 font-semibold">Total Tokens</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{totalTokens.toLocaleString()}</p>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-semibold">Cache Hit Rate</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{cacheHitRate}%</p>
        </div>

        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <p className="text-xs text-purple-600 font-semibold">Avg Execution Time</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{avgTime}ms</p>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-600 font-semibold">Narratives Generated</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{metrics.length}</p>
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Prompt Tokens:</span>
            <span className="font-semibold">{metrics.reduce((sum, m) => sum + (m.promptTokens || 0), 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Completion Tokens:</span>
            <span className="font-semibold">{metrics.reduce((sum, m) => sum + (m.completionTokens || 0), 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Cache Hits:</span>
            <span className="font-semibold">{cacheHits} of {metrics.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}