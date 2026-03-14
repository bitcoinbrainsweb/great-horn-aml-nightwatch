import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, FileText } from 'lucide-react';

export default function ControlCoverageMap() {
  const [coverageMetrics, setCoverageMetrics] = useState(null);
  const [untestedControls, setUntestedControls] = useState([]);
  const [uncoveredRisks, setUncoveredRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.ControlLibrary.filter({ status: 'Active' })
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.RiskLibrary.list()
  });

  const { data: tests = [] } = useQuery({
    queryKey: ['controlTests'],
    queryFn: () => base44.entities.ControlTest.list()
  });

  const { data: executionHistory = [] } = useQuery({
    queryKey: ['executionHistory'],
    queryFn: () => base44.entities.TestExecutionHistory.list('-executed_at').catch(() => [])
  });

  useEffect(() => {
    if (controls.length > 0 && risks.length > 0 && tests.length > 0) {
      computeCoverage();
    }
  }, [controls, risks, tests, executionHistory]);

  function computeCoverage() {
    setLoading(true);

    // Build control coverage map
    const controlCoverageMap = {};
    controls.forEach(control => {
      const relatedTests = tests.filter(t => t.control_library_id === control.id);
      const lastExecution = executionHistory.find(e => 
        relatedTests.some(t => t.id === e.test_id)
      );

      controlCoverageMap[control.id] = {
        control,
        has_test: relatedTests.length > 0,
        test_count: relatedTests.length,
        last_test_execution: lastExecution?.executed_at || null
      };
    });

    // Build risk coverage map
    const riskCoverageMap = {};
    risks.forEach(risk => {
      const riskControlIds = Array.isArray(risk.linked_control_ids)
        ? risk.linked_control_ids
        : (risk.linked_control_ids ? JSON.parse(risk.linked_control_ids) : []);

      const riskControls = riskControlIds
        .map(id => controlCoverageMap[id])
        .filter(Boolean);

      const testedControls = riskControls.filter(c => c.has_test);
      const untestedControls = riskControls.filter(c => !c.has_test);

      riskCoverageMap[risk.id] = {
        risk,
        control_count: riskControls.length,
        tested_controls_count: testedControls.length,
        untested_controls_count: untestedControls.length
      };
    });

    // Compute platform-wide metrics
    const totalControls = controls.length;
    const testedControls = Object.values(controlCoverageMap).filter(c => c.has_test).length;
    const untestedControlsCount = totalControls - testedControls;

    const totalRisks = risks.length;
    const risksWithTestedControls = Object.values(riskCoverageMap).filter(r => r.tested_controls_count > 0).length;
    const risksWithoutTestedControls = totalRisks - risksWithTestedControls;

    const riskCoveragePercentage = totalRisks > 0 
      ? Math.round((risksWithTestedControls / totalRisks) * 100) 
      : 0;

    setCoverageMetrics({
      total_controls: totalControls,
      tested_controls: testedControls,
      untested_controls: untestedControlsCount,
      control_coverage_percentage: totalControls > 0 ? Math.round((testedControls / totalControls) * 100) : 0,
      total_risks: totalRisks,
      risks_with_tested_controls: risksWithTestedControls,
      risks_without_tested_controls: risksWithoutTestedControls,
      risk_coverage_percentage: riskCoveragePercentage
    });

    // Identify untested controls
    const untested = Object.values(controlCoverageMap)
      .filter(c => !c.has_test)
      .map(c => c.control);
    setUntestedControls(untested);

    // Identify uncovered risks
    const uncovered = Object.values(riskCoverageMap)
      .filter(r => r.tested_controls_count === 0 && r.control_count > 0)
      .map(r => r.risk);
    setUncoveredRisks(uncovered);

    setLoading(false);
  }

  if (loading || !coverageMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Control Coverage Map" 
        subtitle="Visualize testing coverage across the compliance graph"
      />

      {/* Coverage Summary */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Coverage Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Controls</p>
                  <p className="text-2xl font-bold text-slate-900">{coverageMetrics.total_controls}</p>
                </div>
                <Shield className="w-8 h-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tested Controls</p>
                  <p className="text-2xl font-bold text-green-700">{coverageMetrics.tested_controls}</p>
                  <p className="text-xs text-green-600 mt-1">{coverageMetrics.control_coverage_percentage}% coverage</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Untested Controls</p>
                  <p className="text-2xl font-bold text-amber-700">{coverageMetrics.untested_controls}</p>
                  <p className="text-xs text-amber-600 mt-1">Gaps identified</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Risk Coverage</p>
                  <p className="text-2xl font-bold text-blue-700">{coverageMetrics.risk_coverage_percentage}%</p>
                  <p className="text-xs text-blue-600 mt-1">{coverageMetrics.risks_with_tested_controls} / {coverageMetrics.total_risks} risks</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Untested Controls */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Untested Controls ({untestedControls.length})</h2>
        {untestedControls.length === 0 ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">All controls have associated tests</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                {untestedControls.slice(0, 20).map(control => (
                  <div key={control.id} className="flex items-start justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">{control.control_name}</h3>
                        <Badge className="bg-amber-100 text-amber-700">{control.control_category}</Badge>
                      </div>
                      {control.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{control.description}</p>
                      )}
                      {control.owner && (
                        <p className="text-xs text-slate-500 mt-1">Owner: {control.owner}</p>
                      )}
                    </div>
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 ml-3" />
                  </div>
                ))}
                {untestedControls.length > 20 && (
                  <div className="text-xs text-slate-500 text-center pt-2">
                    Showing 20 of {untestedControls.length} untested controls
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Uncovered Risks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Uncovered Risks ({uncoveredRisks.length})</h2>
        {uncoveredRisks.length === 0 ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">All risks with controls have tested controls</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                {uncoveredRisks.slice(0, 20).map(risk => {
                  const riskControlIds = Array.isArray(risk.linked_control_ids)
                    ? risk.linked_control_ids
                    : (risk.linked_control_ids ? JSON.parse(risk.linked_control_ids) : []);
                  
                  return (
                    <div key={risk.id} className="flex items-start justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900">{risk.risk_name}</h3>
                          <Badge className="bg-red-100 text-red-700">{risk.risk_category}</Badge>
                        </div>
                        {risk.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">{risk.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {riskControlIds.length} control(s) — none have tests
                        </p>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 ml-3" />
                    </div>
                  );
                })}
                {uncoveredRisks.length > 20 && (
                  <div className="text-xs text-slate-500 text-center pt-2">
                    Showing 20 of {uncoveredRisks.length} uncovered risks
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recently Tested Controls */}
      {executionHistory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recently Tested Controls</h2>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                {executionHistory.slice(0, 10).map(exec => {
                  const test = tests.find(t => t.id === exec.test_id);
                  const control = controls.find(c => c.id === test?.control_library_id);
                  
                  if (!control) return null;
                  
                  return (
                    <div key={exec.id} className="flex items-start justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900">{control.control_name}</h3>
                          <Badge className="bg-green-100 text-green-700">{control.control_category}</Badge>
                          {exec.effectiveness_rating && (
                            <Badge variant="outline" className="text-xs">{exec.effectiveness_rating}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          Tested {new Date(exec.executed_at).toLocaleDateString()} by {exec.executed_by}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-3" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Control Coverage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>
            The Control Coverage Map evaluates the compliance graph (Regulation → Risk → Control → Test) 
            to identify gaps in testing coverage and provide early assurance insight.
          </p>
          
          <p className="font-medium text-slate-900">Coverage Calculation:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Control Coverage:</strong> % of active controls that have at least one associated test</li>
            <li><strong>Risk Coverage:</strong> % of risks where at least one linked control has a test</li>
            <li><strong>Untested Controls:</strong> Active controls with no associated test records</li>
            <li><strong>Uncovered Risks:</strong> Risks where none of the linked controls have tests</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="font-medium text-blue-900 mb-1">Use Cases:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2 text-xs">
              <li>Identify testing gaps before audits or reviews</li>
              <li>Prioritize control testing based on risk exposure</li>
              <li>Track testing progress over time</li>
              <li>Support audit planning and resource allocation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}