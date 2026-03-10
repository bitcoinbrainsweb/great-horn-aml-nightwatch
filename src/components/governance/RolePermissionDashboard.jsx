import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function RolePermissionDashboard() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rolesData, permsData] = await Promise.all([
        base44.entities.RoleDefinition.list(),
        base44.entities.PermissionDefinition.list(),
      ]);
      setRoles(rolesData || []);
      setPermissions(permsData || []);
    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 justify-center p-8"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></div>;
  }

  const categoryColors = {
    assessment: 'bg-blue-50 text-blue-700 border-blue-200',
    evidence: 'bg-green-50 text-green-700 border-green-200',
    testing: 'bg-purple-50 text-purple-700 border-purple-200',
    config: 'bg-orange-50 text-orange-700 border-orange-200',
    audit: 'bg-red-50 text-red-700 border-red-200',
    override: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    user_access: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    release_governance: 'bg-pink-50 text-pink-700 border-pink-200',
    reporting: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Roles Overview */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Roles ({roles.length})</h2>
        <div className="grid gap-4">
          {roles.map(role => (
            <Card key={role.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{role.roleName}</p>
                  <p className="text-xs text-slate-500">{role.description}</p>
                </div>
                <Badge variant={role.active ? 'default' : 'secondary'}>{role.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(role.permissions || []).map(permKey => {
                  const perm = permissions.find(p => p.permissionKey === permKey);
                  return (
                    <Badge key={permKey} variant="outline" className="text-xs">
                      {perm?.permissionKey || permKey}
                    </Badge>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Permissions Inventory */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Permissions ({permissions.length})</h2>
        <div className="grid gap-2">
          {permissions.map(perm => (
            <div key={perm.id} className={`rounded-lg border p-3 ${categoryColors[perm.category] || 'bg-slate-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-xs font-semibold">{perm.permissionKey}</p>
                  {perm.description && <p className="text-xs mt-1 opacity-75">{perm.description}</p>}
                </div>
                <Badge variant="outline" className="text-xs ml-2">{perm.category}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}