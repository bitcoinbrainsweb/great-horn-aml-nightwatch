import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, BookOpen, AlertCircle, ExternalLink } from 'lucide-react';
import { getPageHelp } from './pageHelpRegistry';

/**
 * NW-UPGRADE-069A: Context Help Panel
 * 
 * Reusable help drawer component.
 * Displays page-specific help content from registry.
 * Safe fallback if no help config exists.
 */
export default function ContextHelpPanel({ pageName }) {
  const [open, setOpen] = useState(false);
  const helpConfig = getPageHelp(pageName);

  // Fallback content if no help registered
  const defaultHelp = {
    pageTitle: pageName || "Page",
    shortExplanation: "Help content is being prepared for this page.",
    whenUsed: "This page is part of the Nightwatch compliance system.",
    typicalWorkflow: ["Navigate using the sidebar", "Use search to find records"],
    commonMistakes: []
  };

  const content = helpConfig || defaultHelp;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {content.pageTitle}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Short Explanation */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">What is this page?</h3>
            <p className="text-sm text-slate-600">{content.shortExplanation}</p>
          </div>

          {/* When Used */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">When to use</h3>
            <p className="text-sm text-slate-600">{content.whenUsed}</p>
          </div>

          {/* Typical Workflow */}
          {content.typicalWorkflow && content.typicalWorkflow.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Typical workflow</h3>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-900">
                    {content.typicalWorkflow.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Common Mistakes */}
          {content.commonMistakes && content.commonMistakes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Common mistakes
              </h3>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-3">
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
                    {content.commonMistakes.map((mistake, idx) => (
                      <li key={idx}>{mistake}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Hub Link */}
          {content.helpHubLink && (
            <div className="pt-4 border-t">
              <a 
                href={content.helpHubLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Learn more in Help Hub
              </a>
            </div>
          )}

          {/* Fallback notice */}
          {!helpConfig && (
            <div className="pt-4 border-t">
              <p className="text-xs text-slate-400 italic">
                Detailed help content for this page is coming soon.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}