import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle } from 'lucide-react';

export default function WorkflowProgress({ currentStage, stages }) {
  const defaultStages = stages || [
    { id: 'planning', label: 'Planning', completed: false },
    { id: 'procedures', label: 'Procedures', completed: false },
    { id: 'sampling', label: 'Sampling', completed: false },
    { id: 'evidence', label: 'Evidence', completed: false },
    { id: 'findings', label: 'Findings', completed: false },
    { id: 'report', label: 'Report', completed: false }
  ];

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm">Workflow Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {defaultStages.map((stage, idx) => {
            const isActive = stage.id === currentStage;
            const isCompleted = stage.completed;
            
            return (
              <React.Fragment key={stage.id}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  isActive ? 'bg-blue-100 border-blue-300' :
                  isCompleted ? 'bg-green-50 border-green-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Circle className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  )}
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-blue-900' :
                    isCompleted ? 'text-green-700' :
                    'text-slate-600'
                  }`}>
                    {stage.label}
                  </span>
                </div>
                {idx < defaultStages.length - 1 && (
                  <div className={`h-px w-4 ${isCompleted ? 'bg-green-300' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}