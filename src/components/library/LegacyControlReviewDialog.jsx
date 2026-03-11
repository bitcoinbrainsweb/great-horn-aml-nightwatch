import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Edit2, Archive, AlertCircle } from 'lucide-react';
import { logAudit } from '@/components/util/auditLog';

export default function LegacyControlReviewDialog({ open, control, user, onClose, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reviewNotes, setReviewNotes] = useState('');

  const handleMarkReviewed = async () => {
    setSaving(true);
    await base44.entities.ControlLibrary.update(control.id, {
      review_state: 'legacy_reviewed',
      reviewed_by: user?.email,
      review_notes: reviewNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'ControlLibrary',
      objectId: control.id,
      action: 'legacy_marked_reviewed',
      fieldChanged: 'status',
      oldValue: control.review_state,
      newValue: 'legacy_reviewed',
      details: `Legacy control marked as reviewed: ${control.control_name}. Notes: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  const handleEdit = async () => {
    setSaving(true);
    const updates = { ...editForm };
    if (reviewNotes) updates.review_notes = reviewNotes;
    await base44.entities.ControlLibrary.update(control.id, updates);
    await logAudit({
      userEmail: user?.email,
      objectType: 'ControlLibrary',
      objectId: control.id,
      action: 'legacy_edited_and_normalized',
      details: `Legacy control edited: ${control.control_name}. Changes: ${JSON.stringify(editForm)}. Notes: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  const handleDeprecate = async () => {
    setSaving(true);
    await base44.entities.ControlLibrary.update(control.id, {
      lifecycle_state: 'deprecated',
      review_state: 'legacy_reviewed',
      reviewed_by: user?.email,
      review_notes: reviewNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'ControlLibrary',
      objectId: control.id,
      action: 'legacy_deprecated',
      fieldChanged: 'lifecycle_state',
      oldValue: control.lifecycle_state,
      newValue: 'deprecated',
      details: `Legacy control deprecated: ${control.control_name}. Reason: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  const handleArchive = async () => {
    setSaving(true);
    await base44.entities.ControlLibrary.update(control.id, {
      lifecycle_state: 'archived',
      review_state: 'legacy_reviewed',
      reviewed_by: user?.email,
      review_notes: reviewNotes,
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'ControlLibrary',
      objectId: control.id,
      action: 'legacy_archived',
      fieldChanged: 'lifecycle_state',
      oldValue: control.lifecycle_state,
      newValue: 'archived',
      details: `Legacy control archived: ${control.control_name}. Reason: ${reviewNotes}`,
    });
    onRefresh();
    onClose();
  };

  if (!control) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit & Normalize Legacy Control' : 'Review Legacy Control'}
          </DialogTitle>
        </DialogHeader>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <Label>Control Name</Label>
              <Input
                value={editForm.control_name || control.control_name || ''}
                onChange={e => setEditForm({ ...editForm, control_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editForm.control_category || control.control_category || ''}
                onValueChange={v => setEditForm({ ...editForm, control_category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Governance', 'CDD', 'EDD', 'Sanctions', 'Transaction Monitoring', 'Reporting', 'Technology Security', 'Vendor Oversight', 'Training', 'Operations'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editForm.description || control.description || ''}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Expected Evidence</Label>
              <Textarea
                rows={2}
                value={editForm.evidence_expected || control.evidence_expected || ''}
                onChange={e => setEditForm({ ...editForm, evidence_expected: e.target.value })}
              />
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
              <p><strong>Control Name:</strong> {control.control_name}</p>
              {control.control_category && <p><strong>Category:</strong> {control.control_category}</p>}
              <p><strong>Status:</strong> {control.status}</p>
              {control.description && <p><strong>Description:</strong> {control.description}</p>}
              {control.evidence_expected && <p><strong>Expected Evidence:</strong> {control.evidence_expected}</p>}
              <p><strong>Review State:</strong> {control.review_state || 'none'}</p>
              <p><strong>Lifecycle State:</strong> {control.lifecycle_state || 'active'}</p>
              {control.review_notes && <p><strong>Review Notes:</strong> {control.review_notes}</p>}
            </div>

            <div>
              <Label>Review Notes</Label>
              <Textarea
                rows={3}
                placeholder="Add notes about this legacy control..."
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