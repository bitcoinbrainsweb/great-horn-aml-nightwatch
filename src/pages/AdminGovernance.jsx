import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import RolePermissionDashboard from '@/components/governance/RolePermissionDashboard';
import UserRoleAssignmentView from '@/components/governance/UserRoleAssignmentView';
import OverrideLogView from '@/components/governance/OverrideLogView';
import ApprovalQueueView from '@/components/governance/ApprovalQueueView';
import SegregationOfDutiesPanel from '@/components/governance/SegregationOfDutiesPanel';

export default function AdminGovernance() {
  const [initializing, setInitializing] = useState(false);
  const [initMsg, setInitMsg] = useState('');

  async function initializeGovernance() {
    if (!confirm('Initialize governance entities (roles, permissions)? This can be run safely multiple times.')) return;
    
    setInitializing(true);
    setInitMsg('');
    try {
      const res = await base44.functions.invoke('initializeGovernanceEntities', {});
      setInitMsg(`✅ Initialized: ${res.data.results.created} created, ${res.data.results.skipped} skipped`);
    } catch (error) {
      setInitMsg(`❌ Error: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance & Permissions"
        subtitle="Nightwatch NW-UPGRADE-011: Role/Permission Model, Override Governance, Break-Glass Actions"
      />

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800 mb-3">
          <strong>Overview:</strong> Manage roles, permissions, user assignments, overrides, approvals, and segregation-of-duties compliance.
        </p>
        <Button
          onClick={initializeGovernance}
          disabled={initializing}
          className="gap-2"
        >
          {initializing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Initialize Governance Entities
        </Button>
        {initMsg && <p className="text-xs mt-2">{initMsg}</p>}
      </Card>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="roles">Roles & Perms</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="sod">SOD</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <RolePermissionDashboard />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <UserRoleAssignmentView />
        </TabsContent>

        <TabsContent value="overrides" className="mt-6">
          <OverrideLogView />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <ApprovalQueueView />
        </TabsContent>

        <TabsContent value="sod" className="mt-6">
          <SegregationOfDutiesPanel />
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-2">Next Steps</h3>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>Initialize governance entities using the button above</li>
          <li>Assign users to roles in the Assignments tab</li>
          <li>Monitor overrides and approvals for governance compliance</li>
          <li>Review segregation-of-duties violations regularly</li>
          <li>Ensure break-glass actions are logged and justified</li>
        </ul>
      </Card>
    </div>
  );
}