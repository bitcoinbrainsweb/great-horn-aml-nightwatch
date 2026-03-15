import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '../ui/RiskBadge';
import { CheckCircle2, XCircle, MessageSquare, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { logAudit } from '../util/auditLog';

export default function ReviewTab({ engagement }) {
  const { user } = useAuth();
  const [reviewLogs, setReviewLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [section, setSection] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [engagement.id]);

  async function loadData() {
    const [logs, rpts] = await Promise.all([
      base44.entities.ReviewLog.filter({ engagement_id: engagement.id }),
      base44.entities.Report.filter({ engagement_id: engagement.id }),
    ]);
    setReviewLogs(logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setReports(rpts);
    setLoading(false);
  }

  const isReviewer = user?.email === engagement.assigned_reviewer || user?.role === 'admin';

  async function submitReview() {
    if (!isReviewer) return;
    setSaving(true);
    await base44.entities.ReviewLog.create({
      engagement_id: engagement.id,
      report_id: reports[0]?.id || '',
      reviewer: user.email,
      decision,
      section,
      comments
    });

    if (decision === 'Approved') {
      if (reports[0]) {
        await base44.entities.Report.update(reports[0].id, { status: 'Approved' });
      }
    } else if (decision === 'Changes Requested') {
      if (reports[0]) {
        await base44.entities.Report.update(reports[0].id, { status: 'Draft' });
      }
      await base44.entities.Engagement.update(engagement.id, { status: 'Draft Report' });
    }

    await logAudit({ userEmail: user?.email, objectType: 'Report', objectId: reports[0]?.id || '', action: 'review_submitted', details: `Decision: ${decision}. ${comments}` });
    setDecision('');
    setComments('');
    setSection('');
    await loadData();
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Submit review */}
      {isReviewer ? (
      <div className="bg-white rounded-xl border border-slate-200/60 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Submit Review</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger><SelectValue placeholder="Decision..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Approved">Approve</SelectItem>
                <SelectItem value="Changes Requested">Request Changes</SelectItem>
                <SelectItem value="Comment">Comment Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger><SelectValue placeholder="Section (optional)..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Overall">Overall</SelectItem>
                <SelectItem value="Executive Summary">Executive Summary</SelectItem>
                <SelectItem value="Risk Analysis">Risk Analysis</SelectItem>
                <SelectItem value="Control Assessment">Control Assessment</SelectItem>
                <SelectItem value="Recommendations">Recommendations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Textarea placeholder="Comments..." value={comments} onChange={e => setComments(e.target.value)} rows={3} />
        <div className="flex justify-end">
          <Button onClick={submitReview} disabled={saving || !decision} className="bg-slate-900 hover:bg-slate-800">
            {saving ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-5 flex items-center gap-3">
          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700">Review submission restricted</p>
            <p className="text-xs text-slate-400 mt-0.5">Only the assigned reviewer or an admin may submit review decisions. Review history is visible below.</p>
          </div>
        </div>
      )}

      {/* Review log */}
      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Review History</h3>
        </div>
        {reviewLogs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">No reviews submitted yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviewLogs.map(log => (
              <div key={log.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  {log.decision === 'Approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                   log.decision === 'Changes Requested' ? <XCircle className="w-4 h-4 text-amber-500" /> :
                   <MessageSquare className="w-4 h-4 text-blue-500" />}
                  <span className="text-sm font-medium text-slate-900">{log.reviewer}</span>
                  <StatusBadge status={log.decision} />
                  {log.section && <span className="text-xs text-slate-500">on {log.section}</span>}
                  <span className="text-xs text-slate-400 ml-auto">{log.created_date ? format(new Date(log.created_date), 'MMM d, h:mm a') : ''}</span>
                </div>
                {log.comments && <p className="text-sm text-slate-600 ml-7">{log.comments}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}