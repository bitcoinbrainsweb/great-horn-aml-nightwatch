import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, FileText, CheckSquare, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';

export default function EngagementDetailV2() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const engagementId = searchParams.get('id');
  const isNew = searchParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    engagement_name: '',
    engagement_type: 'Effectiveness Review',
    client_id: '',
    engagement_owner: '',
    reviewer: '',
    status: 'Draft',
    review_period_start: '',
    review_period_end: '',
    scope: '',
    summary: '',
    overall_rating: 'N/A',
    approval_status: 'Pending'
  });

  const { data: engagement, isLoading: engLoading } = useQuery({
    queryKey: ['engagement', engagementId],
    queryFn: () => base44.entities.Engagement.filter({ id: engagementId }),
    enabled: !!engagementId && !isNew,
    select: (data) => data?.[0]
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: controlTests = [] } = useQuery({
    queryKey: ['engagement-control-tests', engagementId],
    queryFn: () => base44.entities.EngagementControlTest.filter({ engagement_id: engagementId }),
    enabled: !!engagementId && !isNew
  });

  const { data: observations = [] } = useQuery({
    queryKey: ['engagement-observations', engagementId],
    queryFn: () => base44.entities.Observation.filter({ engagement_id: engagementId }),
    enabled: !!engagementId && !isNew
  });

  const { data: workpapers = [] } = useQuery({
    queryKey: ['engagement-workpapers', engagementId],
    queryFn: () => base44.entities.Workpaper.filter({ engagement_id: engagementId }),
    enabled: !!engagementId && !isNew
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ['engagement-evidence', engagementId],
    queryFn: () => base44.entities.EvidenceItem.filter({ engagement_id: engagementId }),
    enabled: !!engagementId && !isNew
  });

  useEffect(() => {
    if (engagement && !isNew) {
      setFormData(engagement);
    }
  }, [engagement, isNew]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNew) {
        return base44.entities.Engagement.create(data);
      } else {
        return base44.entities.Engagement.update(engagementId, data);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['engagements'] });
      queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
      toast.success(isNew ? 'Engagement created' : 'Engagement updated');
      if (isNew) {
        navigate(`/EngagementDetailV2?id=${result.id}`);
      }
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    }
  });

  const handleSave = () => {
    if (!formData.engagement_name || !formData.engagement_type || !formData.engagement_owner) {
      toast.error('Please fill in required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleCreateSnapshots = async () => {
    try {
      const response = await base44.functions.invoke('createEngagementSnapshots', {
        engagement_id: engagementId
      });
      if (response.data.success) {
        toast.success(`Created ${response.data.snapshots_created} control snapshots`);
        queryClient.invalidateQueries();
      }
    } catch (error) {
      toast.error('Failed to create snapshots: ' + error.message);
    }
  };

  if (engLoading && !isNew) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title={isNew ? "New Engagement" : formData.engagement_name}
        subtitle={formData.engagement_type}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/EngagementsV2')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {!isNew && (
            <>
              <TabsTrigger value="tests">
                Control Tests ({controlTests.length})
              </TabsTrigger>
              <TabsTrigger value="observations">
                Observations ({observations.length})
              </TabsTrigger>
              <TabsTrigger value="evidence">
                Evidence ({evidence.length})
              </TabsTrigger>
              <TabsTrigger value="workpapers">
                Workpapers ({workpapers.length})
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Engagement Name *</Label>
                  <Input
                    value={formData.engagement_name}
                    onChange={(e) => setFormData({ ...formData, engagement_name: e.target.value })}
                    placeholder="Q1 2026 AML Effectiveness Review"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Engagement Type *</Label>
                  <Select
                    value={formData.engagement_type}
                    onValueChange={(value) => setFormData({ ...formData, engagement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Effectiveness Review">Effectiveness Review</SelectItem>
                      <SelectItem value="Risk Assessment">Risk Assessment</SelectItem>
                      <SelectItem value="Control Testing">Control Testing</SelectItem>
                      <SelectItem value="Regulatory Exam">Regulatory Exam</SelectItem>
                      <SelectItem value="Remediation Follow-Up">Remediation Follow-Up</SelectItem>
                      <SelectItem value="Targeted Review">Targeted Review</SelectItem>
                      <SelectItem value="Policy Creation">Policy Creation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Reviewer Notes">Reviewer Notes</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Finalized">Finalized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Engagement Owner *</Label>
                  <Select
                    value={formData.engagement_owner}
                    onValueChange={(value) => setFormData({ ...formData, engagement_owner: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
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
                    value={formData.reviewer}
                    onValueChange={(value) => setFormData({ ...formData, reviewer: value })}
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
                  <Label>Review Period Start</Label>
                  <Input
                    type="date"
                    value={formData.review_period_start}
                    onChange={(e) => setFormData({ ...formData, review_period_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review Period End</Label>
                  <Input
                    type="date"
                    value={formData.review_period_end}
                    onChange={(e) => setFormData({ ...formData, review_period_end: e.target.value })}
                  />
                </div>
              </div>

              {formData.engagement_type === 'Effectiveness Review' && (
                <div className="space-y-2">
                  <Label>Overall Rating</Label>
                  <Select
                    value={formData.overall_rating}
                    onValueChange={(value) => setFormData({ ...formData, overall_rating: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N/A">N/A</SelectItem>
                      <SelectItem value="Effective">Effective</SelectItem>
                      <SelectItem value="Improvements Needed">Improvements Needed</SelectItem>
                      <SelectItem value="Deficient">Deficient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Scope</Label>
                <Textarea
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  placeholder="Define the scope of this engagement..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Executive summary..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {!isNew && formData.engagement_type === 'Effectiveness Review' && (
            <Card>
              <CardHeader>
                <CardTitle>Control Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create a snapshot of the current control environment to preserve audit defensibility.
                  This captures control versions, risk mappings, and regulatory references at the start of the engagement.
                </p>
                <Button onClick={handleCreateSnapshots}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Create Control Snapshots
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Control Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Control testing interface will be built in Phase 3</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observations">
          <Card>
            <CardHeader>
              <CardTitle>Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Observations interface will be built in Phase 4</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Evidence management interface will be built in Phase 4</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workpapers">
          <Card>
            <CardHeader>
              <CardTitle>Workpapers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Workpapers interface will be built in Phase 4</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}