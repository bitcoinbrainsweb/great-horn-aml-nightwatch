import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, ArrowRight } from 'lucide-react';
import { getEmptyState } from '../../src/help/emptyStates';

/**
 * NW-UPGRADE-069A: Smart Empty State Component
 * 
 * Reusable empty state with guidance.
 * Can load from registry or accept props directly.
 * 
 * Usage:
 *   <SmartEmptyState configKey="noControls" />
 * or
 *   <SmartEmptyState 
 *     title="No Data"
 *     explanation="..."
 *     nextStep="..."
 *   />
 */
export default function SmartEmptyState({ 
  configKey,
  title,
  explanation,
  whyEmpty,
  nextStep,
  ctaText,
  ctaLink,
  onCtaClick,
  icon: Icon = Inbox
}) {
  // Load from registry if configKey provided
  const registryConfig = configKey ? getEmptyState(configKey) : null;
  
  // Use registry config or props
  const content = registryConfig || {
    title,
    explanation,
    whyEmpty,
    nextStep,
    ctaText,
    ctaLink
  };

  return (
    <Card className="border-dashed border-2 border-slate-200">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="w-12 h-12 text-slate-300 mb-4" />
        
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {content.title}
        </h3>
        
        {content.explanation && (
          <p className="text-sm text-slate-600 mb-4 max-w-md">
            {content.explanation}
          </p>
        )}

        {content.whyEmpty && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 max-w-md">
            <p className="text-xs text-blue-900">
              <strong>Why is this empty?</strong> {content.whyEmpty}
            </p>
          </div>
        )}

        {content.nextStep && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 max-w-md">
            <p className="text-xs text-green-900 flex items-start gap-2">
              <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><strong>Next step:</strong> {content.nextStep}</span>
            </p>
          </div>
        )}

        {content.ctaText && (
          <Button 
            onClick={onCtaClick}
            className="mt-2"
          >
            {content.ctaText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}