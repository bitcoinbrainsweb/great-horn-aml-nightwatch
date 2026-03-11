import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, FileCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import VerificationRecordCard from '../components/verification/VerificationRecordCard';

export default function ChangeLog() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

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
      loadVerificationRecords();
    } catch (error) {
      console.error('Auth error:', error);
      setAccessDenied(true);
      setLoading(false);
    }
  }

  async function loadVerificationRecords() {
    try {
      const all = await base44.entities.PublishedOutput.filter({
        classification: 'verification_record',
        status: 'published'
      });
      setRecords(all.sort((a, b) => new Date(b.published_at) - new Date(a.published_at)));
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
      />

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