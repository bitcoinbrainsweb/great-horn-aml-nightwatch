import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Circle, AlertTriangle } from 'lucide-react';

const COVERAGE_CONFIG = {
  COVERED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Covered',
    icon: CheckCircle
  },
  PARTIALLY_COVERED: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    label: 'Partial',
    icon: AlertTriangle
  },
  INEFFECTIVE: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: 'Ineffective',
    icon: AlertCircle
  },
  NOT_TESTED: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    label: 'Not Tested',
    icon: Circle
  },
  UNCONTROLLED: {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    label: 'Uncontrolled',
    icon: AlertCircle
  }
};

export default function CoverageBadge({ status, showIcon = false }) {
  const config = COVERAGE_CONFIG[status] || COVERAGE_CONFIG.NOT_TESTED;
  const Icon = config.icon;

  return (
    <Badge className={`${config.bg} ${config.text} gap-1`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}