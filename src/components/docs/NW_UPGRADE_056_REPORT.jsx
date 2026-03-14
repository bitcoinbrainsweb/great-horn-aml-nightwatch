import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, Map, Shield } from 'lucide-react';

export default function NW_UPGRADE_056_REPORT() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">NW-UPGRADE-056</h1>
        <p className="text-lg text-slate-600">Control Coverage Map: Testing Gap Analysis</p>
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
            <Map className="w-5 h-5" />
            Objective
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-slate-700">
            Introduce the Control Coverage Map to visualize the compliance graph (Regulation → Risk → Control → Test), 
            compute testing coverage metrics, and identify gaps in control testing for early assurance insight.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-900 font-medium">Coverage Computation</p>
              <p className="text-xs text-purple-700 mt-1">
                Graph traversal and metrics
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900 font-medium">Gap Identification</p>
              <p className="text-xs text-blue-700 mt-1">
                Untested controls and risks
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-900 font-medium">Coverage Visualization</p>
              <p className="text-xs text-green-700 mt-1">
                Simple admin dashboard
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 1: Coverage Graph Computation */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <TrendingUp className="w-5 h-5" />
            Phase 1: Coverage Graph Computation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Control-Level Metrics:</p>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>has_test:</strong> Boolean (true if control has associated test)</div>
                <div><strong>test_count:</strong> Number of tests linked to this control</div>
                <div><strong>last_test_execution:</strong> Timestamp of most recent test execution</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Risk-Level Metrics:</p>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-xs space-y-1">
                <div><strong>control_count:</strong> Number of controls linked to this risk</div>
                <div><strong>tested_controls_count:</strong> Number of linked controls that have tests</div>
                <div><strong>untested_controls_count:</strong> Number of linked controls without tests</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Computation Strategy:</p>
            <ul className="list-disc list-inside text-green-700 ml-2 space-y-1 text-xs">
              <li>Operates on existing relationships only</li>
              <li>No schema changes required</li>
              <li>Lightweight runtime computation</li>
              <li>Uses existing ControlTest, ControlLibrary, RiskLibrary entities</li>
              <li>Leverages TestExecutionHistory for last execution tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2: Coverage Metrics */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="w-5 h-5" />
            Phase 2: Platform-Wide Coverage Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Computed Metrics:</p>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-xs space-y-2">
                <div>
                  <p className="font-medium text-slate-900 mb-1">Control Metrics:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>total_controls</li>
                    <li>tested_controls</li>
                    <li>untested_controls</li>
                    <li>control_coverage_percentage</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Risk Metrics:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>total_risks</li>
                    <li>risks_with_tested_controls</li>
                    <li>risks_without_tested_controls</li>
                    <li>risk_coverage_percentage</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-medium text-amber-900 mb-1">Calculation Logic:</p>
            <ul className="list-disc list-inside text-amber-700 ml-2 space-y-1 text-xs">
              <li>Control coverage = (tested controls / total controls) × 100</li>
              <li>Risk coverage = (risks with ≥1 tested control / total risks) × 100</li>
              <li>All calculations are deterministic and runtime-computed</li>
              <li>No persistent storage of computed metrics</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Phase 3: UI Visualization */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Map className="w-5 h-5" />
            Phase 3: Control Coverage Map UI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Dashboard Sections:</p>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-xs space-y-2">
                <div>
                  <p className="font-medium text-slate-900 mb-1">Coverage Summary Cards:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>Total Controls (with count)</li>
                    <li>Tested Controls (with % coverage)</li>
                    <li>Untested Controls (gaps identified)</li>
                    <li>Risk Coverage (% and ratio)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Untested Controls Section:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>Lists controls with no associated tests</li>
                    <li>Shows control name, category, description, owner</li>
                    <li>Amber alert styling for visibility</li>
                    <li>Shows up to 20 controls</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Uncovered Risks Section:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>Lists risks where no controls have tests</li>
                    <li>Shows risk name, category, description</li>
                    <li>Displays control count for context</li>
                    <li>Red alert styling for high priority</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Recently Tested Section:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5 text-slate-600">
                    <li>Shows last 10 test executions</li>
                    <li>Displays control name, execution date, executor</li>
                    <li>Shows effectiveness rating if available</li>
                    <li>Green styling for positive reinforcement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-2">Access Control:</p>
            <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
              <li>Admin-only page (adminOnly flag in Layout)</li>
              <li>Added to TESTING section in sidebar</li>
              <li>TrendingUp icon for coverage map</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Files Changed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files Changed (2)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Map className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">pages/ControlCoverageMap.jsx</p>
                <p className="text-xs text-slate-500">New admin page with coverage computation, gap identification, and visualization</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">components/Layout.jsx</p>
                <p className="text-xs text-slate-500">Added Coverage Map navigation item (admin-only), active state routing</p>
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
              <span>Coverage metrics calculate correctly</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Untested controls identified</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Uncovered risks identified</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Coverage percentages calculated</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Recently tested controls displayed</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Admin-only access enforced</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Existing risk/control/test relationships preserved</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>No schema changes required</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Verification system stable</span>
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
              <p className="text-xs text-slate-500">Dashboard Sections</p>
              <p className="text-2xl font-bold text-slate-900">4</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Metrics Computed</p>
              <p className="text-2xl font-bold text-slate-900">8</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Gap Types</p>
              <p className="text-2xl font-bold text-slate-900">2</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Files Changed</p>
              <p className="text-2xl font-bold text-slate-900">2</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Coverage Computation Features:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>Control-level: has_test, test_count, last_test_execution</li>
              <li>Risk-level: control_count, tested/untested controls</li>
              <li>Platform-wide: control coverage %, risk coverage %</li>
              <li>Gap identification: untested controls, uncovered risks</li>
              <li>Recent activity: last 10 test executions</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Dashboard Capabilities:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1 ml-2">
              <li>4 summary cards with key coverage metrics</li>
              <li>Untested controls list (amber alerts)</li>
              <li>Uncovered risks list (red alerts)</li>
              <li>Recently tested controls timeline (green)</li>
              <li>Color-coded status indicators for quick assessment</li>
              <li>Admin-only visibility</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-slate-900 mb-1">Preserved Capabilities:</p>
            <ul className="list-disc list-inside text-green-700 space-y-1 ml-2">
              <li>✓ All existing risk/control/test relationships unchanged</li>
              <li>✓ No schema modifications required</li>
              <li>✓ Existing testing workflows preserved</li>
              <li>✓ Verification system stable</li>
              <li>✓ 100% backward compatible</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-900 mb-1">Safety Guarantees:</p>
            <ul className="list-disc list-inside text-green-700 space-y-1 ml-2 text-xs">
              <li>No destructive actions</li>
              <li>No data deletion</li>
              <li>100% read-only coverage computation</li>
              <li>No schema changes</li>
              <li>Runtime computation only (no persistence)</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-900 mb-1">Use Cases Enabled:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2 text-xs">
              <li>Pre-audit gap analysis and testing prioritization</li>
              <li>Risk-based testing resource allocation</li>
              <li>Testing progress tracking over time</li>
              <li>Compliance program health monitoring</li>
              <li>Audit planning and scope definition</li>
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
            <li>Add historical coverage trend tracking</li>
            <li>Build coverage heatmap by control category</li>
            <li>Implement automated coverage alerts</li>
            <li>Create coverage improvement workflows</li>
            <li>Add drill-down navigation from coverage map to test details</li>
            <li>Build coverage export for audit documentation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}