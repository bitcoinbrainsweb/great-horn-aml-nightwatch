import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Play, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegressionRunDashboard() {
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTestSuites();
  }, []);

  async function loadTestSuites() {
    try {
      setLoading(true);
      const data = await base44.entities.RegressionTestSuite.list('-completedAt', 10);
      setSuites(data || []);
    } catch (error) {
      console.error('Failed to load test suites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runFullSuite() {
    try {
      setLoading(true);
      const result = await base44.functions.invoke('runAllRegressionTests', {});
      alert(`Test suite executed: ${result.data?.summary}`);
      await loadTestSuites();
    } catch (error) {
      alert(`Error running test suite: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Regression Test Suites</h2>
        <Button onClick={runFullSuite} disabled={loading} className="gap-2">
          <Play className="w-4 h-4" /> Run Full Suite
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading test suites...</p>
        ) : suites.length === 0 ? (
          <p className="text-sm text-slate-400">No test suites run yet</p>
        ) : (
          suites.map(suite => (
            <div key={suite.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{suite.suiteName}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(suite.completedAt).toLocaleString()} · v{suite.engineVersion}
                  </p>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div className="p-2 rounded bg-slate-50">
                      <p className="text-2xl font-bold text-slate-900">{suite.totalScenarios}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Total</p>
                    </div>
                    <div className="p-2 rounded bg-emerald-50">
                      <p className="text-2xl font-bold text-emerald-700">{suite.passedCount}</p>
                      <p className="text-[10px] text-emerald-600 uppercase">Passed</p>
                    </div>
                    <div className={`p-2 rounded ${suite.failedCount > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                      <p className={`text-2xl font-bold ${suite.failedCount > 0 ? 'text-red-700' : 'text-slate-600'}`}>{suite.failedCount}</p>
                      <p className={`text-[10px] ${suite.failedCount > 0 ? 'text-red-600' : 'text-slate-500'} uppercase`}>Failed</p>
                    </div>
                    <div className={`p-2 rounded ${suite.releaseReadiness === 'blocked' ? 'bg-red-100' : 'bg-amber-50'}`}>
                      <p className={`text-xs font-bold uppercase ${suite.releaseReadiness === 'blocked' ? 'text-red-700' : 'text-amber-700'}`}>
                        {suite.releaseReadiness}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {suite.releaseReadiness === 'ready' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}