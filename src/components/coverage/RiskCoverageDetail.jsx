import React from 'react';
import { Card } from '@/components/ui/card';
import CoverageBadge from './CoverageBadge';

export default function RiskCoverageDetail({ risk }) {
  if (!risk) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Control Coverage</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-600 mb-2">Coverage Status</p>
          <CoverageBadge status={risk.coverage_status} />
        </div>
        {risk.linked_control_ids && (
          <div>
            <p className="text-sm text-slate-600 mb-2">Linked Controls</p>
            <p className="text-2xl font-bold text-slate-900">{risk.linked_control_ids.length}</p>
          </div>
        )}
      </div>
    </Card>
  );
}