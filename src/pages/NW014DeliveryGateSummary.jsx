import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NW014DeliveryGateSummary() {
  const [upgrade, setUpgrade] = useState(null);
  const [verification, setVerification] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const upgrades = await base44.entities.UpgradeRegistry.filter({
        upgrade_id: 'NW-UPGRADE-014'
      });
      if (upgrades.length > 0) {
        setUpgrade(upgrades[0]);
        if (upgrades[0].verification_record_id) {
          const verifyRecords = await base44.entities.PublishedOutput.filter({
            id: upgrades[0].verification_record_id
          });
          if (verifyRecords.length > 0) setVerification(verifyRecords[0]);
        }
      }

      const logs = await base44.entities.UpgradeAuditLog.filter({
        upgrade_id: 'NW-UPGRADE-014'
      });
      setAuditLog(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  const deliveryGates = upgrade?.delivery_gate_results ? JSON.parse(upgrade.delivery_gate_results) : {};
  const allPassed = Object.values(deliveryGates).every(t => t.status === 'pass');

  return (
    <div className="space-y-8">
      <PageHeader
        title="NW-UPGRADE-014 Delivery Gate"
        subtitle="Change Control Architecture Redesign — Deterministic Lifecycle Logic"
      />

      {/* Status Overview */}
      <Card className="border-2 border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allPassed ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                Delivery Gate: PASSED
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-red-600" />
                Delivery Gate: FAILED
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
              <p className="text-lg font-bold text-slate-900">{upgrade?.status || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Delivery Gate</p>
              <p className="text-lg font-bold text-emerald-700">{upgrade?.delivery_gate_status || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Tests Passed</p>
              <p className="text-lg font-bold text-slate-900">{Object.values(deliveryGates).filter(t => t.status === 'pass').length}/{Object.keys(deliveryGates).length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Verification Record</p>
              <p className="text-lg font-bold text-slate-900">{verification ? '✓' : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Gate Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Gate Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(deliveryGates).map(([key, result]) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="mt-1">
                  {result.status === 'pass' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-600 mt-1">{result.evidence}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  result.status === 'pass'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Architectural Changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-slate-900 mb-2">New Entities</h4>
            <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">UpgradeRegistry</code> — Canonical upgrade lifecycle tracking</li>
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">ProductVersionRegistry</code> — Version-to-upgrade mapping</li>
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">UpgradeAuditLog</code> — Upgrade action audit trail</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900 mb-2">Generic Lifecycle Functions</h4>
            <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">initializeUpgrade</code> — Register new upgrade</li>
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">runDeliveryGateChecks</code> — Execute gate validations</li>
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">publishVerificationRecord</code> — Auto-generate verification artifacts</li>
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">completeUpgrade</code> — Orchestrate full completion flow</li>
              <li><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">backfillHistoricalUpgrades</code> — Bootstrap prior upgrades</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900 mb-2">Manual Publication Pages Eliminated</h4>
            <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
              <li>✓ Removed dependency on user visiting PublishNW013, PublishNW014, etc.</li>
              <li>✓ Verification records now auto-generated by backend lifecycle logic</li>
              <li>✓ No per-upgrade publication functions (e.g., publishNW013VerificationRecord)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Verification Record */}
      {verification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Auto-Generated Verification Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Record Name</p>
                <p className="font-mono text-xs text-slate-900">{verification.outputName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Classification</p>
                <p className="font-mono text-xs text-slate-900">{verification.classification}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                <p className="font-mono text-xs text-slate-900">{verification.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Generated By</p>
                <p className="font-mono text-xs text-slate-900">{verification.source_module}</p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              <strong>✓ This verification record was auto-generated</strong> by the <code className="bg-amber-100 px-1 rounded">completeUpgrade</code> function. No page visit was required.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {auditLog.map(log => (
              <div key={log.id} className="flex gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex-shrink-0 w-2 h-2 bg-slate-400 rounded-full mt-1.5" />
                <div className="flex-1">
                  <p className="font-mono text-xs text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-600">{log.triggering_function} • {log.actor}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-xs font-mono text-slate-600 flex-shrink-0">
                  {log.prior_status} → {log.new_status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card className="border-slate-300 bg-slate-50/50">
        <CardHeader>
          <CardTitle>Implementation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>Manual Publication Page Dependency Eliminated:</strong> Previously, verification records depended on manual page visits (e.g., PublishNW013.js). This architecture is now obsolete.
          </p>
          <p>
            <strong>Deterministic Backend Lifecycle:</strong> Upgrade completion is now orchestrated through backend functions (completeUpgrade) which automatically:
          </p>
          <ol className="ml-4 space-y-1 list-decimal">
            <li>Run delivery gate checks</li>
            <li>Create/update verification records with lifecycle-generated metadata</li>
            <li>Update UpgradeRegistry with final state</li>
            <li>Log all actions to UpgradeAuditLog</li>
          </ol>
          <p>
            <strong>Artifact Isolation:</strong> Verification records are classified as <code className="bg-white px-1.5 py-0.5 rounded text-xs border border-slate-300">verification_record</code> and excluded from Reports.js (which filters for <code className="bg-white px-1.5 py-0.5 rounded text-xs border border-slate-300">classification: 'report'</code> only).
          </p>
          <p>
            <strong>Historical Backfill:</strong> 11 prior upgrades (NW-UPGRADE-001 through NW-UPGRADE-013) have been registered in UpgradeRegistry with completed status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}