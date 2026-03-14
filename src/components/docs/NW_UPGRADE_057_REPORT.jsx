import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, Eye, Sparkles } from 'lucide-react';

export default function NW_UPGRADE_057_REPORT() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">NW-UPGRADE-057</h1>
        <p className="text-lg text-slate-600">Control Coverage Map: UI Polish & Gap Visibility</p>
        <div className="flex justify-center gap-2 mt-3">
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            COMPLETED
          </Badge>
          <Badge variant="outline">v0.6.0</Badge>
          <Badge variant="outline">2026-03-14</Badge>
        </div>
      </div>

      {/* Objective */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-5 h-5" />
            Objective
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-slate-700">
            Polish and stabilize the Control Coverage Map to clearly expose assurance gaps before the upcoming system audit. 
            Improve metrics clarity, gap visibility, and UI readability without adding heavy analytics libraries.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium">Coverage Clarity</p>
              <p className="text-xs text-blue-700 mt-1">
                Improved metric labels and summaries
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900 font-medium">Gap Visibility</p>
              <p className="text-xs text-amber-700 mt-1">
                Sorted and highlighted gaps
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-900 font-medium">UI Readability</p>
              <p className="text-xs text-green-700 mt-1">
                Clearer headings and consistent styling
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 1: Coverage Summary Improvements */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TrendingUp className="w-5 h-5" />
            Phase 1: Coverage Summary Improvements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Redesigned Summary Cards:</p>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-xs space-y-2">
                <div>
                  <p className="font-medium text-slate-900 mb-1">Control Test Coverage Card:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>Large percentage display (e.g., "73%")</li>
                    <li>Breakdown: Total Controls, Tested, Untested</li>
                    <li>Blue color scheme for control metrics</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Risk Control Coverage Card:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>Large percentage display (e.g., "68%")</li>
                    <li>Breakdown: Total Risks, With Tested Controls, Without</li>
                    <li>Purple color scheme for risk metrics</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Assurance Gap Summary Card:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>Total gaps identified (untested controls + uncovered risks)</li>
                    <li>Breakdown: Untested Controls, Uncovered Risks</li>
                    <li>Amber alert styling for visibility</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Improvements:</p>
            <ul className="list-disc list-inside text-green-700 ml-2 space-y-1 text-xs">
              <li>3-card layout (was 4) for clearer focus</li>
              <li>Larger percentage displays for at-a-glance assessment</li>
              <li>Consistent metric breakdowns in each card</li>
              <li>Color-coded by category (blue=controls, purple=risks, amber=gaps)</li>
              <li>Dedicated Assurance Gap Summary for audit preparation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2: Gap Visibility */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Eye className="w-5 h-5" />
            Phase 2: Gap Visibility Improvements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Untested Controls Section:</p>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3 text-xs space-y-1.5">
                <div><strong>Sorting:</strong> Controls without owners first, then alphabetically</div>
                <div><strong>Badge Highlighting:</strong> "No Owner" badge for controls lacking ownership</div>
                <div><strong>Warning Label:</strong> "⚠ No test coverage" on each item</div>
                <div><strong>Improved Layout:</strong> White background with amber border (cleaner appearance)</div>
                <div><strong>Hover Effect:</strong> Border color change on hover for interactivity</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Uncovered Risks Section:</p>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3 text-xs space-y-1.5">
                <div><strong>Sorting:</strong> High severity first, then by control count descending</div>
                <div><strong>Severity Badge:</strong> Color-coded risk rating (High=red, Moderate=amber, Low=yellow)</div>
                <div><strong>Warning Label:</strong> "⚠ Zero tested controls" on each item</div>
                <div><strong>Control Count:</strong> Shows how many controls are linked (context for severity)</div>
                <div><strong>Improved Layout:</strong> White background with red border (cleaner appearance)</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Gap Identification Enhancements:</p>
            <ul className="list-disc list-inside text-green-700 ml-2 space-y-1 text-xs">
              <li>Intelligent sorting prioritizes most critical gaps</li>
              <li>Visual badges highlight severity and ownership issues</li>
              <li>Consistent warning labels across all gap items</li>
              <li>Improved contrast and readability for audit documentation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Phase 3: Navigation & Readability */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-5 h-5" />
            Phase 3: Navigation & UI Readability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Section Heading Improvements:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Increased font size (base instead of sm) for section headers</li>
              <li>Added count badges next to each section heading</li>
              <li>Color-coded badges match section severity (amber for gaps, red for risks, green for recent)</li>
              <li>Consistent spacing and hierarchy throughout</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Recently Tested Section:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Color-coded effectiveness rating badges</li>
              <li>Improved layout: "Tested: [date]" and "By: [user]" on same line</li>
              <li>White background with green border (consistent with other sections)</li>
              <li>Badge showing "Last 10 executions" for context</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Information Panel:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Added FileText icon to header</li>
              <li>Reformatted metrics table with better alignment</li>
              <li>Added "Pre-Audit Preparation" section with use cases</li>
              <li>Clearer explanations of coverage calculations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Files Changed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files Changed (1)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">pages/ControlCoverageMap.jsx</p>
                <p className="text-xs text-slate-500">
                  Redesigned coverage summary cards, improved gap sorting and visibility, enhanced section headings, 
                  added badges and warning labels, improved Recently Tested section, polished information panel
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-5 h-5" />
            Verification Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Coverage metrics display correctly</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Untested controls sorted (no owner first, then alphabetically)</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Uncovered risks sorted (high severity first, then by control count)</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Gap count badges visible on section headers</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Warning labels visible on all gap items</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Severity badges color-coded correctly</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Recently tested section displays effectiveness ratings</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Information panel updated with pre-audit use cases</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Navigation and routing preserved</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Existing coverage computation unchanged</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500">UI Improvements</p>
              <p className="text-2xl font-bold text-slate-900">12</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cards Redesigned</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sorting Rules</p>
              <p className="text-2xl font-bold text-slate-900">2</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Files Changed</p>
              <p className="text-2xl font-bold text-slate-900">1</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">UI Improvements Implemented:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Redesigned 3-card coverage summary layout</li>
              <li>Added Assurance Gap Summary card</li>
              <li>Improved section headings with badges and counts</li>
              <li>Added "No Owner" badges to untested controls</li>
              <li>Added severity badges to uncovered risks</li>
              <li>Added warning labels to all gap items</li>
              <li>Improved card layouts (white backgrounds, colored borders)</li>
              <li>Added hover effects for interactivity</li>
              <li>Color-coded effectiveness ratings in Recently Tested section</li>
              <li>Enhanced information panel with pre-audit use cases</li>
              <li>Consistent typography and spacing throughout</li>
              <li>Improved metric label clarity</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Gap Visibility Features:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li><strong>Untested Controls:</strong> Sorted by ownership (no owner first), then alphabetically</li>
              <li><strong>Uncovered Risks:</strong> Sorted by severity (high first), then by control count</li>
              <li><strong>Visual Indicators:</strong> Badges, warning labels, and color-coding for quick assessment</li>
              <li><strong>Count Badges:</strong> Each section header shows gap count</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Preserved Capabilities:</p>
            <ul className="list-disc list-inside text-green-700 space-y-1 ml-2 text-xs">
              <li>✓ All coverage calculations unchanged</li>
              <li>✓ Existing compliance graph relationships preserved</li>
              <li>✓ Navigation and routing stable</li>
              <li>✓ Admin-only access maintained</li>
              <li>✓ 100% backward compatible</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">Pre-Audit Readiness:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2 text-xs">
              <li>Clear visual hierarchy for gap prioritization</li>
              <li>Intelligent sorting surfaces highest-priority gaps first</li>
              <li>Severity indicators help resource allocation</li>
              <li>Control ownership visibility identifies accountability gaps</li>
              <li>Ready for audit documentation and evidence</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5">
            <li>Add export functionality for audit documentation</li>
            <li>Implement drill-down navigation from gaps to control/risk details</li>
            <li>Track coverage trends over time (historical snapshots)</li>
            <li>Add automated gap alerts for compliance team</li>
            <li>Build coverage improvement workflow (assign tests to gaps)</li>
            <li>Create coverage heatmap visualization by category</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}