import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function EvidenceManager({ engagementId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    evidence_type: 'Policy',
    title: '',
    description: '',
    source: '',
    evidence_date: '',
    evidence_strength: 'Moderate',
    engagement_id: engagementId,
    notes: ''
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['engagement-evidence', engagementId],
    queryFn: () => base44.entities.EvidenceItem.filter({ engagement_id: engagementId })
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.EvidenceItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-evidence'] });
      toast.success('Evidence added');
      setDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setEvidenceForm({
      evidence_type: 'Policy',
      title: '',
      description: '',
      source: '',
      evidence_date: '',
      evidence_strength: 'Moderate',
      engagement_id: engagementId,
      notes: ''
    });
  };

  const getStrengthBadge = (strength) => {
    const colors = {
      'Weak': 'bg-red-100 text-red-800',
      'Moderate': 'bg-yellow-100 text-yellow-800',
      'Strong': 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[strength]}>{strength}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Evidence ({evidence.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Evidence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Evidence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Evidence Type *</Label>
                  <Select
                    value={evidenceForm.evidence_type}
                    onValueChange={(value) => setEvidenceForm({ ...evidenceForm, evidence_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Policy">Policy</SelectItem>
                      <SelectItem value="Procedure">Procedure</SelectItem>
                      <SelectItem value="Alert Case">Alert Case</SelectItem>
                      <SelectItem value="Training Record">Training Record</SelectItem>
                      <SelectItem value="Screenshot">Screenshot</SelectItem>
                      <SelectItem value="System Export">System Export</SelectItem>
                      <SelectItem value="Interview Note">Interview Note</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Evidence Strength</Label>
                  <Select
                    value={evidenceForm.evidence_strength}
                    onValueChange={(value) => setEvidenceForm({ ...evidenceForm, evidence_strength: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weak">Weak</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  placeholder="Evidence title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                  placeholder="Description of evidence..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input
                    value={evidenceForm.source}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, source: e.target.value })}
                    placeholder="Source of evidence"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Evidence Date</Label>
                  <Input
                    type="date"
                    value={evidenceForm.evidence_date}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, evidence_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveMutation.mutate(evidenceForm)}>
                  Save Evidence
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {evidence.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No evidence items yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Strength</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidence.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.evidence_type}</TableCell>
                <TableCell>{item.source || '-'}</TableCell>
                <TableCell>{item.evidence_date || '-'}</TableCell>
                <TableCell>{getStrengthBadge(item.evidence_strength)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}