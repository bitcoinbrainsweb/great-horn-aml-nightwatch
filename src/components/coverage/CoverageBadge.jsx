import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function CoverageBadge({ coverage, status }) {
  // Handle status strings (from AdminRiskLibrary)
  if (status) {
    const statusConfig = {
      'COVERED': { color: 'bg-green-100 text-green-800', label: 'Covered' },
      'PARTIALLY_COVERED': { color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
      'UNCONTROLLED': { color: 'bg-red-100 text-red-800', label: 'No Controls' },
      'NOT_TESTED': { color: 'bg-slate-100 text-slate-600', label: 'Not Tested' }
    };
    const config = statusConfig[status] || { color: 'bg-slate-100 text-slate-600', label: 'Unknown' };
    return <Badge className={config.color}>{config.label}</Badge>;
  }

  // Handle numeric coverage percentages
  if (!coverage && coverage !== 0) {
    return <Badge variant="secondary">No Data</Badge>;
  }

  const getColor = (value) => {
    if (value >= 80) return 'bg-green-100 text-green-800';
    if (value >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Badge className={getColor(coverage)}>
      {coverage}% Coverage
    </Badge>
  );
}