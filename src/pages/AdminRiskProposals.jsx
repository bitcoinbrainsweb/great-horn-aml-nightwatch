import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, CheckCircle2, XCircle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../components/ui/PageHeader';
import { logAudit } from '../components/util/auditLog';
import { format } from 'date-fns';

const STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  'Needs Revision': 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function AdminRiskProposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const props = await base44.entities.RiskChangeProposal.list('-created_date', 100);
    setProposals(props);
    setLoading(false);
  }

  const isAdmin = user?.role === 'admin';

  async function handleDecision(status) {
    setSaving(true);
    await base44.entities.RiskChangeProposal.update(selected.id, {
      status,
      reviewed_by: user?.email,
      reviewer_notes: reviewNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'RiskChangeProposal',
      objectId: selected.id,
      action: `proposal_${status.toLowerCase().replace(' ', '_')}`,
      fieldChanged: 'status',
      oldValue: selected.status,
      newValue: status,
      details: `Risk change proposal "${selected.proposed_risk_name || selected.target_risk_name}" ${status} by ${user?.email}. Notes: ${reviewNotes}`,
    });
    setSaving(false);
    setSelected(null);
    setReviewNotes('');
    await load();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  const pending = proposals.filter(p => p.status === 'Pending');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Risk Change Proposals" subtitle={`${pending.length} pending review · ${proposals.length} total`} />
      </div>

      {pending.length > 0 && (
        <div className="mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <strong>{pending.length} proposal{pending.length !== 1 ? 's' : ''}</strong> awaiting admin review.
        </div>
      )}

      <div className="space-y-3">
        {proposals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/60 p-10 text-center text-sm text-slate-500">
            No risk change proposals submitted yet. Analysts can submit proposals from the Risk Library page.
          </div>
        ) : proposals.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">{p.change_type}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {p.proposed_risk_name || p.target_risk_name || '(Unnamed Risk)'}
                </p>
                {p.proposed_category && <p className="text-xs text-slate-500 mt-0.5">Category: {p.proposed_category}</p>}
                <p className="text-xs text-slate-600 mt-2">{p.rationale}</p>
                {p.proposed_description && (
                  <p className="text-xs text-slate-500 mt-1 italic">"{p.proposed_description}"</p>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  Submitted by {p.submitted_by || 'Unknown'} · {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : ''}
                </p>
                {p.reviewer_notes && (
                  <p className="text-xs text-slate-500 mt-1">Reviewer notes: {p.reviewer_notes}</p>
                )}
              </div>
              {isAdmin && p.status === 'Pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelected(p); setReviewNotes(''); }}
                  className="gap-1.5 flex-shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Review
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Proposal: {selected?.proposed_risk_name || selected?.target_risk_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <p><strong>Type:</strong> {selected?.change_type}</p>
              <p><strong>Rationale:</strong> {selected?.rationale}</p>
              {selected?.proposed_description && <p><strong>Proposed description:</strong> {selected.proposed_description}</p>}
              {selected?.supporting_reference && <p><strong>Reference:</strong> {selected.supporting_reference}</p>}
            </div>
            <div>
              <Label>Reviewer Notes</Label>
              <Textarea
                rows={3}
                placeholder="Add review notes, modifications, or rejection reason..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button
                onClick={() => handleDecision('Needs Revision')}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >Needs Revision</Button>
              <Button
                onClick={() => handleDecision('Rejected')}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
              <Button
                onClick={() => handleDecision('Approved')}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}