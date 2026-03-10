import React from 'react';
import { getRiskColor, getStatusColor, getPriorityColor } from '../scoring/riskScoringEngine';

export function RiskBadge({ rating }) {
  const colors = getRiskColor(rating);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {rating || 'Not Rated'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const color = getStatusColor(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const color = getPriorityColor(priority);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {priority}
    </span>
  );
}