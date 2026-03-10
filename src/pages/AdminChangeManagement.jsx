import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, FileCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import VerificationRecordCard from '../components/verification/VerificationRecordCard';

export default function AdminChangeManagement() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadVerificationRecords();
  }, []);

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

  return (
    <div>
      <PageHeader
        title="Change Management"
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

      <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
        <p><strong>📋 Change Management:</strong> This page displays software development verification and audit records (classification=verification_record, audit_record, or delivery_gate_record). These are engineering artifacts, distinct from compliance reports.</p>
      </div>
    </div>
  );
}