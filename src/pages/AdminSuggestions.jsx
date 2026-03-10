import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/RiskBadge';
import EmptyState from '../components/ui/EmptyState';
import { format } from 'date-fns';

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => { load(); }, []);
  async function load() { setSuggestions(await base44.entities.RiskSuggestion.list('-created_date', 100)); setLoading(false); }

  async function handleDecision(id, status) {
    const me = await base44.auth.me();
    await base44.entities.RiskSuggestion.update(id, {
      status,
      reviewed_by: me.email,
      review_notes: reviewNotes[id] || ''
    });

    if (status === 'Approved') {
      const suggestion = suggestions.find(s => s.id === id);
      if (suggestion.suggestion_type === 'Risk') {
        await base44.entities.RiskLibrary.create({
          risk_name: suggestion.name,
          risk_category: suggestion.category || 'Operational',
          description: suggestion.description,
          status: 'Active',
          version: 1,
          source: `Suggested by ${suggestion.suggested_by}`
        });
      } else {
        await base44.entities.ControlLibrary.create({
          control_name: suggestion.name,
          control_category: suggestion.category || 'Operations',
          description: suggestion.description,
          status: 'Active',
          version: 1
        });
      }
    }
    await load();
  }

  const pending = suggestions.filter(s => s.status === 'Pending');
  const reviewed = suggestions.filter(s => s.status !== 'Pending');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Suggestions Queue" subtitle={`${pending.length} pending review`} />
      </div>

      {pending.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No pending suggestions" description="Analyst-submitted risks and controls will appear here." />
      ) : (
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-semibold text-slate-900">Pending Review</h3>
          {pending.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200/60 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.suggestion_type} />
                    <h4 className="text-sm font-semibold text-slate-900">{s.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Submitted by {s.suggested_by} · {s.category}</p>
                  <p className="text-sm text-slate-600 mt-2">{s.description}</p>
                  {s.rationale && <p className="text-xs text-slate-500 mt-1 italic">Rationale: {s.rationale}</p>}
                </div>
              </div>
              <Textarea
                placeholder="Review notes (optional)..."
                value={reviewNotes[s.id] || ''}
                onChange={e => setReviewNotes({...reviewNotes, [s.id]: e.target.value})}
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleDecision(s.id, 'Approved')} className="bg-emerald-600 hover:bg-emerald-700 gap-1"><CheckCircle2 className="w-4 h-4" /> Approve</Button>
                <Button variant="outline" onClick={() => handleDecision(s.id, 'Rejected')} className="text-red-600 hover:bg-red-50 gap-1"><XCircle className="w-4 h-4" /> Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Previously Reviewed</h3>
          <div className="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100">
            {reviewed.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.suggestion_type} · {s.suggested_by} · {s.created_date ? format(new Date(s.created_date), 'MMM d') : ''}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}