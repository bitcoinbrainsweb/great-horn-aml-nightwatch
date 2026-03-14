import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Shield } from 'lucide-react';

export default function DefenseReadiness({ checks }) {
  const allComplete = checks.every(c => c.completed);

  return (
    <Card className={allComplete ? 'border-green-200' : 'border-amber-200'}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Defense Readiness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {checks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {check.completed ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className={`text-xs ${check.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                {check.label}
              </span>
              {check.count !== undefined && (
                <span className="text-xs text-slate-400 ml-auto">
                  {check.count}
                </span>
              )}
            </div>
          ))}
        </div>
        {allComplete && (
          <div className="mt-3 pt-3 border-t text-xs font-medium text-green-700">
            ✓ Audit is ready for regulatory defense
          </div>
        )}
      </CardContent>
    </Card>
  );
}