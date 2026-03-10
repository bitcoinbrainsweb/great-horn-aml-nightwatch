import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ShieldCheck, Shield } from 'lucide-react';

/**
 * IntegrityPanel — Scans the engagement for integrity issues and displays alerts.
 * Also shows the integrity seal if the report is finalized.
 */
export default function IntegrityPanel({ engagement }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { runChecks(); }, [engagement.id]);

  async function runChecks() {
    const [risks, controls, reports] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
      base44.entities.ControlAssessment.filter({ engagement_id: engagement.id }),
      base44.entities.Report.filter({ engagement_id: engagement.id }),
    ]);

    const issues = [];
    const report = reports.sort((a, b) => (b.version || 1) - (a.version || 1))[0];

    for (const risk of risks) {
      const riskControls = controls.filter(c => c.engagement_risk_id === risk.id);
      const hasControls = riskControls.length > 0;
      const hasPresent = riskControls.some(c => c.control_present);

      // High residual risk with no controls present
      if (risk.residual_risk_rating === 'High' && !hasPresent) {
        issues.push({ level: 'error', message: `"${risk.risk_name}" is High residual risk with no controls marked present.` });
      }

      // Controls marked Strong but no evidence
      const strongNoEvidence = riskControls.filter(
        c => c.control_present && c.control_rating === 'Strong' && !c.evidence_reference && !c.testing_notes
      );
      if (strongNoEvidence.length > 0) {
        issues.push({ level: 'warn', message: `"${risk.risk_name}" has ${strongNoEvidence.length} control(s) rated Strong but with no evidence or testing notes.` });
      }

      // Incomplete risk scoring
      if (!risk.inherent_likelihood_score || !risk.inherent_impact_score) {
        issues.push({ level: 'warn', message: `"${risk.risk_name}" is missing likelihood or impact scoring.` });
      }

      // High residual risk with no recommendation
      if (risk.residual_risk_rating === 'High' && !risk.analyst_rationale) {
        issues.push({ level: 'warn', message: `"${risk.risk_name}" is High residual but has no analyst rationale or recommendation.` });
      }
    }

    // Report approved without reviewer assigned
    if (report?.status === 'Approved' && !engagement.assigned_reviewer) {
      issues.push({ level: 'error', message: 'Report is marked Approved but no reviewer is assigned to this engagement.' });
    }

    // Missing control testing for any present controls
    const missingTesting = controls.filter(
      c => c.control_present && (!c.testing_notes || !c.sample_size)
    );
    if (missingTesting.length > 2) {
      issues.push({ level: 'warn', message: `${missingTesting.length} present control(s) are missing testing notes or sample size.` });
    }

    setAlerts(issues);
    setLoading(false);
  }

  const seal = engagement.integrity_seal;
  const isLocked = engagement.is_locked;

  if (loading) return null;

  return (
    <div className="space-y-3">
      {/* Integrity Seal */}
      {seal && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isLocked ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          {isLocked
            ? <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            : <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
          }
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700">
              Integrity Seal: <span className="font-mono tracking-widest">{seal}</span>
            </p>
            <p className="text-[10px] text-slate-500">
              {isLocked ? 'Engagement is locked. Seal is valid.' : 'Engagement has been modified since finalization. Seal may be stale.'}
            </p>
          </div>
        </div>
      )}

      {/* Integrity Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-900">
              Nightwatch detected {alerts.length} potential integrity issue{alerts.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="divide-y divide-amber-100">
            {alerts.map((a, i) => (
              <div key={i} className="px-4 py-2.5 flex items-start gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${a.level === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <p className="text-xs text-slate-700">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}