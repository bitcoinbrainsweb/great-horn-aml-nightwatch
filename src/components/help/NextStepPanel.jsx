import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWorkflowHint } from './workflowHints';

/**
 * NW-UPGRADE-069A: Next Step Panel Component
 * 
 * Reusable guidance panel shown after actions.
 * Can load from registry or accept props directly.
 * 
 * Usage:
 *   <NextStepPanel configKey="controlCreated" />
 * or
 *   <NextStepPanel 
 *     message="Control created"
 *     nextAction="Map to risks"
 *     link="/map-risks"
 *   />
 */
export default function NextStepPanel({ 
  configKey,
  message,
  nextAction,
  link,
  linkText,
  onDismiss
}) {
  // Load from registry if configKey provided
  const registryConfig = configKey ? getWorkflowHint(configKey) : null;
  
  // Use registry config or props
  const content = registryConfig || {
    message,
    nextAction,
    link,
    linkText
  };

  if (!content.message) return null;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900 mb-1">
              {content.message}
            </p>
            
            {content.nextAction && (
              <p className="text-sm text-green-700 flex items-start gap-2">
                <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{content.nextAction}</span>
              </p>
            )}

            {content.link && (
              <div className="mt-3">
                <Link to={content.link}>
                  <Button size="sm" variant="outline" className="border-green-300 hover:bg-green-100">
                    {content.linkText || "Continue"}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="text-green-600 hover:text-green-800 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}