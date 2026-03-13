import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';

export default function AdminEngagementSetup() {
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);

  const { data: reviewAreas = [] } = useQuery({
    queryKey: ['review-areas'],
    queryFn: () => base44.entities.ReviewArea.list()
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements-count'],
    queryFn: () => base44.entities.Engagement.list()
  });

  const handleInitializeReviewAreas = async () => {
    setIsInitializing(true);
    try {
      const response = await base44.functions.invoke('initializeAMLReviewAreas', {});
      if (response.data.success) {
        toast.success(`Created ${response.data.created_count} review areas`);
        queryClient.invalidateQueries({ queryKey: ['review-areas'] });
      }
    } catch (error) {
      toast.error('Failed to initialize: ' + error.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const coreAMLAreas = reviewAreas.filter(a => a.is_core_aml_area);

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Engagement System Setup"
        subtitle="Initialize and configure the engagement and audit system"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Review Areas</CardTitle>
            <CardDescription>
              Core AML effectiveness review areas for audit engagements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{coreAMLAreas.length}</p>
                <p className="text-sm text-gray-500">Review areas configured</p>
              </div>
              {coreAMLAreas.length === 23 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <Settings className="h-8 w-8 text-gray-400" />
              )}
            </div>
            
            {coreAMLAreas.length < 23 && (
              <>
                <p className="text-sm text-gray-600">
                  Initialize the 23 core AML review areas required for effectiveness reviews.
                </p>
                <Button 
                  onClick={handleInitializeReviewAreas} 
                  disabled={isInitializing}
                  className="w-full"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    'Initialize Review Areas'
                  )}
                </Button>
              </>
            )}

            {coreAMLAreas.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Configured Areas:</p>
                <div className="flex flex-wrap gap-1">
                  {coreAMLAreas.slice(0, 10).map(area => (
                    <Badge key={area.id} variant="secondary" className="text-xs">
                      {area.area_name}
                    </Badge>
                  ))}
                  {coreAMLAreas.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{coreAMLAreas.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement System</CardTitle>
            <CardDescription>
              Status of the engagement and audit system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Engagements created</span>
                <Badge variant="outline">{engagements.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Review areas</span>
                <Badge variant="outline">{reviewAreas.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">System status</span>
                {coreAMLAreas.length === 23 ? (
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">Setup Required</Badge>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600">
                The engagement system supports:
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Effectiveness Reviews</li>
                <li>Risk Assessments</li>
                <li>Control Testing</li>
                <li>Regulatory Exams</li>
                <li>Remediation Follow-Up</li>
                <li>Targeted Reviews</li>
                <li>Policy Creation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Architecture Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Engagement is the universal parent object for all audit/review activities</p>
            <p>✓ Shared control system - no duplicate audit-specific controls</p>
            <p>✓ Snapshot architecture for audit defensibility</p>
            <p>✓ Shared evidence, observation, and remediation models</p>
            <p>✓ Control-first audit testing with support for audit-by-review-area</p>
            <p>✓ Review workflow with sign-off and approval statuses</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}