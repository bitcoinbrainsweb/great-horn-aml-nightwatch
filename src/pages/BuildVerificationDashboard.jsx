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

  // Auto-run verification on first load if no recent result exists
  useEffect(() => {
    if (!autoRanOnLoad && !loadingArtifact && !latestArtifact && !running) {
      setAutoRanOnLoad(true);
      runVerification();
    }
  }, [autoRanOnLoad, loadingArtifact, latestArtifact, running]);

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

      {/* Latest Artifact Info */}
      {latestArtifact && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Verification Artifact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
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
                <span className="font-medium text-slate-700">Upgrade ID:</span>{' '}
                <span className="text-slate-600">{latestArtifact.upgrade_id}</span>
              </div>
              <p className="text-xs text-slate-500 pt-2">
                ✓ Visible in ChangeLog → Verification tab
              </p>
            </div>
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
      {result && <BuildVerificationSummary result={result} />}

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
            <li>Build health contracts (latest verification runs are accessible)</li>
          </ul>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3">
            <p className="font-medium text-slate-900 mb-1">What Changed:</p>
            <p className="text-xs text-slate-600 mb-2">
              <strong>NW-UPGRADE-042:</strong> Removed file checks, added runtime contract verification
            </p>
            <p className="text-xs text-slate-600">
              <strong>NW-UPGRADE-043:</strong> Created VerificationContractRegistry to centralize contract definitions and improve maintainability
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