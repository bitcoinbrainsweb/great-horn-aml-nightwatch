import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ScenarioLibraryView from '@/components/regression/ScenarioLibraryView';
import RegressionRunDashboard from '@/components/regression/RegressionRunDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RegressionTestDashboard() {
  return (
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
  );
}