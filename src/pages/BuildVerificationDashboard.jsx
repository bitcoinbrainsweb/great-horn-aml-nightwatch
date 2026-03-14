import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, PlayCircle, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import BuildVerificationSummary from '@/components/verification/BuildVerificationSummary';
import { useQuery } from '@tanstack/react-query';

export default function BuildVerificationDashboard() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [autoRanOnLoad, setAutoRanOnLoad] = useState(false);
  const [autoRunTriggered, setAutoRunTriggered] = useState(false);
  const [autoRunReason, setAutoRunReason] = useState('');

  // Resolve current build identity dynamically from UpgradeRegistry (NW-UPGRADE-045A)
  const { data: currentBuildLabel, isLoading: loadingBuildLabel } = useQuery({
    queryKey: ['currentBuildIdentity'],
    queryFn: async () => {
      try {
        const entries = await base44.entities.UpgradeRegistry.list('-created_date', 1);
        if (entries.length > 0 && entries[0].upgrade_id) {
          return entries[0].upgrade_id;
        }
      } catch { /* fall through */ }
      return 'UNKNOWN';
    }
  });

  // Fetch latest verification artifact from canonical store
  const { data: latestArtifact, isLoading: loadingArtifact, refetch: refetchArtifact } = useQuery({
    queryKey: ['latestBuildVerification'],
    queryFn: async () => {
      const records = await base44.entities.PublishedOutput.filter(
        { 
          classification: 'verification_record',
          subtype: 'build_verification'
        },
        '-published_at',
        1
      );
      return records.length > 0 ? records[0] : null;
    }
  });

  // Auto-run verification when current build differs from latest verified build (NW-UPGRADE-045A)
  // Replaces the previous hardcoded label comparison.
  useEffect(() => {
    if (autoRanOnLoad || loadingArtifact || loadingBuildLabel || running || !currentBuildLabel) return;
    setAutoRanOnLoad(true);

    const latestVerifiedBuild = latestArtifact?.upgrade_id || null;

    if (!latestVerifiedBuild) {
      setAutoRunTriggered(true);
      setAutoRunReason('No verification artifacts found');
      runVerification();
    } else if (latestVerifiedBuild !== currentBuildLabel) {
      setAutoRunTriggered(true);
      setAutoRunReason(`Current build (${currentBuildLabel}) ≠ Latest verified (${latestVerifiedBuild})`);
      runVerification();
    } else {
      setAutoRunReason(`Current build (${currentBuildLabel}) already verified`);
    }
  }, [autoRanOnLoad, loadingArtifact, loadingBuildLabel, currentBuildLabel, latestArtifact, running]);

  async function runVerification() {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('verifyLatestBuild', {});
      setResult(response.data);
      await refetchArtifact();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  function downloadMarkdown() {
    if (!result || !result.results_markdown) return;
    
    const blob = new Blob([result.results_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.build_label}_AUTORESULT.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Build Verification Dashboard" 
        subtitle="Runtime contract verification of latest Nightwatch build"
      >
        <div className="flex gap-2">
          {result && result.results_markdown && (
            <Button 
              variant="outline" 
              onClick={downloadMarkdown}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Results
            </Button>
          )}
          <Button 
            onClick={runVerification}
            disabled={running}
            className="gap-2"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Run Verification
              </>
            )}
          </Button>
        </div>
      </PageHeader>

      {/* Build Identity Status */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">Current Build:</span>{' '}
              <span className="text-slate-900 font-mono">{loadingBuildLabel ? '...' : currentBuildLabel}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Latest Verified:</span>{' '}
              <span className="text-slate-900 font-mono">{latestArtifact?.upgrade_id || 'None'}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Auto-Run:</span>{' '}
              <span className={`text-xs font-semibold ${autoRunTriggered ? 'text-amber-700' : 'text-green-700'}`}>
                {autoRunTriggered ? '⚡ Triggered' : '✓ Skipped'} — {autoRunReason}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Artifact Info */}
      {latestArtifact && !result && (
        <Card className={autoRunTriggered ? 'border-amber-200 bg-amber-50' : ''}>
          <CardHeader>
            <CardTitle className="text-base">
              {autoRunTriggered ? 'Auto-Run Triggered' : 'Latest Verification Artifact'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {autoRunTriggered && (
                <div className="mb-3 p-2 bg-amber-100 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-900 font-medium">
                    ⚡ {autoRunReason}. Auto-running verification now...
                  </p>
                </div>
              )}
              <div>
                <span className="font-medium text-slate-700">Title:</span>{' '}
                <span className="text-slate-600">{latestArtifact.outputName}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Published:</span>{' '}
                <span className="text-slate-600">
                  {new Date(latestArtifact.published_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Verified Build:</span>{' '}
                <span className="text-slate-600 font-mono">{latestArtifact.upgrade_id}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Match Status:</span>{' '}
                <span className={`text-xs font-semibold ${
                  latestArtifact.upgrade_id === currentBuildLabel
                    ? 'text-green-700'
                    : 'text-amber-700'
                }`}>
                  {latestArtifact.upgrade_id === currentBuildLabel
                    ? '✓ Current build verified'
                    : '⚠ Build mismatch detected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 pt-2">
                ✓ Visible in ChangeLog → Verification tab
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Artifact + Auto-Run Info */}
      {!latestArtifact && !result && !running && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">First Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              No verification artifacts found. Auto-run triggered: {autoRunReason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-700">Verification Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {running && !result && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Running verification checks...</p>
          </CardContent>
        </Card>
      )}

      {/* Verification Results */}
      {result && (
        <>
          {result.contract_registry && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Verification Contracts Loaded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{result.contract_registry.total}</div>
                    <div className="text-xs text-slate-600 mt-1">Total Contracts</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{result.contract_registry.entityContracts}</div>
                    <div className="text-xs text-blue-600 mt-1">Entity Contracts</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">{result.contract_registry.routeContracts}</div>
                    <div className="text-xs text-green-600 mt-1">Route Contracts</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-900">{result.contract_registry.artifactContracts}</div>
                    <div className="text-xs text-amber-600 mt-1">Artifact Contracts</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">{result.contract_registry.permissionContracts}</div>
                    <div className="text-xs text-purple-600 mt-1">Permission Contracts</div>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-900">{result.contract_registry.graphContracts || 0}</div>
                    <div className="text-xs text-teal-600 mt-1">Graph Contracts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Graph Contracts Summary */}
          {result && result.contract_registry && result.contract_registry.graphContracts > 0 && (
            <Card className="mb-6 border-teal-200">
              <CardHeader>
                <CardTitle className="text-base text-teal-900">Compliance Graph Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600">
                    The core compliance graph has been verified. {result.contract_registry.graphContracts} graph contracts checked:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-slate-600">
                    <li>Risk → Control linkage</li>
                    <li>Control → Test linkage</li>
                    <li>Test → Evidence linkage</li>
                    <li>Test → Observation linkage</li>
                    <li>Observation → Remediation linkage</li>
                    <li>Snapshot integrity (engagement + control context)</li>
                    <li>Shared-object integrity (ControlLibrary, EvidenceItem, Observation, RemediationAction)</li>
                  </ul>
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    {result.violations.filter(v => v.category === 'Graph Contract').length === 0 ? (
                      <p className="text-teal-900 font-medium">
                        ✓ Compliance graph is intact. All critical linkages are functioning.
                      </p>
                    ) : (
                      <p className="text-red-900 font-medium">
                        ⚠ Graph violations detected. Review failed contracts below.
                      </p>
                    )}
                    {result.warnings.filter(w => w.category === 'Graph Contract').length > 0 && (
                      <p className="text-amber-700 text-xs mt-1">
                        {result.warnings.filter(w => w.category === 'Graph Contract').length} graph warning(s) detected
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <BuildVerificationSummary result={result} />
        </>
      )}

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Runtime Contract Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="font-semibold text-blue-900 mb-1">Verification Mode: Runtime Contract Verification (Registry-Based)</p>
            <p className="text-xs text-blue-700">
              This system uses a VerificationContractRegistry to define and execute runtime contract checks.
              Contracts are loaded from a central registry, making the system more stable and maintainable.
            </p>
          </div>
          
          <p>
            This dashboard runs automated runtime contract checks to verify that Nightwatch's core systems
            are functioning correctly in the actual Base44 runtime environment.
          </p>
          
          <p className="font-medium text-slate-900">Verification Categories:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Entity runtime contracts (can query, filter, and read expected fields)</li>
            <li>Route/page contracts (data dependencies are accessible)</li>
            <li>Canonical artifact contracts (can create, query, and read verification records)</li>
            <li>Permissions contracts (admin enforcement active in runtime)</li>
            <li>Graph contracts (compliance graph linkages and shared-object integrity)</li>
            <li>Build health contracts (latest verification runs are accessible)</li>
          </ul>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3">
            <p className="font-medium text-slate-900 mb-1">What Changed:</p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-042:</strong> Removed file checks, added runtime contract verification
            </p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-043:</strong> Created VerificationContractRegistry to centralize contract definitions and improve maintainability
            </p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-044:</strong> Added Graph Contracts to verify compliance graph integrity (Risk→Control→Test→Evidence→Observation→Remediation linkages)
            </p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-045:</strong> Added admin-only sidebar navigation + auto-run verification on deployment
            </p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-045A:</strong> Fixed auto-run logic to check build identity instead of time-based recency (current build vs. latest verified build comparison)
            </p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-046A:</strong> Added 5 verification contracts for Evidence & Control Testing Framework
            </p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-046B:</strong> Added explicit delivery gate metrics tracking
            </p>
            <p className="text-xs text-slate-600">
              <strong>NW-UPGRADE-047:</strong> Test Template System + Build Identity Hardening (TestTemplate entity, template references, unified build identity source)
            </p>
          </div>
          
          <p className="pt-2">
            <strong>Next steps for full automation:</strong> GitHub webhook integration, branch/commit
            metadata capture, automated run on deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}