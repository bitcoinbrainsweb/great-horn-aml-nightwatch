import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function SegregationOfDutiesPanel() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkViolations();
  }, []);

  async function checkViolations() {
    try {
      const overrides = await base44.entities.OverrideLog.filter({ status: 'applied' });
      const flagged = [];

      for (const override of overrides) {
        if (override.requestedBy === override.approvedBy) {
          flagged.push({
            type: 'same_user_override',
            severity: 'high',
            message: 'User requested and approved their own override',
            actor: override.requestedBy,
            override,
            linkedId: override.id,
          });
        }
      }

      setViolations(flagged);
    } catch (error) {
      console.error('Failed to check violations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 justify-center p-8"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></div>;
  }

  const severityColors = {
    high: 'bg-red-50 text-red-700 border-red-200',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Segregation of Duties ({violations.length} violations)</h2>
      {violations.length === 0 ? (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-700">✓ No segregation-of-duties violations detected.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {violations.map(violation => (
            <Card key={violation.linkedId} className={`p-4 border-2 ${severityColors[violation.severity]}`}>
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{violation.message}</p>
                  <p className="text-xs mt-1 opacity-75">Actor: {violation.actor}</p>
                  <Badge variant="outline" className="mt-2">{violation.type.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}