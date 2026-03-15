import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ScenarioLibraryView from '@/components/regression/ScenarioLibraryView';
import RegressionRunDashboard from '@/components/regression/RegressionRunDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert } from 'lucide-react';

function AdminGate({ children }) {
  const { user } = useAuth();
  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  if (user.role !== 'admin') return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><ShieldAlert className="w-12 h-12 text-red-500" /><p className="text-lg font-semibold text-slate-800">Access Denied</p><p className="text-sm text-slate-500">This page requires admin privileges.</p></div>;
  return children;
}

export default function RegressionTestDashboard() {
  return (
    <AdminGate>
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Regression Testing Framework"
        subtitle="NW-UPGRADE-010: Deterministic scenario testing and release readiness validation"
      />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Test Suites</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Library</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <RegressionRunDashboard />
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenarioLibraryView />
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-2">
        <p><strong>Framework Overview:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>5 test scenarios covering basic to complex assessments</li>
          <li>Deterministic assertion evaluation (no LLM text matching)</li>
          <li>Narrative sanity checks (concept-based, not text-exact)</li>
          <li>Scenario baselines track approved outputs per version</li>
          <li>Release readiness gating based on regression test results</li>
        </ul>
      </div>
    </div>
    </AdminGate>
  );
}