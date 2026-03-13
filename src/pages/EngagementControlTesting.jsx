import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import { Plus, ArrowLeft, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';

export default function EngagementControlTesting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const engagementId = searchParams.get('engagement_id');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [testForm, setTestForm] = useState({
    engagement_id: engagementId,
    review_area_id: '',
    control_library_id: '',
    audit_control_snapshot_id: '',
    test_objective: '',
    test_procedure: '',
    control_exists: 'Not Tested',
    design_effectiveness: 'Not Tested',
    operating_effectiveness: 'Not Tested',
    test_status: 'Not Started',
    tester: '',
    reviewer: '',
    test_date: '',
    conclusion: '',
    severity_if_failed: 'N/A',
    notes: ''
  });

  const { data: engagement } = useQuery({
    queryKey: ['engagement', engagementId],
    queryFn: () => base44.entities.Engagement.filter({ id: engagementId }),
    select: (data) => data?.[0],
    enabled: !!engagementId
  });

  const { data: tests = [] } = useQuery({
    queryKey: ['engagement-control-tests', engagementId],
    queryFn: () => base44.entities.EngagementControlTest.filter({ engagement_id: engagementId }),
    enabled: !!engagementId
  });

  const { data: reviewAreas = [] } = useQuery({
    queryKey: ['review-areas'],
    queryFn: () => base44.entities.ReviewArea.list()
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.ControlLibrary.filter({ lifecycle_state: 'active' })
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['engagement-snapshots', engagementId],
    queryFn: () => base44.entities.AuditControlSnapshot.filter({ engagement_id: engagementId }),
    enabled: !!engagementId
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTest) {
        return base44.entities.EngagementControlTest.update(editingTest.id, data);
      } else {
        return base44.entities.EngagementControlTest.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-control-tests'] });
      toast.success(editingTest ? 'Test updated' : 'Test created');
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const resetForm = () => {
    setEditingTest(null);
    setTestForm({
      engagement_id: engagementId,
      review_area_id: '',
      control_library_id: '',
      audit_control_snapshot_id: '',
      test_objective: '',
      test_procedure: '',
      control_exists: 'Not Tested',
      design_effectiveness: 'Not Tested',
      operating_effectiveness: 'Not Tested',
      test_status: 'Not Started',
      tester: '',
      reviewer: '',
      test_date: '',
      conclusion: '',
      severity_if_failed: 'N/A',
      notes: ''
    });
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setTestForm(test);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!testForm.control_library_id) {
      toast.error('Please select a control');
      return;
    }
    saveMutation.mutate(testForm);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Not Started': 'secondary',
      'In Progress': 'default',
      'Testing Complete': 'default',
      'In Review': 'outline',
      'Approved': 'default'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getEffectivenessBadge = (rating) => {
    if (rating === 'Not Tested') return <Badge variant="secondary">Not Tested</Badge>;
    if (rating === 'Effective' || rating === 'Yes') return <Badge className="bg-green-100 text-green-800">{rating}</Badge>;
    if (rating === 'Partially Effective' || rating === 'Partial') return <Badge className="bg-yellow-100 text-yellow-800">{rating}</Badge>;
    if (rating === 'Ineffective' || rating === 'No') return <Badge className="bg-red-100 text-red-800">{rating}</Badge>;
    return <Badge variant="secondary">{rating}</Badge>;
  };

  const getControlName = (controlId) => {
    const control = controls.find(c => c.id === controlId);
    return control?.control_name || '-';
  };

  const getReviewAreaName = (areaId) => {
    const area = reviewAreas.find(a => a.id === areaId);
    return area?.area_name || '-';
  };

  const filteredTests = tests.filter(test => {
    const controlName = getControlName(test.control_library_id).toLowerCase();
    return controlName.includes(searchTerm.toLowerCase());
  });

  if (!engagement) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Control Testing"
        subtitle={engagement.engagement_name}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/EngagementDetailV2?id=${engagementId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Engagement
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTest ? 'Edit Test' : 'New Control Test'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Review Area</Label>
                    <Select
                      value={testForm.review_area_id}
                      onValueChange={(value) => setTestForm({ ...testForm, review_area_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select review area" />
                      </SelectTrigger>
                      <SelectContent>
                        {reviewAreas.map(area => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.area_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Control *</Label>
                    <Select
                      value={testForm.control_library_id}
                      onValueChange={(value) => {
                        const snapshot = snapshots.find(s => s.source_control_id === value);
                        setTestForm({ 
                          ...testForm, 
                          control_library_id: value,
                          audit_control_snapshot_id: snapshot?.id || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select control" />
                      </SelectTrigger>
                      <SelectContent>
                        {controls.map(control => (
                          <SelectItem key={control.id} value={control.id}>
                            {control.control_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Test Objective</Label>
                  <Textarea
                    value={testForm.test_objective}
                    onChange={(e) => setTestForm({ ...testForm, test_objective: e.target.value })}
                    placeholder="What this test is designed to verify..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Test Procedure</Label>
                  <Textarea
                    value={testForm.test_procedure}
                    onChange={(e) => setTestForm({ ...testForm, test_procedure: e.target.value })}
                    placeholder="How the test will be performed..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Control Exists?</Label>
                    <Select
                      value={testForm.control_exists}
                      onValueChange={(value) => setTestForm({ ...testForm, control_exists: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Tested">Not Tested</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Design Effectiveness</Label>
                    <Select
                      value={testForm.design_effectiveness}
                      onValueChange={(value) => setTestForm({ ...testForm, design_effectiveness: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Tested">Not Tested</SelectItem>
                        <SelectItem value="Effective">Effective</SelectItem>
                        <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                        <SelectItem value="Ineffective">Ineffective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Operating Effectiveness</Label>
                    <Select
                      value={testForm.operating_effectiveness}
                      onValueChange={(value) => setTestForm({ ...testForm, operating_effectiveness: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Tested">Not Tested</SelectItem>
                        <SelectItem value="Effective">Effective</SelectItem>
                        <SelectItem value="Partially Effective">Partially Effective</SelectItem>
                        <SelectItem value="Ineffective">Ineffective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Status</Label>
                    <Select
                      value={testForm.test_status}
                      onValueChange={(value) => setTestForm({ ...testForm, test_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Testing Complete">Testing Complete</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Reviewer Notes">Reviewer Notes</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity if Failed</Label>
                    <Select
                      value={testForm.severity_if_failed}
                      onValueChange={(value) => setTestForm({ ...testForm, severity_if_failed: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">N/A</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tester</Label>
                    <Select
                      value={testForm.tester}
                      onValueChange={(value) => setTestForm({ ...testForm, tester: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tester" />
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
                      value={testForm.reviewer}
                      onValueChange={(value) => setTestForm({ ...testForm, reviewer: value })}
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
                  <div className="space-y-2">
                    <Label>Test Date</Label>
                    <Input
                      type="date"
                      value={testForm.test_date}
                      onChange={(e) => setTestForm({ ...testForm, test_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conclusion</Label>
                  <Textarea
                    value={testForm.conclusion}
                    onChange={(e) => setTestForm({ ...testForm, conclusion: e.target.value })}
                    placeholder="Test conclusion and findings..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={testForm.notes}
                    onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Test
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search controls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No control tests yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead>Review Area</TableHead>
                  <TableHead>Exists</TableHead>
                  <TableHead>Design</TableHead>
                  <TableHead>Operating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow 
                    key={test.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEdit(test)}
                  >
                    <TableCell className="font-medium">
                      {getControlName(test.control_library_id)}
                    </TableCell>
                    <TableCell>{getReviewAreaName(test.review_area_id)}</TableCell>
                    <TableCell>{getEffectivenessBadge(test.control_exists)}</TableCell>
                    <TableCell>{getEffectivenessBadge(test.design_effectiveness)}</TableCell>
                    <TableCell>{getEffectivenessBadge(test.operating_effectiveness)}</TableCell>
                    <TableCell>{getStatusBadge(test.test_status)}</TableCell>
                    <TableCell>{test.tester || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}