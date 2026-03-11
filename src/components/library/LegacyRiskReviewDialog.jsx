import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Edit2, Archive, AlertCircle } from 'lucide-react';
import { logAudit } from '@/components/util/auditLog';

export default function LegacyRiskReviewDialog({ open, risk, user, onClose, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reviewNotes, setReviewNotes] = useState('');

  const handleMarkReviewed = async () => {
    setSaving(true);
    await base44.entities.RiskLibrary.update(risk.id, {
      status: 'legacy_reviewed',
      reviewed_by: user?.email,
      review_notes: reviewNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'RiskLibrary',
      objectId: risk.id,
      action: 'legacy_marked_reviewed',
      fieldChanged: 'status',
      oldValue: risk.status,
      newValue: 'legacy_reviewed',
      details: `Legacy risk marked as reviewed: ${risk.risk_name}. Notes: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  const handleEdit = async () => {
    setSaving(true);
    const updates = { ...editForm };
    if (reviewNotes) updates.review_notes = reviewNotes;
    await base44.entities.RiskLibrary.update(risk.id, updates);
    await logAudit({
      userEmail: user?.email,
      objectType: 'RiskLibrary',
      objectId: risk.id,
      action: 'legacy_edited_and_normalized',
      details: `Legacy risk edited: ${risk.risk_name}. Changes: ${JSON.stringify(editForm)}. Notes: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  const handleDeprecate = async () => {
    setSaving(true);
    await base44.entities.RiskLibrary.update(risk.id, {
      status: 'deprecated',
      reviewed_by: user?.email,
      review_notes: reviewNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'RiskLibrary',
      objectId: risk.id,
      action: 'legacy_deprecated',
      fieldChanged: 'status',
      oldValue: risk.status,
      newValue: 'deprecated',
      details: `Legacy risk deprecated: ${risk.risk_name}. Reason: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  const handleArchive = async () => {
    setSaving(true);
    await base44.entities.RiskLibrary.update(risk.id, {
      status: 'archived',
      reviewed_by: user?.email,
      review_notes: reviewNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'RiskLibrary',
      objectId: risk.id,
      action: 'legacy_archived',
      fieldChanged: 'status',
      oldValue: risk.status,
      newValue: 'archived',
      details: `Legacy risk archived: ${risk.risk_name}. Reason: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  if (!risk) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit & Normalize Legacy Risk' : 'Review Legacy Risk'}
          </DialogTitle>
        </DialogHeader>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <Label>Risk Name</Label>
              <Input
                value={editForm.risk_name || risk.risk_name || ''}
                onChange={e => setEditForm({ ...editForm, risk_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editForm.risk_category || risk.risk_category || ''}
                onValueChange={v => setEditForm({ ...editForm, risk_category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Products', 'Delivery Channels', 'Clients', 'Geography', 'Technology', 'Sanctions', 'Third Parties', 'Operational'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editForm.description || risk.description || ''}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Likelihood (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editForm.default_likelihood || risk.default_likelihood || ''}
                  onChange={e => setEditForm({ ...editForm, default_likelihood: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Impact (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={editForm.default_impact || risk.default_impact || ''}
                  onChange={e => setEditForm({ ...editForm, default_impact: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Review Notes</Label>
              <Textarea
                rows={2}
                placeholder="Notes on normalization..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg space-y-2 text-xs border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-900">Legacy Item</span>
              </div>
              <p><strong>Risk Name:</strong> {risk.risk_name}</p>
              {risk.risk_category && <p><strong>Category:</strong> {risk.risk_category}</p>}
              <p><strong>Status:</strong> {risk.status}</p>
              {risk.description && <p><strong>Description:</strong> {risk.description}</p>}
              {risk.default_likelihood && <p><strong>Likelihood:</strong> {risk.default_likelihood}/5</p>}
              {risk.default_impact && <p><strong>Impact:</strong> {risk.default_impact}/5</p>}
              {risk.review_notes && <p><strong>Review Notes:</strong> {risk.review_notes}</p>}
            </div>

            <div>
              <Label>Review Notes</Label>
              <Textarea
                rows={3}
                placeholder="Add notes about this legacy risk..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                className="gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Normalize
              </Button>
              <Button
                onClick={handleMarkReviewed}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Reviewed
              </Button>
              <Button
                onClick={handleDeprecate}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Deprecate
              </Button>
              <Button
                onClick={handleArchive}
                disabled={saving}
                className="bg-slate-600 hover:bg-slate-700"
              >
                <Archive className="w-3.5 h-3.5 mr-1" /> Archive
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}