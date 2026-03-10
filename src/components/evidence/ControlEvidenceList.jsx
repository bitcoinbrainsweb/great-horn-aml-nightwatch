import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileText, Filter } from 'lucide-react';

export default function ControlEvidenceList({ controlId, assessmentId }) {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => {
    loadEvidence();
  }, [controlId, assessmentId, filter]);

  async function loadEvidence() {
    setLoading(true);
    try {
      const query = { controlId, assessmentId };
      if (filter !== 'all') {
        if (filter.startsWith('status-')) {
          query.reviewStatus = filter.replace('status-', '');
        } else if (filter.startsWith('stale-')) {
          query.staleFlag = filter === 'stale-true';
        }
      }
      const data = await base44.entities.ControlEvidence.filter(query);
      setEvidence(data || []);
    } catch (error) {
      console.error('Failed to load evidence:', error);
    } finally {
      setLoading(false);
    }
  }

  const filters = ['all', 'status-approved', 'status-rejected', 'status-submitted', 'stale-true'];
  const statusColors = {
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-bold text-slate-900">Control Evidence</h3>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {filters.map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="text-xs"
          >
            {f === 'all' ? 'All Evidence' :
             f === 'status-approved' ? 'Approved' :
             f === 'status-rejected' ? 'Rejected' :
             f === 'status-submitted' ? 'Submitted' :
             f === 'stale-true' ? 'Stale' : f}
          </Button>
        ))}
      </div>

      {/* Evidence List */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading evidence...</p>
      ) : evidence.length === 0 ? (
        <p className="text-sm text-slate-500">No evidence found</p>
      ) : (
        <div className="space-y-2">
          {evidence.map(ev => (
            <div
              key={ev.id}
              onClick={() => setSelectedEvidence(ev)}
              className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{ev.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{ev.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[ev.reviewStatus]}`}>
                      {ev.reviewStatus}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">
                      {ev.evidenceType}
                    </span>
                    {ev.staleFlag && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 font-semibold">
                        ⚠️ STALE
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-slate-700">Submitted {new Date(ev.submittedAt).toLocaleDateString()}</p>
                  {ev.expiryDate && (
                    <p className="text-slate-500 mt-1">Expires: {new Date(ev.expiryDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View */}
      {selectedEvidence && (
        <ControlEvidenceDetailView evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
      )}
    </div>
  );
}

function ControlEvidenceDetailView({ evidence, onClose }) {
  const statusColors = {
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-96 overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{evidence.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{evidence.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Status</p>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[evidence.reviewStatus]}`}>
              {evidence.reviewStatus}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Type</p>
            <p className="text-slate-700">{evidence.evidenceType}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Submitted By</p>
            <p className="text-slate-700">{evidence.submittedBy}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Evidence Owner</p>
            <p className="text-slate-700">{evidence.evidenceOwner || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Evidence Date</p>
            <p className="text-slate-700">{new Date(evidence.evidenceDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Expiry Date</p>
            <p className="text-slate-700">{evidence.expiryDate ? new Date(evidence.expiryDate).toLocaleDateString() : 'No expiry'}</p>
          </div>
        </div>

        {evidence.reviewNotes && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Review Notes</p>
            <p className="text-sm text-slate-700">{evidence.reviewNotes}</p>
            {evidence.reviewedBy && (
              <p className="text-xs text-slate-500 mt-2">Reviewed by {evidence.reviewedBy}</p>
            )}
          </div>
        )}

        {evidence.linkedFindingIds && evidence.linkedFindingIds.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Linked Findings ({evidence.linkedFindingIds.length})</p>
            <div className="text-xs text-slate-600 space-y-1">
              {evidence.linkedFindingIds.map(fid => (
                <p key={fid}>{fid}</p>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}