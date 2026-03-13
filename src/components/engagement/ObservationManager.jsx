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
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ObservationManager({ engagementId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [observationForm, setObservationForm] = useState({
    engagement_id: engagementId,
    observation_title: '',
    observation_text: '',
    recommendation: '',
    severity: 'Moderate',
    status: 'Draft',
    root_cause: '',
    management_response: '',
    remediation_due_date: ''
  });

  const { data: observations = [] } = useQuery({
    queryKey: ['engagement-observations', engagementId],
    queryFn: () => base44.entities.Observation.filter({ engagement_id: engagementId })
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Observation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-observations'] });
      toast.success('Observation added');
      setDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setObservationForm({
      engagement_id: engagementId,
      observation_title: '',
      observation_text: '',
      recommendation: '',
      severity: 'Moderate',
      status: 'Draft',
      root_cause: '',
      management_response: '',
      remediation_due_date: ''
    });
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      'Low': 'bg-blue-100 text-blue-800',
      'Moderate': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Observations ({observations.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Observation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Observation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Observation Title *</Label>
                <Input
                  value={observationForm.observation_title}
                  onChange={(e) => setObservationForm({ ...observationForm, observation_title: e.target.value })}
                  placeholder="Brief observation title"
                />
              </div>

              <div className="space-y-2">
                <Label>Observation Text</Label>
                <Textarea
                  value={observationForm.observation_text}
                  onChange={(e) => setObservationForm({ ...observationForm, observation_text: e.target.value })}
                  placeholder="Detailed observation description..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Recommendation</Label>
                <Textarea
                  value={observationForm.recommendation}
                  onChange={(e) => setObservationForm({ ...observationForm, recommendation: e.target.value })}
                  placeholder="Recommended action..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity *</Label>
                  <Select
                    value={observationForm.severity}
                    onValueChange={(value) => setObservationForm({ ...observationForm, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={observationForm.status}
                    onValueChange={(value) => setObservationForm({ ...observationForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Root Cause</Label>
                <Textarea
                  value={observationForm.root_cause}
                  onChange={(e) => setObservationForm({ ...observationForm, root_cause: e.target.value })}
                  placeholder="Root cause analysis..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Remediation Due Date</Label>
                <Input
                  type="date"
                  value={observationForm.remediation_due_date}
                  onChange={(e) => setObservationForm({ ...observationForm, remediation_due_date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveMutation.mutate(observationForm)}>
                  Save Observation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {observations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No observations yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {observations.map((obs) => (
              <TableRow key={obs.id}>
                <TableCell className="font-medium">{obs.observation_title}</TableCell>
                <TableCell>{getSeverityBadge(obs.severity)}</TableCell>
                <TableCell><Badge variant="outline">{obs.status}</Badge></TableCell>
                <TableCell>{obs.remediation_due_date || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}