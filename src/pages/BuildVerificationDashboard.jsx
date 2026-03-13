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
        subtitle="Automated verification of latest Nightwatch build"
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
          <CardTitle className="text-base">About Build Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>
            This dashboard runs automated verification checks on the Nightwatch build to ensure
            critical entities, pages, routes, and canonical artifact publishing are functioning correctly.
          </p>
          <p className="font-medium text-slate-900">Verification Categories:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Entity schema validation (required entities and fields)</li>
            <li>Page smoke tests (critical pages exist and export correctly)</li>
            <li>Routing configuration (all pages have routes in App.jsx)</li>
            <li>Canonical artifact publishing (verification records can be created)</li>
            <li>ChangeLog health (verification records are queryable)</li>
            <li>Permissions regression (admin-only functions have proper guards)</li>
          </ul>
          <p className="pt-2">
            <strong>Next steps for full automation:</strong> GitHub webhook integration, branch/commit
            metadata capture, automated run on deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}