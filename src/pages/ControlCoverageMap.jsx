import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Filter, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '../components/ui/PageHeader';
import NextStepGuidance from '../components/help/NextStepGuidance';
import EmptyState from '../components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_CONFIG = {
  COVERED: { className: 'bg-green-100 text-green-800 border-green-200', label: 'Covered', icon: CheckCircle2 },
  PARTIALLY_COVERED: { className: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Partial', icon: AlertTriangle },
  INEFFECTIVE: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Ineffective', icon: XCircle },
  UNCONTROLLED: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Uncontrolled', icon: XCircle },
  NOT_TESTED: { className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Not Tested', icon: ShieldCheck },
};

export default function ControlCoverageMap() {
  const [risks, setRisks] = useState([]);
  const [controls, setControls] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showGapsOnly, setShowGapsOnly] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [r, c, t] = await Promise.all([
        base44.entities.RiskLibrary.list('-created_date', 500),
        base44.entities.ControlLibrary.filter({ status: 'Active' }, '-created_date', 500),
        base44.entities.ControlTest.list('-created_date', 1000)
      ]);
      setRisks(r);
      setControls(c);
      setTests(t);
    } catch (err) {
      console.error('Failed to load coverage data:', err);
    }
    setLoading(false);
  }

  const controlsWithTests = new Set();
  const controlEffectiveness = {};
  for (const test of tests) {
    const cid = test.control_library_id || test.control_id;
    if (cid) {
      controlsWithTests.add(cid);
      if (!controlEffectiveness[cid] || test.effectiveness_rating === 'Effective') {
        controlEffectiveness[cid] = test.effectiveness_rating;
      }
    }
  }

  const riskCoverage = risks.map(risk => {
    const linkedIds = risk.linked_control_ids || [];
    const totalControls = linkedIds.length;
    if (totalControls === 0) return { ...risk, status: 'UNCONTROLLED', totalControls: 0, testedControls: 0, effectiveControls: 0 };

    let testedControls = 0;
    let effectiveControls = 0;
    for (const cid of linkedIds) {
      if (controlsWithTests.has(cid)) {
        testedControls++;
        if (controlEffectiveness[cid] === 'Effective') effectiveControls++;
      }
    }

    let status;
    if (testedControls === 0) status = 'NOT_TESTED';
    else if (effectiveControls === 0) status = 'INEFFECTIVE';
    else if (effectiveControls >= totalControls) status = 'COVERED';
    else status = 'PARTIALLY_COVERED';

    return { ...risk, status, totalControls, testedControls, effectiveControls };
  });

  const summary = {
    total: risks.length,
    covered: riskCoverage.filter(r => r.status === 'COVERED').length,
    partial: riskCoverage.filter(r => r.status === 'PARTIALLY_COVERED').length,
    ineffective: riskCoverage.filter(r => r.status === 'INEFFECTIVE').length,
    notTested: riskCoverage.filter(r => r.status === 'NOT_TESTED').length,
    uncontrolled: riskCoverage.filter(r => r.status === 'UNCONTROLLED').length,
    totalControls: controls.length,
    controlsWithTests: controlsWithTests.size,
    controlsWithoutTests: controls.length - controlsWithTests.size,
    risksWithControls: riskCoverage.filter(r => r.totalControls > 0).length,
  };
  const coveragePct = summary.total > 0 ? Math.round((summary.covered / summary.total) * 100) : 0;
  const gapCount = summary.uncontrolled + summary.notTested + summary.ineffective;

  // Filtering logic
  const categories = [...new Set(risks.map(r => r.risk_category).filter(Boolean))];
  
  const filteredCoverage = riskCoverage.filter(risk => {
    const matchesStatus = statusFilter === 'all' || risk.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || risk.risk_category === categoryFilter;
    const matchesGapsOnly = !showGapsOnly || ['UNCONTROLLED', 'NOT_TESTED', 'INEFFECTIVE'].includes(risk.status);
    return matchesStatus && matchesCategory && matchesGapsOnly;
  });

  // Next step logic
  const showNextStepNoRisks = risks.length === 0;
  const showNextStepNoControls = risks.length > 0 && controls.length === 0;
  const showNextStepUncontrolledRisks = risks.length > 0 && controls.length > 0 && summary.uncontrolled > 0;
  const showNextStepUntestedControls = summary.controlsWithoutTests > 0 && summary.uncontrolled === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Admin')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <PageHeader title="Control Coverage Map" subtitle="Track which risks have controls and which controls are tested" />
        </div>
      </div>

      {showNextStepNoRisks && (
        <NextStepGuidance
          currentState="No risks defined yet."
          recommendedAction="Add risks to your risk library before mapping controls."
          explanation="The coverage map shows how well your controls protect against identified risks. Start by defining what risks you're managing."
          ctaText="View Risk Library"
          onCtaClick={() => window.location.href = createPageUrl('AdminRiskLibrary')}
          variant="warning"
        />
      )}

      {showNextStepNoControls && (
        <NextStepGuidance
          currentState={`${risks.length} risk${risks.length > 1 ? 's exist' : ' exists'}, but no controls are defined yet.`}
          recommendedAction="Add controls to your control library and link them to risks."
          explanation="Controls are how you reduce risk. Without controls, all risks show as uncontrolled gaps."
          ctaText="View Control Library"
          onCtaClick={() => window.location.href = createPageUrl('AdminControlLibrary')}
          variant="warning"
        />
      )}

      {showNextStepUncontrolledRisks && (
        <NextStepGuidance
          currentState={`${summary.uncontrolled} risk${summary.uncontrolled > 1 ? 's have' : ' has'} no controls assigned.`}
          recommendedAction="Link controls to these uncontrolled risks."
          explanation="Uncontrolled risks are gaps in your compliance program. Assign or create controls to address them."
          ctaText="View Risk Library"
          onCtaClick={() => window.location.href = createPageUrl('AdminRiskLibrary')}
          variant="warning"
        />
      )}

      {showNextStepUntestedControls && (
        <NextStepGuidance
          currentState={`${summary.controlsWithoutTests} control${summary.controlsWithoutTests > 1 ? 's have' : ' has'} no tests.`}
          recommendedAction="Create test cycles and assign controls for testing."
          explanation="Untested controls can't prove they're working. Regular testing validates your control environment."
          ctaText="View Control Tests"
          onCtaClick={() => window.location.href = createPageUrl('ControlTests')}
        />
      )}

      {risks.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No risks to map"
          description="Add risks to your risk library to start tracking control coverage"
        >
          <Button 
            size="sm" 
            className="mt-4"
            onClick={() => window.location.href = createPageUrl('AdminRiskLibrary')}
          >
            Go to Risk Library
          </Button>
        </EmptyState>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 mb-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700 font-medium uppercase mb-1">Coverage Overview</p>
                    <p className="text-2xl font-bold text-blue-900">{coveragePct}%</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {summary.covered} of {summary.total} risks fully covered
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2 mt-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard label="Total Risks" value={summary.total} color="text-slate-900" icon={ShieldCheck} />
              <SummaryCard label="Coverage Gaps" value={gapCount} color="text-red-700" icon={AlertTriangle} highlight={gapCount > 0} />
              <SummaryCard label="Active Controls" value={summary.totalControls} color="text-blue-700" icon={CheckCircle2} />
              <SummaryCard label="Untested Controls" value={summary.controlsWithoutTests} color="text-amber-700" icon={XCircle} highlight={summary.controlsWithoutTests > 0} />
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filters:</span>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="COVERED">Covered</SelectItem>
                    <SelectItem value="PARTIALLY_COVERED">Partial</SelectItem>
                    <SelectItem value="NOT_TESTED">Not Tested</SelectItem>
                    <SelectItem value="INEFFECTIVE">Ineffective</SelectItem>
                    <SelectItem value="UNCONTROLLED">Uncontrolled</SelectItem>
                  </SelectContent>
                </Select>

                {categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button
                  variant={showGapsOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGapsOnly(!showGapsOnly)}
                  className={showGapsOnly ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {showGapsOnly ? "Showing Gaps Only" : "Show Gaps Only"}
                </Button>

                {(statusFilter !== 'all' || categoryFilter !== 'all' || showGapsOnly) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setShowGapsOnly(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Legend */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Status Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <StatusLegend status="COVERED" description="All controls tested and effective" />
                <StatusLegend status="PARTIALLY_COVERED" description="Some controls effective, some not" />
                <StatusLegend status="NOT_TESTED" description="Controls exist but not tested yet" />
                <StatusLegend status="INEFFECTIVE" description="Controls tested but ineffective" />
                <StatusLegend status="UNCONTROLLED" description="No controls assigned to this risk" />
              </div>
            </CardContent>
          </Card>

      <div className="bg-white rounded-xl border border-slate-200/60 p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Overall Coverage</span>
          <span className="text-lg font-bold text-slate-900">{coveragePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all"
            style={{ width: `${coveragePct}%` }}
          />
        </div>
      </div>

          {/* Coverage Table */}
          <Card>
            <CardContent className="p-0">
              {filteredCoverage.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500">No risks match the current filters</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setShowGapsOnly(false);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Risk</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Category</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Controls</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tested</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Effective</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCoverage.map(risk => {
                        const cfg = STATUS_CONFIG[risk.status] || STATUS_CONFIG.NOT_TESTED;
                        const Icon = cfg.icon;
                        const isGap = ['UNCONTROLLED', 'NOT_TESTED', 'INEFFECTIVE'].includes(risk.status);
                        
                        return (
                          <tr 
                            key={risk.id} 
                            className={`hover:bg-slate-50/50 transition-colors ${isGap ? 'bg-red-50/30' : ''}`}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-start gap-2">
                                {isGap && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                                <div>
                                  <p className="font-medium text-slate-900">{risk.risk_name || risk.name || '—'}</p>
                                  {risk.risk_category && <p className="text-xs text-slate-500 mt-0.5">{risk.risk_category}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{risk.risk_category || '—'}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`font-medium ${risk.totalControls === 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                {risk.totalControls}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`${risk.testedControls === 0 && risk.totalControls > 0 ? 'text-amber-600 font-medium' : 'text-slate-900'}`}>
                                {risk.testedControls}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`${risk.effectiveControls < risk.totalControls && risk.totalControls > 0 ? 'text-red-600 font-medium' : 'text-slate-900'}`}>
                                {risk.effectiveControls}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <Badge className={`${cfg.className} flex items-center gap-1 w-fit`}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, icon: Icon, highlight = false }) {
  return (
    <Card className={highlight ? 'border-red-300 bg-red-50' : ''}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusLegend({ status, description }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
        status === 'COVERED' ? 'text-green-600' :
        status === 'PARTIALLY_COVERED' ? 'text-amber-600' :
        status === 'UNCONTROLLED' || status === 'INEFFECTIVE' ? 'text-red-600' :
        'text-slate-500'
      }`} />
      <div>
        <p className="font-medium text-slate-900">{cfg.label}</p>
        <p className="text-slate-500">{description}</p>
      </div>
    </div>
  );
}