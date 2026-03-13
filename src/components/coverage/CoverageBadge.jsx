import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function CoverageBadge({ coverage }) {
  if (!coverage) {
    return <Badge variant="secondary">No Data</Badge>;
  }

  const getVariant = (value) => {
    if (value >= 80) return 'default';
    if (value >= 50) return 'secondary';
    return 'outline';
  };

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