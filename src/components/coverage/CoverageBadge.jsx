import React from 'react';
import { CheckCircle2, AlertCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

export default function CoverageBadge({ status }) {
  const statusConfig = {
    COVERED: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800',
      label: 'Covered'
    },
    PARTIALLY_COVERED: {
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Partially Covered'
    },
    INEFFECTIVE: {
      icon: XCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Ineffective'
    },
    NOT_TESTED: {
      icon: Clock,
      color: 'bg-slate-100 text-slate-800',
      label: 'Not Tested'
    },
    UNCONTROLLED: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Uncontrolled'
    }
  };

  const config = statusConfig[status] || statusConfig.UNCONTROLLED;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}