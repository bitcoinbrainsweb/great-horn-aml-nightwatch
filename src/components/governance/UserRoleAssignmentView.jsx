import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

export default function UserRoleAssignmentView() {
  const [assignments, setAssignments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [assignsData, rolesData] = await Promise.all([
        base44.entities.UserRoleAssignment.list(),
        base44.entities.RoleDefinition.list(),
      ]);
      setAssignments(assignsData || []);
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function removeAssignment(id) {
    if (!confirm('Remove this role assignment?')) return;
    try {
      await base44.entities.UserRoleAssignment.update(id, { active: false });
      setAssignments(assignments.map(a => a.id === id ? { ...a, active: false } : a));
    } catch (error) {
      console.error('Failed to remove assignment:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 justify-center p-8"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></div>;
  }

  const activeAssignments = assignments.filter(a => a.active);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">User Role Assignments ({activeAssignments.length})</h2>
      <div className="grid gap-3">
        {activeAssignments.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No active role assignments.</p>
        ) : (
          activeAssignments.map(assign => {
            const role = roles.find(r => r.roleId === assign.roleId);
            return (
              <Card key={assign.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-slate-700">{assign.userEmail}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>{role?.roleName || assign.roleId}</Badge>
                      <span className="text-xs text-slate-500">
                        Assigned by {assign.assignedBy || 'unknown'} on {new Date(assign.assignedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {assign.notes && <p className="text-xs text-slate-600 mt-2">{assign.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAssignment(assign.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}