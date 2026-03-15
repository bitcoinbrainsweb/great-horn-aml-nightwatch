import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';

export default function ApprovalQueueView() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const approvalsData = await base44.entities.ApprovalRequest.filter({ status: 'pending' });
      setApprovals(approvalsData || []);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approve(id) {
    try {
      await base44.entities.ApprovalRequest.update(id, {
        status: 'approved',
        approvedBy: user?.email,
        approvedAt: new Date().toISOString(),
      });
      setApprovals(approvals.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  }

  async function reject(id) {
    try {
      await base44.entities.ApprovalRequest.update(id, { status: 'rejected' });
      setApprovals(approvals.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 justify-center p-8"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Approval Queue ({approvals.length})</h2>
      <div className="grid gap-3">
        {approvals.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No pending approvals.</p>
        ) : (
          approvals.map(approval => (
            <Card key={approval.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{approval.approvalType.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {approval.entityType} • Requested by {approval.requestedBy} on {new Date(approval.requestedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
              </div>
              {approval.reason && <p className="text-xs text-slate-600 mt-2"><strong>Reason:</strong> {approval.reason}</p>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="default" onClick={() => approve(approval.id)} className="gap-1">
                  <Check className="w-3 h-3" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => reject(approval.id)} className="gap-1 text-red-600 hover:text-red-700">
                  <X className="w-3 h-3" /> Reject
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}