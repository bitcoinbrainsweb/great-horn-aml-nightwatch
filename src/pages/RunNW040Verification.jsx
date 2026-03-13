import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function RunNW040Verification() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function runVerification() {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('verifyEngagementAuditFoundation', {});
      setResult(response.data);
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
    a.download = 'NW-UPGRADE-040_RESULT.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="NW-UPGRADE-040 Verification Runner"
        subtitle="Execute verification and publish artifact"
      />

      <Card>
        <CardHeader>
          <CardTitle>Run Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runVerification} 
            disabled={running}
            className="gap-2"
          >
            {running && <Loader2 className="w-4 h-4 animate-spin" />}
            {running ? 'Running Verification...' : 'Run NW-UPGRADE-040 Verification'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Verification Failed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-red-800 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card className={result.success ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <CardTitle className={result.success ? "text-green-900" : "text-yellow-900"}>
                  Verification {result.success ? 'PASSED' : 'FAILED'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Total Checks</p>
                  <p className="font-bold text-lg">{result.summary?.total_checks || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Passed</p>
                  <p className="font-bold text-lg text-green-600">{result.summary?.passed_checks || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Warnings</p>
                  <p className="font-bold text-lg text-yellow-600">{result.summary?.warnings || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Violations</p>
                  <p className="font-bold text-lg text-red-600">{result.summary?.violations || 0}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Artifact Publishing</h3>
                {result.artifact_published ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Artifact published successfully</span>
                    </div>
                    {result.artifact_id && (
                      <p className="text-xs text-gray-600">Artifact ID: {result.artifact_id}</p>
                    )}
                    {result.artifact_title && (
                      <p className="text-xs text-gray-600">Title: {result.artifact_title}</p>
                    )}
                    {result.artifact_classification && (
                      <p className="text-xs text-gray-600">Classification: {result.artifact_classification}</p>
                    )}
                    {result.artifact_published_at && (
                      <p className="text-xs text-gray-600">Published: {result.artifact_published_at}</p>
                    )}
                    <p className="text-xs text-green-700 font-medium mt-2">
                      ✓ Artifact should now be visible in ChangeLog → Verification tab
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Artifact publishing failed</span>
                    </div>
                    {result.artifact_error && (
                      <pre className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2 whitespace-pre-wrap">
                        {result.artifact_error}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {result.results_markdown && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Results Document</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={downloadMarkdown}
                      className="gap-2"
                    >
                      <Download className="w-3 h-3" />
                      Download NW-UPGRADE-040_RESULT.md
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Results file path: {result.results_file_path}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Metadata</h3>
                <div className="text-xs space-y-1 text-gray-700">
                  <p><strong>Upgrade ID:</strong> {result.upgrade_id}</p>
                  <p><strong>Version:</strong> {result.product_version}</p>
                  <p><strong>Verified At:</strong> {result.verified_at}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.checks && result.checks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Passed Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.checks.filter(c => c.status === 'passed').map((check, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{check.check}</p>
                        <p className="text-xs text-gray-600">{check.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.violations && result.violations.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.violations.map((violation, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-900">{violation.check}</p>
                        <p className="text-xs text-red-700">{violation.issue}</p>
                        <p className="text-xs text-gray-500">Severity: {violation.severity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-900">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-900">{warning.check}</p>
                        <p className="text-xs text-yellow-700">{warning.issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Full Results (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-50 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}