import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, FileCheck, RefreshCw, Database, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import VerificationRecordCard from '../components/verification/VerificationRecordCard';
import { getChangeLogArtifacts, CHANGELOG_QUERY_CONFIG } from '../components/changelog/ChangeLogQuery';

export default function ChangeLog() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('records');
  const [diagnostics, setDiagnostics] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!user || !['admin', 'super_admin'].includes(user?.role)) return;
    
    // Subscribe to real-time PublishedOutput changes
    const unsubscribe = base44.entities.PublishedOutput.subscribe((event) => {
      // Reload when verification records are created or updated
      if (['verification_record', 'audit_record', 'delivery_gate_record'].includes(event.data?.classification)) {
        console.log('[ChangeLog] Real-time update detected, reloading...');
        loadVerificationRecords();
      }
    });

    return unsubscribe;
  }, [user]);

  async function checkAccess() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      // Technical Admin access: admin or super_admin roles
      if (!['admin', 'super_admin'].includes(me?.role)) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      loadVerificationRecords();
      loadDiagnostics();
    } catch (error) {
      console.error('Auth error:', error);
      setAccessDenied(true);
      setLoading(false);
    }
  }

  async function loadVerificationRecords() {
    setLoading(true);
    try {
      // Use shared ChangeLog query logic
      console.log('[ChangeLog] Loading artifacts via getChangeLogArtifacts()...');
      const changelogArtifacts = await getChangeLogArtifacts();
      console.log('[ChangeLog] Loaded', changelogArtifacts.length, 'artifacts');
      console.log('[ChangeLog] Latest artifact IDs:', changelogArtifacts.slice(0, 5).map(r => r.id));
      setRecords(changelogArtifacts);
    } catch (error) {
      console.error('Error loading verification records:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDiagnostics() {
    try {
      const allRecords = await base44.entities.PublishedOutput.filter({});
      const classificationCounts = {};
      allRecords.forEach(r => {
        const cls = r.classification || 'unclassified';
        classificationCounts[cls] = (classificationCounts[cls] || 0) + 1;
      });
      const changelogRecords = await getChangeLogArtifacts();
      const recent = changelogRecords.slice(0, 10);
      const publishedRecords = allRecords.filter(r => r.status === 'published');
      setDiagnostics({
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
    }
  }

  async function createTestArtifact() {
    setTesting(true);
    setTestResult(null);
    try {
      const timestamp = new Date().toISOString();
      const artifactName = `Nightwatch_VerificationRecord_DiagnosticsTest_v0.6.0_NW-UPGRADE-029_${timestamp.split('T')[0]}`;
      const testContent = {
        upgrade_metadata: {
          upgrade_id: 'NW-UPGRADE-029',
          prompt_id: 'NW-UPGRADE-029-PROMPT-001',
          product_version: 'v0.6.0',
          timestamp: timestamp,
          actor: user.email,
          source: 'ChangeLog Diagnostics'
        }
      };
      
      const artifact = await base44.entities.PublishedOutput.create({
        outputName: artifactName,
        classification: 'verification_record',
        subtype: 'diagnostic_test',
        is_runnable: false,
        is_user_visible: false,
        display_zone: 'internal_only',
        source_module: 'ChangeLog',
        source_event_type: 'diagnostic_test',
        product_version: 'v0.6.0',
        upgrade_id: 'NW-UPGRADE-029',
        status: 'published',
        published_at: timestamp,
        content: JSON.stringify(testContent),
        summary: 'ChangeLog Diagnostics Test Record',
        metadata: JSON.stringify({ test_artifact: true })
      });

      const changelogArtifacts = await getChangeLogArtifacts();
      const artifactInChangelog = changelogArtifacts.find(r => r.id === artifact.id);
      
      setTestResult({
        success: artifactInChangelog ? true : false,
        artifact_id: artifact.id,
        artifact_name: artifactName,
        message: artifactInChangelog 
          ? 'Test artifact created and confirmed in ChangeLog'
          : 'Test artifact created but not yet visible in ChangeLog'
      });
      await loadDiagnostics();
    } catch (error) {
      console.error('Test write failed:', error);
      setTestResult({
        success: false,
        error: error.message,
        message: 'Failed to create test artifact'
      });
    } finally {
      setTesting(false);
    }
  }

  const filtered = records.filter(r =>
    !search ||
    r.outputName?.toLowerCase().includes(search.toLowerCase()) ||
    r.upgrade_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (accessDenied) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-sm text-red-700 font-medium">Access Denied</p>
        <p className="text-xs text-red-600 mt-1">ChangeLog is restricted to Technical Admin users only.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="ChangeLog"
        subtitle="Software development and upgrade verification records"
      >
        <Button onClick={loadVerificationRecords} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-6">
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search records..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No verification records"
              description="Software development verification records will appear here."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <VerificationRecordCard key={r.id} record={r} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="w-4 h-4" />
                Artifact Counts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TestTube className="w-4 h-4" />
                Test Verification Writer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createTestArtifact} disabled={testing} className="w-full">
                {testing ? 'Creating...' : 'Create Test Artifact'}
              </Button>
              {testResult && (
                <div className={`border rounded-lg p-4 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>{testResult.message}</p>
                      {testResult.artifact_id && <p className="text-xs text-slate-600 mt-2">ID: {testResult.artifact_id}</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <p><strong>📋 ChangeLog:</strong> Engineering and system artifacts only (verification_record, audit_record, delivery_gate_record). Separate from compliance reports. Restricted to Technical Admin. Diagnostics tab provides verification tools.</p>
      </div>
    </div>
  );
}