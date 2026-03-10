import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart3 } from 'lucide-react';

export default function ControlConfidenceSummaryPanel({ controlId, assessmentId }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessment();
  }, [controlId, assessmentId]);

  async function loadAssessment() {
    setLoading(true);
    try {
      const records = await base44.entities.ControlEvidenceAssessment.filter({
        controlId,
        assessmentId
      });
      if (records && records.length > 0) {
        // Get most recent assessment
        setAssessment(records[0]);
      }
    } catch (error) {
      console.error('Failed to load assessment:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading assessment...</p>;
  }

  if (!assessment) {
    return <p className="text-sm text-slate-500">No assessment available. Run evaluator to generate.</p>;
  }

  const sufficiencyColors = {
    missing: 'bg-red-50 border-red-200 text-red-900',
    partial: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    sufficient: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    stale: 'bg-orange-50 border-orange-200 text-orange-900'
  };

  const confidenceLevel = (score) => {
    if (score >= 80) return { label: 'High', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (score >= 60) return { label: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-100' };
    if (score >= 40) return { label: 'Low', color: 'text-orange-700', bg: 'bg-orange-100' };
    return { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100' };
  };

  const confLevel = confidenceLevel(assessment.combinedControlConfidence);

  return (
    <div className={`p-6 rounded-xl border ${sufficiencyColors[assessment.evidenceSufficiency]}`}>
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-5 h-5" />
        <h3 className="text-lg font-bold">Control Confidence Assessment</h3>
      </div>

      <div className="space-y-4">
        {/* Overall Confidence Score */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${confLevel.color}`}>
              {assessment.combinedControlConfidence}%
            </div>
            <p className={`text-sm font-semibold mt-1 ${confLevel.color}`}>
              {confLevel.label}
            </p>
          </div>
          <div className="flex-1">
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  assessment.combinedControlConfidence >= 80 ? 'bg-emerald-500' :
                  assessment.combinedControlConfidence >= 60 ? 'bg-amber-500' :
                  assessment.combinedControlConfidence >= 40 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${assessment.combinedControlConfidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Components */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
            <p className="text-xs font-semibold opacity-70 mb-1">Evidence Completeness</p>
            <p className="text-2xl font-bold">{assessment.evidenceCompletenessScore}%</p>
          </div>

          <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
            <p className="text-xs font-semibold opacity-70 mb-1">Staleness Impact</p>
            <p className="text-2xl font-bold">-{assessment.stalenessImpact}%</p>
          </div>

          <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
            <p className="text-xs font-semibold opacity-70 mb-1">Testing Impact</p>
            <p className="text-2xl font-bold">+{assessment.testingImpact}%</p>
          </div>
        </div>

        {/* Sufficiency Status */}
        <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-70 mb-2">Evidence Sufficiency</p>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              assessment.evidenceSufficiency === 'missing' ? 'bg-red-200 text-red-700' :
              assessment.evidenceSufficiency === 'partial' ? 'bg-yellow-200 text-yellow-700' :
              assessment.evidenceSufficiency === 'stale' ? 'bg-orange-200 text-orange-700' :
              'bg-emerald-200 text-emerald-700'
            }`}>
              {assessment.evidenceSufficiency}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
          <p className="text-xs font-semibold opacity-70 mb-2">Assessment Summary</p>
          <p className="text-sm leading-relaxed">{assessment.summary}</p>
          <p className="text-xs opacity-60 mt-2">
            Calculated {new Date(assessment.calculatedAt).toLocaleString()}
          </p>
        </div>

        {/* Control Effectiveness Impact */}
        <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm border-t-2 border-white/50">
          <p className="text-xs font-semibold opacity-70 mb-2">Impact on Control Effectiveness</p>
          <p className="text-sm leading-relaxed">
            {assessment.combinedControlConfidence >= 80 
              ? '✅ Strong evidence and testing support high control effectiveness.' 
              : assessment.combinedControlConfidence >= 60 
              ? '⚠️ Moderate confidence in control effectiveness; additional evidence or testing recommended.' 
              : assessment.combinedControlConfidence >= 40 
              ? '🔶 Low confidence in control effectiveness; significant evidence/testing gaps require attention.' 
              : '❌ Critical gaps in evidence/testing; control effectiveness cannot be assured.'}
          </p>
        </div>
      </div>
    </div>
  );
}