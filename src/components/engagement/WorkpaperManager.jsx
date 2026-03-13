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
import { Plus, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkpaperManager({ engagementId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workpaperForm, setWorkpaperForm] = useState({
    engagement_id: engagementId,
    title: '',
    content: '',
    status: 'Draft',
    is_client_facing: false,
    preparer: '',
    reviewer: ''
  });

  const { data: workpapers = [] } = useQuery({
    queryKey: ['engagement-workpapers', engagementId],
    queryFn: () => base44.entities.Workpaper.filter({ engagement_id: engagementId })
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Workpaper.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-workpapers'] });
      toast.success('Workpaper added');
      setDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setWorkpaperForm({
      engagement_id: engagementId,
      title: '',
      content: '',
      status: 'Draft',
      is_client_facing: false,
      preparer: '',
      reviewer: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workpapers ({workpapers.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Workpaper
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Workpaper</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={workpaperForm.title}
                  onChange={(e) => setWorkpaperForm({ ...workpaperForm, title: e.target.value })}
                  placeholder="Workpaper title"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={workpaperForm.content}
                  onChange={(e) => setWorkpaperForm({ ...workpaperForm, content: e.target.value })}
                  placeholder="Workpaper content and notes..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preparer</Label>
                  <Select
                    value={workpaperForm.preparer}
                    onValueChange={(value) => setWorkpaperForm({ ...workpaperForm, preparer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preparer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reviewer</Label>
                  <Select
                    value={workpaperForm.reviewer}
                    onValueChange={(value) => setWorkpaperForm({ ...workpaperForm, reviewer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={workpaperForm.status}
                    onValueChange={(value) => setWorkpaperForm({ ...workpaperForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Reviewer Notes">Reviewer Notes</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client Facing</Label>
                  <Select
                    value={workpaperForm.is_client_facing ? 'yes' : 'no'}
                    onValueChange={(value) => setWorkpaperForm({ ...workpaperForm, is_client_facing: value === 'yes' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No (Internal)</SelectItem>
                      <SelectItem value="yes">Yes (Client Facing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveMutation.mutate(workpaperForm)}>
                  Save Workpaper
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workpapers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>No workpapers yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Preparer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workpapers.map((wp) => (
              <TableRow key={wp.id}>
                <TableCell className="font-medium">{wp.title}</TableCell>
                <TableCell>{wp.preparer || '-'}</TableCell>
                <TableCell><Badge variant="outline">{wp.status}</Badge></TableCell>
                <TableCell>
                  {!wp.is_client_facing && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Lock className="h-3 w-3" />
                      Internal
                    </div>
                  )}
                  {wp.is_client_facing && (
                    <span className="text-xs text-gray-500">Client Facing</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}