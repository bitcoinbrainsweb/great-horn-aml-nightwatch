import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function OverrideLogView() {
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverrides();
  }, []);

  async function loadOverrides() {
    try {
      const data = await base44.entities.OverrideLog.list('-requestTimestamp', 50);
      setOverrides(data || []);
    } catch (error) {
      console.error('Failed to load overrides:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 justify-center p-8"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></div>;
  }

  const statusColors = {
    requested: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    revoked: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Override Log ({overrides.length})</h2>
      <div className="grid gap-3">
        {overrides.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No overrides recorded.</p>
        ) : (
          overrides.map(override => (
            <Card key={override.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{override.overrideType.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500">{override.entityType} #{override.entityId}</p>
                </div>
                <Badge variant="outline" className={statusColors[override.status]}>{override.status}</Badge>
              </div>
              <div className="space-y-2 mt-3 text-xs">
                <p><span className="font-semibold">Reason:</span> {override.reason}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="font-semibold text-slate-700">Original</p>
                    <p className="text-slate-600 break-words">{override.originalValue}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="font-semibold text-slate-700">New Value</p>
                    <p className="text-slate-600 break-words">{override.newValue}</p>
                  </div>
                </div>
                <p className="text-slate-500">
                  Requested by <strong>{override.requestedBy}</strong> on {new Date(override.requestTimestamp).toLocaleString()}
                  {override.approvedBy && ` • Approved by <strong>${override.approvedBy}</strong>`}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}