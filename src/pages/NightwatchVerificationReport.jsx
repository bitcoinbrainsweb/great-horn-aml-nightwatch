import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/ui/PageHeader';

// ── Canonical verification report page ─────────────────────────────────────
// This page reads ONLY from PublishedOutput entity where:
//   - classification = 'report'
//   - subtype = 'verification'
//   - status = 'published'
//
// No hard-coded reports. No alternate report pages.
// NightwatchVerificationReport is the ONLY canonical destination for verification reports.

function Badge({ label, value, variant }) {
  const cls = {
    pass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warn: 'bg-amber-50 border-amber-200 text-amber-700',
    fail: 'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-slate-50 border-slate-200 text-slate-700',
  }[variant] || 'bg-slate-50 border-slate-200 text-slate-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {value} {label}
    </span>
  );
}

function ReportCard({ id, name, date, scope, badges, statusLabel, statusColor, children, onDownload }) {
  const [open, setOpen] = useState(false);
  const statusCls = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  }[statusColor] || 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="w-full px-6 py-5 bg-white hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="text-left flex items-start gap-3 min-w-0 flex-1"
        >
          <div className="flex-shrink-0 mt-0.5">
            {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-widest">{id}</span>
              <span className="text-xs text-slate-400">{date}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCls}`}>{statusLabel}</span>
            </div>
            <p className="text-base font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{scope}</p>
          </div>
        </button>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
          <div className="flex items-center gap-2 flex-wrap">
            {badges.map((b, i) => <Badge key={i} {...b} />)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.();
            }}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors flex-shrink-0"
            title="Download report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-6">
          {children}
        </div>
      )}
    </div>
  );
}

export default function NightwatchVerificationReport() {
  const [verificationReports, setVerificationReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVerificationReports();
  }, []);

  async function loadVerificationReports() {
    try {
      // Canonical query: read ONLY published verification reports from PublishedOutput
      const reports = await base44.entities.PublishedOutput.filter({
        classification: 'report',
        subtype: 'verification',
        status: 'published'
      });
      
      // Sort newest first
      const sorted = (reports || []).sort((a, b) => {
        const dateA = new Date(a.published_at || 0);
        const dateB = new Date(b.published_at || 0);
        return dateB - dateA;
      });
      
      setVerificationReports(sorted);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load verification reports:', err);
      setError(err.message);
      setVerificationReports([]);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Nightwatch Verification Reports" subtitle="Loading..." />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Nightwatch Verification Reports" subtitle="Error loading reports" />
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <p><strong>Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Nightwatch Verification Reports"
        subtitle={`${verificationReports.length} published verification reports · Canonical destination · Newest first`}
      />

      <div className="space-y-4" id="reportsList">
        {verificationReports.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <p className="text-sm text-slate-600 mb-2">No verification reports yet</p>
            <p className="text-xs text-slate-500">Reports will appear here after successful verification runs are published through the canonical CentralPublisher function.</p>
          </div>
        ) : (
          verificationReports.map(report => (
            <ReportCard
              key={report.id}
              id={report.upgrade_id || 'UNKNOWN'}
              name={report.outputName || report.title}
              date={report.published_at ? new Date(report.published_at).toLocaleString() : 'Unknown'}
              scope={report.summary || 'Verification report'}
              statusLabel="✅ PUBLISHED"
              statusColor="green"
              badges={[
                { label: 'Status', value: 'Published', variant: 'pass' },
                { label: 'Version', value: report.product_version || 'unknown', variant: 'neutral' },
                { label: 'Upgrade', value: report.upgrade_id || 'unknown', variant: 'neutral' },
              ]}
              onDownload={() => {
                const content = typeof report.content === 'string' ? report.content : JSON.stringify(report.content, null, 2);
                const blob = new Blob([content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${report.outputName || 'verification_report'}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <div className="space-y-3 text-xs text-slate-700">
                <table className="w-full">
                  <tbody className="space-y-2">
                    <tr>
                      <td className="font-semibold text-slate-900">Report Name:</td>
                      <td className="text-slate-600">{report.outputName}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-900">Product Version:</td>
                      <td className="text-slate-600">{report.product_version}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-900">Upgrade ID:</td>
                      <td className="text-slate-600">{report.upgrade_id}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-900">Classification:</td>
                      <td className="text-slate-600">{report.classification} / {report.subtype}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-900">Published:</td>
                      <td className="text-slate-600">{report.published_at ? new Date(report.published_at).toLocaleString() : 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
                {report.summary && (
                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <p><strong>Summary:</strong></p>
                    <p className="text-slate-600 mt-1 leading-relaxed">{report.summary}</p>
                  </div>
                )}
              </div>
            </ReportCard>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <p><strong>📝 Canonical Destination:</strong> This page displays ONLY published verification reports from the PublishedOutput entity where classification=&quot;report&quot;, subtype=&quot;verification&quot;, status=&quot;published&quot;. This is the exclusive, single destination for all verification reports.</p>
      </div>

      <p className="text-xs text-slate-400 text-center mt-8 pb-6">
        Nightwatch Verification Reports · Great Horn AML · Canonical destination per NW-UPGRADE-012
      </p>
    </div>
  );
}