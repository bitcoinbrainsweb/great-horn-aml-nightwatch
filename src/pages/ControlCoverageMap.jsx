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

    // Identify untested controls (sorted: no owner first, then alphabetically)
    const untested = Object.values(controlCoverageMap)
      .filter(c => !c.has_test)
      .map(c => c.control)
      .sort((a, b) => {
        if (!a.owner && b.owner) return -1;
        if (a.owner && !b.owner) return 1;
        return (a.control_name || '').localeCompare(b.control_name || '');
      });
    setUntestedControls(untested);

    // Identify uncovered risks (sorted: high severity first, then by control count descending)
    const uncovered = Object.values(riskCoverageMap)
      .filter(r => r.tested_controls_count === 0 && r.control_count > 0)
      .map(r => ({ ...r.risk, control_count_for_sort: r.control_count }))
      .sort((a, b) => {
        const severityOrder = { 'High': 0, 'Moderate': 1, 'Low': 2 };
        const aSev = severityOrder[a.inherent_risk_rating] ?? 3;
        const bSev = severityOrder[b.inherent_risk_rating] ?? 3;
        if (aSev !== bSev) return aSev - bSev;
        return (b.control_count_for_sort || 0) - (a.control_count_for_sort || 0);
      });
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
        <h2 className="text-base font-semibold text-slate-900 mb-4">Coverage Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Control Test Coverage */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Control Test Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{coverageMetrics.control_coverage_percentage}%</p>
                  <p className="text-xs text-slate-500 mt-1">of controls tested</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-300" />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-600">Total Controls:</span>
                <span className="font-semibold text-slate-900">{coverageMetrics.total_controls}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">Tested:</span>
                <span className="font-semibold text-green-700">{coverageMetrics.tested_controls}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-600">Untested:</span>
                <span className="font-semibold text-amber-700">{coverageMetrics.untested_controls}</span>
              </div>
            </CardContent>
          </Card>

          {/* Risk Control Coverage */}
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Risk Control Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{coverageMetrics.risk_coverage_percentage}%</p>
                  <p className="text-xs text-slate-500 mt-1">of risks covered</p>
                </div>
                <Shield className="w-8 h-8 text-purple-300" />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-600">Total Risks:</span>
                <span className="font-semibold text-slate-900">{coverageMetrics.total_risks}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">With Tested Controls:</span>
                <span className="font-semibold text-green-700">{coverageMetrics.risks_with_tested_controls}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">Without Tested Controls:</span>
                <span className="font-semibold text-red-700">{coverageMetrics.risks_without_tested_controls}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assurance Gap Summary */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Assurance Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-amber-900">{coverageMetrics.untested_controls + coverageMetrics.risks_without_tested_controls}</p>
                  <p className="text-xs text-amber-700 mt-1">total gaps identified</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-300" />
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200">
                <span className="text-amber-700">Untested Controls:</span>
                <span className="font-semibold text-amber-900">{coverageMetrics.untested_controls}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700">Uncovered Risks:</span>
                <span className="font-semibold text-amber-900">{coverageMetrics.risks_without_tested_controls}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Untested Controls */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Untested Controls</h2>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            {untestedControls.length} gap{untestedControls.length !== 1 ? 's' : ''}
          </Badge>
        </div>
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
                  <div key={control.id} className="flex items-start justify-between bg-white border border-amber-200 rounded-lg p-3 hover:border-amber-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900">{control.control_name}</h3>
                        <Badge variant="outline" className="text-xs">{control.control_category}</Badge>
                        {!control.owner && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">No Owner</Badge>
                        )}
                      </div>
                      {control.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-1">{control.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {control.owner && <span>Owner: {control.owner}</span>}
                        <span className="text-amber-600 font-medium">⚠ No test coverage</span>
                      </div>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 ml-3 mt-0.5" />
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Uncovered Risks</h2>
          <Badge className="bg-red-100 text-red-700 border-red-200">
            {uncoveredRisks.length} risk{uncoveredRisks.length !== 1 ? 's' : ''} exposed
          </Badge>
        </div>
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
                  
                  const severityColors = {
                    'High': 'bg-red-100 text-red-800 border-red-200',
                    'Moderate': 'bg-amber-100 text-amber-800 border-amber-200',
                    'Low': 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  };
                  
                  return (
                    <div key={risk.id} className="flex items-start justify-between bg-white border border-red-200 rounded-lg p-3 hover:border-red-300 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900">{risk.risk_name}</h3>
                          <Badge variant="outline" className="text-xs">{risk.risk_category}</Badge>
                          {risk.inherent_risk_rating && (
                            <Badge className={severityColors[risk.inherent_risk_rating] || 'bg-slate-100 text-slate-700'}>
                              {risk.inherent_risk_rating}
                            </Badge>
                          )}
                        </div>
                        {risk.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 mb-1">{risk.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{riskControlIds.length} linked control{riskControlIds.length !== 1 ? 's' : ''}</span>
                          <span className="text-red-600 font-medium">⚠ Zero tested controls</span>
                        </div>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 ml-3 mt-0.5" />
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recently Tested Controls</h2>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Last 10 executions
            </Badge>
          </div>
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                {executionHistory.slice(0, 10).map(exec => {
                  const test = tests.find(t => t.id === exec.test_id);
                  const control = controls.find(c => c.id === test?.control_library_id);
                  
                  if (!control) return null;
                  
                  const effectivenessColors = {
                    'Effective': 'bg-green-100 text-green-800',
                    'Partially Effective': 'bg-amber-100 text-amber-800',
                    'Ineffective': 'bg-red-100 text-red-800',
                    'Not Tested': 'bg-slate-100 text-slate-600'
                  };
                  
                  return (
                    <div key={exec.id} className="flex items-start justify-between bg-white border border-green-200 rounded-lg p-3 hover:border-green-300 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900">{control.control_name}</h3>
                          <Badge variant="outline" className="text-xs">{control.control_category}</Badge>
                          {exec.effectiveness_rating && (
                            <Badge className={effectivenessColors[exec.effectiveness_rating] || 'bg-slate-100 text-slate-600'}>
                              {exec.effectiveness_rating}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>Tested: {new Date(exec.executed_at).toLocaleDateString()}</span>
                          <span>By: {exec.executed_by}</span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-3 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Information Panel */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            About Control Coverage Map
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-3">
          <p>
            The Control Coverage Map evaluates the compliance graph (Regulation → Risk → Control → Test) 
            to identify assurance gaps and provide early visibility into testing coverage before audits.
          </p>
          
          <div>
            <p className="font-semibold text-slate-900 mb-2">Coverage Metrics:</p>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-medium text-slate-700 min-w-[140px]">Control Test Coverage:</span>
                <span className="text-slate-600">% of active controls with at least one test</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-slate-700 min-w-[140px]">Risk Control Coverage:</span>
                <span className="text-slate-600">% of risks with at least one tested control</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-slate-700 min-w-[140px]">Untested Controls:</span>
                <span className="text-slate-600">Active controls with zero test records</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-slate-700 min-w-[140px]">Uncovered Risks:</span>
                <span className="text-slate-600">Risks where no linked controls have tests</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-semibold text-blue-900 mb-2">Pre-Audit Preparation:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1 ml-2 text-xs">
              <li>Identify and prioritize testing gaps before system audits</li>
              <li>Focus resources on high-severity uncovered risks</li>
              <li>Track testing completion progress over time</li>
              <li>Provide evidence of systematic control testing coverage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}