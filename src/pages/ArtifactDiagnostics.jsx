import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/PageHeader';
import { FileCheck, Database, TestTube, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function ArtifactDiagnostics() {
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.role !== 'admin') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      await loadDiagnostics();
    } catch (error) {
      console.error('Auth error:', error);
      setAccessDenied(true);
      setLoading(false);
    }
  }

  async function loadDiagnostics() {
    setLoading(true);
    try {
      // Load all PublishedOutput records
      const allRecords = await base44.entities.PublishedOutput.filter({});

      // Count by classification
      const classificationCounts = {};
      allRecords.forEach(r => {
        const cls = r.classification || 'unclassified';
        classificationCounts[cls] = (classificationCounts[cls] || 0) + 1;
      });

      // ChangeLog filter simulation
      const publishedRecords = allRecords.filter(r => r.status === 'published');
      const changelogRecords = publishedRecords.filter(r => 
        ['verification_record', 'audit_record', 'delivery_gate_record'].includes(r.classification)
      );

      // Recent artifacts (latest 10)
      const recent = [...changelogRecords]
        .sort((a, b) => new Date(b.published_at || b.created_date) - new Date(a.published_at || a.created_date))
        .slice(0, 10);

      setDiagnostics({
        source: {
          entity: 'PublishedOutput',
          query: "filter({ status: 'published' })",
          classificationFilter: "['verification_record', 'audit_record', 'delivery_gate_record']",
          listFields: ['outputName', 'upgrade_id', 'published_at', 'classification', 'status'],
          expansionField: 'content (JSON string)'
        },
        counts: {
          total: allRecords.length,
          published: publishedRecords.length,
          changelogVisible: changelogRecords.length,
          byClassification: classificationCounts
        },
        recent: recent
      });
    } catch (error) {
      console.error('Diagnostics load error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createTestArtifact() {
    setTesting(true);
    setTestResult(null);

    try {
      const timestamp = new Date().toISOString();
      const artifactName = `Nightwatch_VerificationRecord_ArtifactDiagnosticTest_v0.6.0_NW-UPGRADE-021A_${timestamp.split('T')[0]}`;

      const testContent = {
        upgrade_metadata: {
          upgrade_id: 'NW-UPGRADE-021A',
          prompt_id: 'NW-UPGRADE-021A-PROMPT-001',
          product_version: 'v0.6.0',
          timestamp: timestamp,
          actor: user.email,
          source: 'Artifact Diagnostics Test Writer'
        },
        diagnostic_info: {
          source_entity: 'PublishedOutput',
          write_method: 'Direct synchronous write via base44.entities.PublishedOutput.create()',
          changelog_query: "filter({ status: 'published' }) + classification filter",
          purpose: 'Verify artifact storage and ChangeLog visibility path'
        },
        test_results: {
          direct_write_attempted: true,
          timestamp: timestamp
        }
      };

      // DIRECT WRITE: Create PublishedOutput record
      console.log('[ArtifactDiagnostics] Creating test verification record...');
      const artifact = await base44.entities.PublishedOutput.create({
        outputName: artifactName,
        classification: 'verification_record',
        subtype: 'diagnostic_test',
        is_runnable: false,
        is_user_visible: false,
        display_zone: 'internal_only',
        source_module: 'ArtifactDiagnostics',
        source_event_type: 'diagnostic_test',
        product_version: 'v0.6.0',
        upgrade_id: 'NW-UPGRADE-021A',
        status: 'published',
        published_at: timestamp,
        content: JSON.stringify(testContent),
        summary: 'Artifact Diagnostics Test Record',
        metadata: JSON.stringify({
          prompt_id: 'NW-UPGRADE-021A-PROMPT-001',
          generated_by: 'ArtifactDiagnostics',
          test_artifact: true
        })
      });

      console.log('[ArtifactDiagnostics] Test artifact created:', artifact.id);

      // POST-WRITE VERIFICATION
      const checks = {
        artifact_exists: false,
        classification_correct: false,
        status_published: false,
        changelog_query_match: false,
        content_readable: false
      };

      // Check 1: Artifact exists
      const readBack = await base44.entities.PublishedOutput.filter({ id: artifact.id });
      if (readBack && readBack.length === 1) {
        checks.artifact_exists = true;
        const retrieved = readBack[0];

        // Check 2: Classification
        if (retrieved.classification === 'verification_record') {
          checks.classification_correct = true;
        }

        // Check 3: Status
        if (retrieved.status === 'published') {
          checks.status_published = true;
        }

        // Check 4: Content readable
        if (retrieved.content) {
          try {
            JSON.parse(retrieved.content);
            checks.content_readable = true;
          } catch (e) {
            console.error('Content parse error:', e);
          }
        }
      }

      // Check 5: ChangeLog query match
      const changelogQuery = await base44.entities.PublishedOutput.filter({
        status: 'published',
        classification: 'verification_record'
      });

      if (changelogQuery.find(r => r.id === artifact.id)) {
        checks.changelog_query_match = true;
      }

      const allPassed = Object.values(checks).every(v => v === true);

      setTestResult({
        success: allPassed,
        artifact_id: artifact.id,
        artifact_name: artifactName,
        timestamp: timestamp,
        checks: checks,
        message: allPassed 
          ? 'Test artifact created successfully and confirmed visible in ChangeLog' 
          : 'Test artifact created but some verification checks failed'
      });

      // Reload diagnostics to show new artifact
      await loadDiagnostics();

    } catch (error) {
      console.error('[ArtifactDiagnostics] Test write failed:', error);
      setTestResult({
        success: false,
        error: error.message,
        message: 'Failed to create test artifact'
      });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <p className="text-sm text-red-700 font-medium">Access Denied</p>
        <p className="text-xs text-red-600 mt-1">Artifact Diagnostics is restricted to Technical Admin users only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artifact Diagnostics"
        subtitle="Technical Admin tool for verifying ChangeLog artifact storage and retrieval path"
      >
        <Button onClick={loadDiagnostics} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Diagnostics
        </Button>
      </PageHeader>

      {/* Source Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Artifact Source Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Source Entity</p>
              <p className="font-mono font-semibold text-slate-900">{diagnostics?.source.entity}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">ChangeLog Query</p>
              <p className="font-mono text-xs text-slate-700">{diagnostics?.source.query}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Classification Filter</p>
              <p className="font-mono text-xs text-slate-700">{diagnostics?.source.classificationFilter}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Expansion Field</p>
              <p className="font-mono text-xs text-slate-700">{diagnostics?.source.expansionField}</p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-slate-500 mb-1">List View Fields</p>
            <div className="flex flex-wrap gap-2">
              {diagnostics?.source.listFields.map(field => (
                <span key={field} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                  {field}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artifact Counts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="w-4 h-4" />
            Artifact Counts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{diagnostics?.counts.total}</p>
              <p className="text-xs text-slate-500">Total Records</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-900">{diagnostics?.counts.published}</p>
              <p className="text-xs text-blue-600">Published</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-900">{diagnostics?.counts.changelogVisible}</p>
              <p className="text-xs text-green-600">ChangeLog Visible</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">By Classification</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(diagnostics?.counts.byClassification || {}).map(([cls, count]) => (
                <div key={cls} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded">
                  <span className="text-slate-700 font-mono text-xs">{cls}</span>
                  <span className="font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Writer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TestTube className="w-4 h-4" />
            Direct Test Verification Writer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800">
              <strong>Test Behavior:</strong> Creates a direct verification_record in PublishedOutput with classification=verification_record, 
              status=published, and performs immediate read-back verification to confirm ChangeLog visibility.
            </p>
          </div>
          <Button onClick={createTestArtifact} disabled={testing} className="w-full">
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? 'Creating Test Artifact...' : 'Create Test Verification Record'}
          </Button>

          {testResult && (
            <div className={`border rounded-lg p-4 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {testResult.message}
                  </p>
                  {testResult.artifact_id && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-600"><strong>Artifact ID:</strong> {testResult.artifact_id}</p>
                      <p className="text-xs text-slate-600 break-all"><strong>Name:</strong> {testResult.artifact_name}</p>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Verification Checks:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(testResult.checks).map(([check, passed]) => (
                            <div key={check} className="flex items-center gap-2 text-xs">
                              {passed ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-red-600" />
                              )}
                              <span className={passed ? 'text-green-700' : 'text-red-700'}>
                                {check.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {testResult.error && (
                    <p className="text-xs text-red-700 mt-2 font-mono">{testResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Artifacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="w-4 h-4" />
            Recent ChangeLog Artifacts (Latest 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagnostics?.recent.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No ChangeLog artifacts found</p>
          ) : (
            <div className="space-y-2">
              {diagnostics?.recent.map(artifact => (
                <div key={artifact.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{artifact.outputName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          artifact.classification === 'verification_record' ? 'bg-blue-100 text-blue-700' :
                          artifact.classification === 'audit_record' ? 'bg-purple-100 text-purple-700' :
                          artifact.classification === 'delivery_gate_record' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {artifact.classification}
                        </span>
                        {artifact.upgrade_id && (
                          <span className="text-xs text-slate-500 font-mono">{artifact.upgrade_id}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">
                        {new Date(artifact.published_at || artifact.created_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}