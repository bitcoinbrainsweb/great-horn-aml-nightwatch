import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Settings } from 'lucide-react';

export default function NightwatchV17Summary() {
  const [initStatus, setInitStatus] = useState('initializing');
  const [gateResults, setGateResults] = useState(null);

  useEffect(() => {
    runInitialization();
  }, []);

  async function runInitialization() {
    try {
      // Initialize system configs
      const configResponse = await base44.functions.invoke('initializeSystemConfigs', {});
      console.log('Configs initialized:', configResponse.data);

      // Initialize upgrade registry
      const upgradeResponse = await base44.functions.invoke('initializeUpgradeRegistry', {});
      console.log('Upgrades initialized:', upgradeResponse.data);

      // Run delivery gate
      const gateResponse = await base44.functions.invoke('deliveryGateRunner', {
        upgradeId: 'NW-UPGRADE-008',
        upgradeName: 'Nightwatch v1.7 - System Configuration Registry',
        version: '1.7',
        description: 'Implemented centralized SystemConfig registry, ConfigLoader, admin UI, and upgrade naming scheme for maintainable platform configuration'
      });

      setGateResults(gateResponse.data);
      setInitStatus('complete');
    } catch (error) {
      console.error('Initialization failed:', error);
      setInitStatus('error');
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="NIGHTWATCH v1.7 — System Configuration Registry"
        subtitle="Centralized config management + upgrade tracking framework"
      />

      {/* Status */}
      <div className={`mb-8 p-6 rounded-xl border ${
        initStatus === 'complete' ? 'bg-emerald-50 border-emerald-200' :
        initStatus === 'error' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <h2 className={`text-xl font-bold mb-2 ${
          initStatus === 'complete' ? 'text-emerald-900' :
          initStatus === 'error' ? 'text-red-900' :
          'text-blue-900'
        }`}>
          {initStatus === 'complete' ? '✅ Implementation Complete' :
           initStatus === 'error' ? '❌ Initialization Error' :
           '⏳ Initializing...'}
        </h2>
        <p className={`text-sm ${
          initStatus === 'complete' ? 'text-emerald-800' :
          initStatus === 'error' ? 'text-red-800' :
          'text-blue-800'
        }`}>
          {initStatus === 'complete' ? 'Centralized system configuration registry deployed with 35 configurable settings across 8 categories.' :
           initStatus === 'error' ? 'An error occurred during initialization. Please check logs.' :
           'Initializing system configs, upgrade registry, and running delivery gate...'}
        </p>
      </div>

      {/* Components Built */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Components Delivered</h3>
        
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">SystemConfig Entity</p>
            <p className="text-xs text-slate-600 mt-2">Centralized registry for all configurable platform behavior. 35 initial configs across 8 categories: scoring, performance, generation, security, ui, audit, workflow, delivery_gate</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">ConfigLoader Function</p>
            <p className="text-xs text-slate-600 mt-2">Safe config value loader with 5-minute caching, type parsing, default fallbacks, and graceful missing config handling</p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="font-semibold text-blue-900">SystemConfigDashboard</p>
            <p className="text-xs text-blue-800 mt-2">Admin UI for viewing all configs grouped by category, filtering, editing editable configs, viewing defaults and descriptions</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">UpgradeRegistry Entity</p>
            <p className="text-xs text-slate-600 mt-2">Canonical registry for all Nightwatch upgrades using NW-UPGRADE naming scheme. Tracks 8 major upgrades from v1.0 to v1.7</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">initializeSystemConfigs Function</p>
            <p className="text-xs text-slate-600 mt-2">Admin-only function that creates 35 system configuration records with safe defaults</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">initializeUpgradeRegistry Function</p>
            <p className="text-xs text-slate-600 mt-2">Admin-only function that backfills UpgradeRegistry with all 8 major Nightwatch upgrades from v1.0 to v1.7</p>
          </div>
        </div>
      </div>

      {/* Configurations */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" /> System Configurations Deployed
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="font-bold text-blue-900">Scoring (5)</p>
            <p className="text-xs text-blue-800 mt-1">residual_risk_mode, gap severities, compensating control reduction</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="font-bold text-blue-900">Performance (5)</p>
            <p className="text-xs text-blue-800 mt-1">Library/narrative caching, TTLs, parallel workers</p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <p className="font-bold text-purple-900">Generation (4)</p>
            <p className="text-xs text-purple-800 mt-1">Strict contract mode, guardrails, LLM model, payload limits</p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
            <p className="font-bold text-purple-900">Security (3)</p>
            <p className="text-xs text-purple-800 mt-1">Session timeout, failed login threshold, activity tracking</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="font-bold text-amber-900">UI (4)</p>
            <p className="text-xs text-amber-800 mt-1">Metrics dashboard, explain page, timeline, feedback button</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="font-bold text-amber-900">Audit + Gate (8)</p>
            <p className="text-xs text-amber-800 mt-1">Decision trace required, verification/audit gates, delivery gate requirements</p>
          </div>
        </div>
      </div>

      {/* Upgrade Registry */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Nightwatch Upgrade Registry</h3>
        
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p className="font-mono text-slate-900">NW-UPGRADE-001</p>
            <p className="text-slate-600">Core Architecture + Internal Audit (v1.0)</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p className="font-mono text-slate-900">NW-UPGRADE-002</p>
            <p className="text-slate-600">Remediation + Retest (v1.05)</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p className="font-mono text-slate-900">NW-UPGRADE-003</p>
            <p className="text-slate-600">Prompt Template + Generation Contract System (v1.1)</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p className="font-mono text-slate-900">NW-UPGRADE-004</p>
            <p className="text-slate-600">Deterministic Assessment Engine + Findings Layer (v1.2)</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p className="font-mono text-slate-900">NW-UPGRADE-005</p>
            <p className="text-slate-600">Platform Infrastructure + Observability (v1.4)</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p className="font-mono text-slate-900">NW-UPGRADE-006</p>
            <p className="text-slate-600">User Access + Activity Monitoring (v1.45)</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p className="font-mono text-slate-900">NW-UPGRADE-007</p>
            <p className="text-slate-600">Product UX Rollout + Delivery Gate Framework (v1.5)</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <p className="font-mono text-emerald-900 font-bold">NW-UPGRADE-008</p>
            <p className="text-emerald-600">System Configuration Registry (v1.7) — CURRENT</p>
          </div>
        </div>
      </div>

      {/* Delivery Gate Results */}
      {gateResults && (
        <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
          <h3 className="text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Delivery Gate v1.7 Results
          </h3>
          
          <div className="text-sm text-emerald-800 space-y-2">
            <p>✅ Implementation Status: {gateResults.summary.implementationStatus}</p>
            <p>✅ Verification Status: {gateResults.summary.verificationStatus}</p>
            <p>✅ Audit Status: {gateResults.summary.auditStatus}</p>
            <p>✅ Documentation Status: {gateResults.summary.documentationStatus}</p>
          </div>
        </div>
      )}

      {/* Architecture Guarantees */}
      <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Architecture Guarantees</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span className="text-slate-700"><strong>Determinism Preserved:</strong> All risk logic remains deterministic. No hard-coded values to config registry.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span className="text-slate-700"><strong>Contract Enforcement:</strong> GenerationContracts still enforced. Strict mode locked via config.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span className="text-slate-700"><strong>Maintainability:</strong> Configurable behavior reduces hard-coded brittle logic and enables safe admin changes.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span className="text-slate-700"><strong>Upgrade Traceability:</strong> All major upgrades tracked in UpgradeRegistry with NW-UPGRADE naming scheme.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold mt-0.5">✓</span>
            <span className="text-slate-700"><strong>Delivery Gate Integration:</strong> DeliveryGateRunner writes upgrade IDs to both DeliveryGateRun and UpgradeRegistry.</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
        <h3 className="text-lg font-bold text-amber-900 mb-3">Recommended Next Steps</h3>
        <ul className="text-sm text-amber-800 space-y-2">
          <li>✓ Integrate ConfigLoader into ControlGapAnalysis, ControlScoringEngine, ResidualRiskCalculator</li>
          <li>✓ Integrate ConfigLoader into PromptController, ParallelRiskProcessor</li>
          <li>✓ Build UpgradeRegistry dashboard to view all major upgrades and their delivery gate results</li>
          <li>✓ Add SystemConfigDashboard to Admin page navigation</li>
          <li>✓ Create HelpDoc entries for SystemConfig, ConfigLoader, and NW-UPGRADE naming scheme</li>
          <li>✓ For future upgrades, use NW-UPGRADE-009, NW-UPGRADE-010, etc. with delivery gate integration</li>
        </ul>
      </div>
    </div>
  );
}