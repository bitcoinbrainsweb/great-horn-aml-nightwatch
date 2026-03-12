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
  const [systemArtifacts, setSystemArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('verification');
  const [diagnostics, setDiagnostics] = useState(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairError, setRepairError] = useState('');
  const [repairResultText, setRepairResultText] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!user || !['admin', 'super_admin'].includes(user?.role)) return;
    
    // Subscribe to real-time PublishedOutput changes
    const unsubscribe = base44.entities.PublishedOutput.subscribe((event) => {
      // Reload when verification records are created or updated
      if (event.data?.classification === 'verification_record') {
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
      console.log('[ChangeLog] Loading verification artifacts...');
      const changelogArtifacts = await getChangeLogArtifacts();
      setRecords(changelogArtifacts);
      
      // Load system artifacts separately (system_export + audit_record)
      const allSystem = await base44.entities.PublishedOutput.filter({
        status: 'published'
      });
      const systemArtifacts = allSystem.filter(r =>
        r.classification === 'system_export' || r.classification === 'audit_record'
      );
      setSystemArtifacts(systemArtifacts);
      console.log('[ChangeLog] Loaded', changelogArtifacts.length, 'verification artifacts and', systemArtifacts.length, 'system/audit artifacts');
    } catch (error) {
      console.error('Error loading records:', error);
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
      // Diagnostics: diagnostic_record + delivery_gate_record only
      const publishedRecords = allRecords.filter(r => r.status === 'published');
      const diagnosticRecords = publishedRecords.filter(r =>
        r.classification === 'diagnostic_record' || r.classification === 'delivery_gate_record'
      );
      const recent = diagnosticRecords
        .slice()
        .sort((a, b) => new Date(b.published_at || b.created_date) - new Date(a.published_at || a.created_date))
        .slice(0, 10);
      setDiagnostics({
        counts: {
          total: allRecords.length,
          published: publishedRecords.length,
          changelogVisible: recent.length,
          byClassification: classificationCounts
        },
        recent: recent
      });
    } catch (error) {
      console.error('Diagnostics load error:', error);
    }
  }

  async function handleRunClassificationRepair() {
    setRepairLoading(true);
    setRepairError('');
    setRepairResultText('');
    try {
      const result = await base44.functions.invoke('repairArtifactClassificationsNW034', {});
      const data = result && result.data !== undefined ? result.data : result;
      const text = JSON.stringify(data, null, 2);
      setRepairResultText(text);
    } catch (error) {
      const message = error && error.message ? error.message : 'NW-034 classification repair failed';
      setRepairError(message);
    } finally {
      setRepairLoading(false);
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
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="system">System Artifacts</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-6">
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

        <TabsContent value="system" className="space-y-6">
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search system artifacts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {systemArtifacts.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No system artifacts"
              description="System exports and audit artifacts will appear here."
            />
          ) : (
            <div className="space-y-3">
              {systemArtifacts
                .filter(r =>
                  !search ||
                  r.outputName?.toLowerCase().includes(search.toLowerCase()) ||
                  r.upgrade_id?.toLowerCase().includes(search.toLowerCase())
                )
                .map(r => (
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
              {user?.role === 'admin' && (
                <div className="mt-4">
                  <Button
                    onClick={handleRunClassificationRepair}
                    disabled={repairLoading}
                    className="w-full"
                  >
                    {repairLoading
                      ? 'Running NW-034 Classification Repair...'
                      : 'Run NW-034 Classification Repair'}
                  </Button>
                  {repairError ? (
                    <p className="mt-2 text-xs text-red-700">{repairError}</p>
                  ) : null}
                  {repairResultText ? (
                    <pre className="mt-2 p-2 bg-slate-50 border border-slate-200 text-xs overflow-x-auto">
                      {repairResultText}
                    </pre>
                  ) : null}
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