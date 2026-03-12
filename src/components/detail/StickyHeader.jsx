import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function StickyHeader({ title, status, subtitle, context = [] }) {
  return (
    <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-3 max-w-full">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 truncate">{title}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {status && <Badge className="text-xs">{status}</Badge>}
            {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
            {context.map((item, idx) => (
              <span key={idx} className="text-xs text-slate-400">
                {idx > 0 ? '·' : ''} {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}