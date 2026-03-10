import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function BaselineApprovalPanel({ runId, scenarioId }) {
  const [testRun, setTestRun] = useState(null);
  const [notes, setNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (runId) loadTestRun();
  }, [runId]);

  async function loadTestRun() {
    try {
      const runs = await base44.entities.TestAssessmentRun.filter({ runId });
      if (runs?.length > 0) {
        setTestRun(runs[0]);
      }
    } catch (error) {
      console.error('Failed to load test run:', error);
    }
  }

  async function approveBaseline() {
    try {
      setApproving(true);
      const result = await base44.functions.invoke('approveScenarioBaseline', {
        testRunId: runId,
        scenarioId: scenarioId || testRun?.scenarioId,
        notes
      });
      if (result.data?.success) {
        setApproved(true);
        alert('Baseline approved successfully');
      }
    } catch (error) {
      alert(`Error approving baseline: ${error.message}`);
    } finally {
      setApproving(false);
    }
  }

  if (!testRun) return <p className="text-xs text-slate-500">Loading test run...</p>;

  return (
    <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
      <h3 className="font-semibold text-slate-900">Approve as Baseline</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <p className="text-slate-500">Status: {testRun.status}</p>
          <p className="text-slate-500">Gap Count: {testRun.actualGapCount}</p>
          <p className="text-slate-500">Residual Risk: {testRun.actualResidualRisk}</p>
        </div>
      </div>

      <textarea
        placeholder="Approval notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full p-2 border border-slate-200 rounded text-xs"
        rows="3"
      />

      {!approved ? (
        <Button
          onClick={approveBaseline}
          disabled={approving}
          className="w-full gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Approve as Baseline
        </Button>
      ) : (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
          ✅ Baseline approved successfully
        </div>
      )}
    </div>
  );
}