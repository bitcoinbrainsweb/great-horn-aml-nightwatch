import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CoverageBadge from './CoverageBadge';
import { CheckCircle, AlertCircle, Circle } from 'lucide-react';

export default function RiskCoverageDetail({ risk }) {
  const [coverage, setCoverage] = useState(null);
  const [controls, setControls] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoverage();
  }, [risk]);

  async function loadCoverage() {
    setLoading(true);
    try {
      if (!risk.linked_control_ids || risk.linked_control_ids.length === 0) {
        setCoverage({
          coverage_status: 'UNCONTROLLED',
          details: { total_controls: 0, tested_controls: 0, effective_controls: 0 }
        });
        setLoading(false);
        return;
      }

      // Get coverage via function
      const response = await base44.functions.invoke('calculateRiskCoverage', {
        risk_id: risk.id,
        linked_control_ids: risk.linked_control_ids
      });

      setCoverage(response.data);

      // Fetch control details
      const allControls = await base44.entities.ControlLibrary.list('-created_date', 200);
      const controlMap = {};
      risk.linked_control_ids.forEach(cid => {
        const ctrl = allControls.find(c => c.id === cid);
        if (ctrl) controlMap[cid] = ctrl;
      });
      setControls(controlMap);
    } catch (error) {
      console.error('Coverage load error:', error);
      setCoverage({
        coverage_status: 'NOT_TESTED',
        details: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading coverage...</div>;
  }

  if (!coverage) {
    return null;
  }

  const statusLabels = {
    Effective: { icon: CheckCircle, color: 'text-green-600' },
    'Partially Effective': { icon: AlertCircle, color: 'text-amber-600' },
    Ineffective: { icon: AlertCircle, color: 'text-red-600' },
    'Not Tested': { icon: Circle, color: 'text-slate-400' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Coverage Status</span>
          <CoverageBadge status={coverage.coverage_status} showIcon />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-slate-50 rounded">
            <p className="font-semibold text-slate-900">{coverage.details.total_controls}</p>
            <p className="text-slate-500">Total Controls</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <p className="font-semibold text-slate-900">{coverage.details.tested_controls}</p>
            <p className="text-slate-500">Tested</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <p className="font-semibold text-green-900">{coverage.details.effective_controls}</p>
            <p className="text-green-600">Effective</p>
          </div>
        </div>

        {coverage.details.control_statuses && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-semibold text-slate-700">Controls</p>
            {coverage.details.control_statuses.map((cs) => {
              const ctrl = controls[cs.control_id];
              const statusConfig = statusLabels[cs.status] || statusLabels['Not Tested'];
              const Icon = statusConfig.icon;
              return (
                <div key={cs.control_id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                  <span className="text-slate-700">{ctrl?.control_name || 'Unknown Control'}</span>
                  <div className="flex items-center gap-1">
                    <Icon className={`w-3 h-3 ${statusConfig.color}`} />
                    <Badge variant="outline" className="text-xs">{cs.status || 'Not Tested'}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}