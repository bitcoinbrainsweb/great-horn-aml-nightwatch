import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function CoverageBadge({ status }) {
  const configs = {
    'COVERED': { 
      className: 'bg-green-100 text-green-800 border-green-200',
      label: 'Covered'
    },
    'PARTIALLY_COVERED': { 
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      label: 'Partial'
    },
    'INEFFECTIVE': {
      className: 'bg-red-100 text-red-800 border-red-200',
      label: 'Ineffective'
    },
    'UNCONTROLLED': { 
      className: 'bg-red-100 text-red-800 border-red-200',
      label: 'Uncontrolled'
    },
    'NOT_TESTED': { 
      className: 'bg-slate-100 text-slate-600 border-slate-200',
      label: 'Not Tested'
    }
  };

  const config = configs[status] || configs['NOT_TESTED'];

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}