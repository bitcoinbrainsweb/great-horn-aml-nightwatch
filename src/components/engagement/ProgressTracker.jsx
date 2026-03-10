import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const STAGES = [
  { key: 'client', label: 'Client', tab: null },
  { key: 'intake', label: 'Intake', tab: 'intake' },
  { key: 'risks', label: 'Risks', tab: 'risks' },
  { key: 'controls', label: 'Controls', tab: 'controls' },
  { key: 'report', label: 'Report', tab: 'report' },
  { key: 'review', label: 'Review', tab: 'review' },
  { key: 'complete', label: 'Complete', tab: null },
];

function getActiveStage(status) {
  const map = {
    'Not Started': 'client',
    'Intake In Progress': 'intake',
    'Risk Analysis': 'risks',
    'Draft Report': 'report',
    'Under Review': 'review',
    'Completed': 'complete',
    'Archived': 'complete',
  };
  return map[status] || 'client';
}

export default function ProgressTracker({ engagement, onTabChange }) {
  const activeKey = getActiveStage(engagement.status);
  const activeIdx = STAGES.findIndex(s => s.key === activeKey);

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 px-4 py-3 mb-4">
      <div className="flex items-center justify-between overflow-x-auto">
        {STAGES.map((stage, i) => {
          const isDone = i < activeIdx;
          const isCurrent = i === activeIdx;
          const isLast = i === STAGES.length - 1;

          return (
            <React.Fragment key={stage.key}>
              <button
                onClick={() => stage.tab && onTabChange(stage.tab)}
                disabled={!stage.tab}
                className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${stage.tab ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone ? 'bg-emerald-500 border-emerald-500' :
                  isCurrent ? 'bg-slate-900 border-slate-900' :
                  'bg-white border-slate-200'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>{i + 1}</span>
                  )}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  isDone ? 'text-emerald-600' :
                  isCurrent ? 'text-slate-900' :
                  'text-slate-400'
                }`}>{stage.label}</span>
              </button>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < activeIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}