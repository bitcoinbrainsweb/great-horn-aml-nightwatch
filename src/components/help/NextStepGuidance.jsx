import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lightbulb } from 'lucide-react';

/**
 * NW-UPGRADE-070: Next Step Guidance Component
 * 
 * Amanda-facing "What Do I Do Next?" guidance.
 * Uses simple deterministic rules based on page state.
 * Plain language, operational focus.
 */
export default function NextStepGuidance({ 
  currentState,
  recommendedAction,
  explanation,
  ctaText,
  onCtaClick,
  variant = "default"
}) {
  if (!currentState || !recommendedAction) return null;

  const variantStyles = {
    default: "border-blue-200 bg-blue-50",
    success: "border-green-200 bg-green-50",
    warning: "border-amber-200 bg-amber-50"
  };

  const variantTextColors = {
    default: "text-blue-900",
    success: "text-green-900",
    warning: "text-amber-900"
  };

  return (
    <Card className={`${variantStyles[variant]} mb-6`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className={`w-5 h-5 ${variantTextColors[variant]} flex-shrink-0 mt-0.5`} />
          
          <div className="flex-1">
            <p className={`text-xs font-medium ${variantTextColors[variant]} uppercase tracking-wide mb-1`}>
              NEXT STEP
            </p>
            
            <p className="text-sm text-slate-700 mb-2">
              {currentState}
            </p>
            
            <div className="flex items-start gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">
                  {recommendedAction}
                </p>
                {explanation && (
                  <p className="text-xs text-slate-600">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            {ctaText && onCtaClick && (
              <Button 
                size="sm" 
                onClick={onCtaClick}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {ctaText}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}