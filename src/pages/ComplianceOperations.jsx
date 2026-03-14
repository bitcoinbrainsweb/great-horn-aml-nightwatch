import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Wrench
} from 'lucide-react';

export default function ComplianceOperations() {
  const { data: controlTests = [], isLoading: loadingTests } = useQuery({
    queryKey: ['controlTests'],
    queryFn: () => base44.entities.ControlTest.list('-created_date')
  });

  const { data: testResults = [], isLoading: loadingResults } = useQuery({
    queryKey: ['testResults'],
    queryFn: () => base44.entities.TestResult.list('-created_date', 10)
  });

  const { data: findings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['findings'],
    queryFn: () => base44.entities.Finding.filter({ status: 'Open' })
  });

  const { data: remediations = [], isLoading: loadingRemediations } = useQuery({
    queryKey: ['remediations'],
    queryFn: () => base44.entities.RemediationAction.filter({ 
      status: { $in: ['Not Started', 'In Progress'] }
    })
  });

  // Calculate schedule status
  const scheduledTests = controlTests.filter(t => t.test_frequency && t.test_frequency !== 'ad_hoc');
  const overdueTests = scheduledTests.filter(t => t.schedule_status === 'overdue');
  const dueSoonTests = scheduledTests.filter(t => t.schedule_status === 'due_soon');
  const onTrackTests = scheduledTests.filter(t => t.schedule_status === 'on_track');

  // Recent test results summary
  const recentPassed = testResults.filter(r => r.result_status === 'pass').length;
  const recentFailed = testResults.filter(r => r.result_status === 'fail').length;
  const recentPartial = testResults.filter(r => r.result_status === 'partial').length;

  const loading = loadingTests || loadingResults || loadingFindings || loadingRemediations;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compliance Operations" 
        subtitle="Command center for day-to-day compliance work"
      />

      {/* Program Snapshot */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Program Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Tests</p>
                  <p className="text-2xl font-bold text-slate-900">{controlTests.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Scheduled Tests</p>
                  <p className="text-2xl font-bold text-slate-900">{scheduledTests.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Open Findings</p>
                  <p className="text-2xl font-bold text-slate-900">{findings.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Active Remediations</p>
                  <p className="text-2xl font-bold text-slate-900">{remediations.length}</p>
                </div>
                <Wrench className="w-8 h-8 text-purple-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testing Status */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Testing Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Overdue Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-700">{overdueTests.length}</span>
                  <Badge className="bg-red-100 text-red-700 border-red-200">Needs Action</Badge>
                </div>
                {overdueTests.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-600">Next: {overdueTests[0].next_due_date || 'N/A'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Due Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-amber-700">{dueSoonTests.length}</span>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">Plan Now</Badge>
                </div>
                {dueSoonTests.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-600">Next: {dueSoonTests[0].next_due_date || 'N/A'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                On Track
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-700">{onTrackTests.length}</span>
                  <Badge className="bg-green-100 text-green-700 border-green-200">Good</Badge>
                </div>
                {onTrackTests.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-600">Next: {onTrackTests[0].next_due_date || 'N/A'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Test Results */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Test Results (Last 10)</h2>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-slate-600">Passed</span>
                </div>
                <p className="text-3xl font-bold text-green-700">{recentPassed}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-xs text-slate-600">Partial</span>
                </div>
                <p className="text-3xl font-bold text-amber-700">{recentPartial}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-xs text-slate-600">Failed</span>
                </div>
                <p className="text-3xl font-bold text-red-700">{recentFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Snapshot */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Issues Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Open Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-amber-700">{findings.length}</span>
                  {findings.length > 0 ? (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">Requires Review</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-200">All Clear</Badge>
                  )}
                </div>
                {findings.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    {findings.slice(0, 3).map(f => (
                      <div key={f.id} className="text-xs text-slate-600 truncate">
                        • {f.title || f.finding_title || 'Untitled'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-600" />
                Active Remediations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-purple-700">{remediations.length}</span>
                  {remediations.length > 0 ? (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">In Progress</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-200">Complete</Badge>
                  )}
                </div>
                {remediations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    {remediations.slice(0, 3).map(r => (
                      <div key={r.id} className="text-xs text-slate-600 truncate">
                        • {r.action_title || 'Untitled'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}