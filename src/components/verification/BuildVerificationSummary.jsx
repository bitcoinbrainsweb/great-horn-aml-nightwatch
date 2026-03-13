import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BuildVerificationSummary({ result }) {
  if (!result) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-slate-500">
          No verification results available. Run verification to generate results.
        </CardContent>
      </Card>
    );
  }

  const { success, build_label, checks, warnings, violations, generated_at, artifact_publish_status } = result;

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card className={success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {success ? 'Build Verification Passed' : 'Build Verification Failed'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {build_label} — Generated {new Date(generated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Checks Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-slate-900">{checks?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-slate-900">{warnings?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-slate-900">{violations?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Artifact Publishing Status */}
      {artifact_publish_status && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canonical Artifact Publishing</CardTitle>
          </CardHeader>
          <CardContent>
            {artifact_publish_status.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Published successfully</span>
                </div>
                <div className="text-sm text-slate-600 space-y-1 ml-6">
                  <p><strong>Title:</strong> {artifact_publish_status.artifact_title}</p>
                  <p><strong>Artifact ID:</strong> {artifact_publish_status.artifact_id}</p>
                  <p><strong>Published:</strong> {new Date(artifact_publish_status.published_at).toLocaleString()}</p>
                  <p className="text-green-700 font-medium mt-2">
                    ✓ Artifact visible in ChangeLog → Verification tab
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium">Publishing failed</span>
                </div>
                {artifact_publish_status.error && (
                  <pre className="text-xs text-red-600 bg-red-50 p-3 rounded mt-2 overflow-x-auto">
                    {artifact_publish_status.error}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {checks && checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checks Passed ({checks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checks.map((check, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-900">[{check.category}]</span> {check.check}
                    {check.details && (
                      <p className="text-xs text-slate-500 mt-0.5">{check.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {warnings && warnings.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base text-amber-700">Warnings ({warnings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-900">[{warning.category}]</span> {warning.check}
                    {warning.details && (
                      <p className="text-xs text-slate-500 mt-0.5">{warning.details}</p>
                    )}
                    {warning.error && (
                      <p className="text-xs text-amber-600 mt-0.5">Error: {warning.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {violations && violations.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-700">Violations ({violations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {violations.map((violation, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-900">[{violation.category}]</span> {violation.check}
                    {violation.details && (
                      <p className="text-xs text-slate-500 mt-0.5">{violation.details}</p>
                    )}
                    {violation.error && (
                      <p className="text-xs text-red-600 mt-0.5">Error: {violation.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}