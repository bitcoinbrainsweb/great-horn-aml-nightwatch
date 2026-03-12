import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, FileCheck, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

      {/* Technical Admin Debug Block */}
      {['admin', 'super_admin'].includes(user?.role) && (
        <div className="mb-6 p-4 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400 font-semibold">🔧 Technical Admin Debug</span>
            <span className="text-slate-400">Live ChangeLog Query Status</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500">Source Entity:</span>
              <span className="ml-2 text-white">{CHANGELOG_QUERY_CONFIG.entity}</span>
            </div>
            <div>
              <span className="text-slate-500">Status Filter:</span>
              <span className="ml-2 text-white">{CHANGELOG_QUERY_CONFIG.statusFilter}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">Classification Filter:</span>
              <span className="ml-2 text-white">{JSON.stringify(CHANGELOG_QUERY_CONFIG.classificationFilter)}</span>
            </div>
            <div>
              <span className="text-slate-500">Records Returned:</span>
              <span className="ml-2 text-green-400 font-bold">{records.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Filtered Display:</span>
              <span className="ml-2 text-blue-400 font-bold">{filtered.length}</span>
            </div>
            <div>
              <span className="text-slate-500">Sort Field:</span>
              <span className="ml-2 text-white">{CHANGELOG_QUERY_CONFIG.sortField}</span>
            </div>
            <div>
              <span className="text-slate-500">Sort Order:</span>
              <span className="ml-2 text-white">{CHANGELOG_QUERY_CONFIG.sortOrder}</span>
            </div>
            {records.length > 0 && (
              <>
                <div className="col-span-2">
                  <span className="text-slate-500">Latest Record IDs:</span>
                  <div className="mt-1 text-slate-400 text-[10px] break-all">
                    {records.slice(0, 3).map(r => r.id).join(', ')}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Latest Timestamps (published_at):</span>
                  <div className="mt-1 text-slate-400 text-[10px]">
                    {records.slice(0, 5).map((r, i) => (
                      <div key={i}>{r.upgrade_id}: {r.published_at || r.created_date}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <p><strong>📋 ChangeLog:</strong> Engineering and system artifacts only (verification_record, audit_record, delivery_gate_record). Separate from compliance reports. Restricted to Technical Admin.</p>
      </div>
    </div>
  );
}