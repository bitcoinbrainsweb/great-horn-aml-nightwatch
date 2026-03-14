import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import { getTermDefinition } from './helpDefinitions';

/**
 * NW-UPGRADE-069A: Compliance Term Component
 * 
 * Inline compliance definition tooltip.
 * Pull definitions from help registry.
 * Safe fallback for undefined terms.
 */
export default function ComplianceTerm({ term, className = "" }) {
  const definition = getTermDefinition(term);

  if (!definition) {
    // Fallback: render term without tooltip
    return <span className={className}>{term}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`underline decoration-dotted cursor-help ${className}`}>
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-sm text-slate-900">{definition.term}</p>
              <p className="text-xs text-slate-600 mt-1">{definition.definition}</p>
            </div>

            {definition.example && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-700">Example:</p>
                <p className="text-xs text-slate-600 italic">{definition.example}</p>
              </div>
            )}

            {definition.relatedTerms && definition.relatedTerms.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-1">Related:</p>
                <div className="flex flex-wrap gap-1">
                  {definition.relatedTerms.map(relatedTerm => (
                    <Badge key={relatedTerm} variant="outline" className="text-xs">
                      {relatedTerm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}