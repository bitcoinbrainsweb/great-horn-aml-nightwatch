import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RiskBadge, StatusBadge } from '../ui/RiskBadge';
import { suggestRisksFromIntake, calculateInherentRisk, LIKELIHOOD_SCALE, IMPACT_SCALE } from '../scoring/riskScoringEngine';
import { logAudit } from '../util/auditLog';
import { Lightbulb, Plus, Trash2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import InfoTooltip from '../ui/InfoTooltip';

export default function RisksTab({ engagement }) {
  const [engRisks, setEngRisks] = useState([]);
  const [riskLibrary, setRiskLibrary] = useState([]);
  const [intakeResponses, setIntakeResponses] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [engagement.id]);

  async function loadData() {
    const [risks, library, intake] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
      base44.entities.RiskLibrary.filter({ status: 'Active' }),
      base44.entities.IntakeResponse.filter({ engagement_id: engagement.id })
    ]);
    setEngRisks(risks);
    setRiskLibrary(library);
    setIntakeResponses(intake);
    
    const suggested = suggestRisksFromIntake(intake);
    const existingNames = new Set(risks.map(r => r.risk_name));
    setSuggestions(suggested.filter(s => !existingNames.has(s.risk_name)));
    setLoading(false);
  }

  async function acceptSuggestion(suggestion) {
    const libRisk = riskLibrary.find(r => r.risk_name === suggestion.risk_name);
    const newRisk = await base44.entities.EngagementRisk.create({
      engagement_id: engagement.id,
      risk_id: libRisk?.id || '',
      risk_name: suggestion.risk_name,
      risk_category: libRisk?.risk_category || '',
      is_suggested: true,
      is_accepted: true,
      suggestion_reason: suggestion.reason,
      status: 'Draft'
    });
    await logAudit({ objectType: 'EngagementRisk', objectId: newRisk.id, action: 'risk_accepted', details: `Accepted risk: ${suggestion.risk_name}` });
    await loadData();
  }

  async function acceptAllSuggestions() {
    for (const s of suggestions) {
      await acceptSuggestion(s);
    }
  }

  async function addManualRisk(libraryRisk) {
    await base44.entities.EngagementRisk.create({
      engagement_id: engagement.id,
      risk_id: libraryRisk.id,
      risk_name: libraryRisk.risk_name,
      risk_category: libraryRisk.risk_category,
      status: 'Draft'
    });
    setShowAddRisk(false);
    await loadData();
  }

  async function removeRisk(riskId) {
    await logAudit({ objectType: 'EngagementRisk', objectId: riskId, action: 'risk_removed' });
    await base44.entities.EngagementRisk.delete(riskId);
    await loadData();
  }

  async function updateRiskScore(risk, field, value) {
    const updates = { [field]: value };
    
    let likelihood = field === 'inherent_likelihood_score' ? Number(value) : risk.inherent_likelihood_score;
    let impact = field === 'inherent_impact_score' ? Number(value) : risk.inherent_impact_score;
    
    if (likelihood && impact) {
      const result = calculateInherentRisk(likelihood, impact);
      updates.inherent_risk_score = result.score;
      updates.inherent_risk_rating = result.rating;
      updates.inherent_likelihood_rating = LIKELIHOOD_SCALE[likelihood];
      updates.inherent_impact_rating = IMPACT_SCALE[impact];
    }
    
    await base44.entities.EngagementRisk.update(risk.id, updates);
    await loadData();
  }

  // Group by category
  const groupedRisks = engRisks.reduce((acc, r) => {
    const cat = r.risk_category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Actions bar + counts */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setShowSuggestions(true)} className="gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" /> Suggested Risks ({suggestions.length})
        </Button>
        <Button variant="outline" onClick={() => setShowAddRisk(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Risk
        </Button>
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
          <span>Accepted: <strong className="text-slate-900">{engRisks.filter(r => r.is_accepted !== false).length}</strong></span>
          <span>From Suggestions: <strong className="text-amber-700">{engRisks.filter(r => r.is_suggested).length}</strong></span>
          <span>Total: <strong className="text-slate-900">{engRisks.length}</strong></span>
        </div>
      </div>

      {/* Risk list grouped by category */}
      {Object.keys(groupedRisks).length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900">No risks assessed yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete intake and review suggested risks to begin.</p>
        </div>
      ) : (
        Object.entries(groupedRisks).map(([category, risks]) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{category} ({risks.length})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {risks.map(risk => (
                <div key={risk.id}>
                  <div 
                    className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => setExpandedRisk(expandedRisk === risk.id ? null : risk.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {expandedRisk === risk.id ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{risk.risk_name}</p>
                        {risk.suggestion_reason && <p className="text-xs text-slate-500">{risk.suggestion_reason}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <RiskBadge rating={risk.inherent_risk_rating} />
                      <RiskBadge rating={risk.residual_risk_rating} />
                    </div>
                  </div>
                  {expandedRisk === risk.id && (
                    <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label className="text-xs flex items-center">Likelihood (1-3)<InfoTooltip content="Likelihood reflects how probable it is that this risk could occur based on the business model, products, delivery channels, and client profile. 1 = Low, 2 = Moderate, 3 = High." /></Label>
                          <Select value={String(risk.inherent_likelihood_score || '')} onValueChange={v => updateRiskScore(risk, 'inherent_likelihood_score', v)}>
                            <SelectTrigger><SelectValue placeholder="Score" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Low</SelectItem>
                              <SelectItem value="2">2 - Moderate</SelectItem>
                              <SelectItem value="3">3 - High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs flex items-center">Impact (1-3)<InfoTooltip content="Impact reflects the potential regulatory, financial, operational, or reputational consequences if this risk materializes. 1 = Low, 2 = Moderate, 3 = High." /></Label>
                          <Select value={String(risk.inherent_impact_score || '')} onValueChange={v => updateRiskScore(risk, 'inherent_impact_score', v)}>
                            <SelectTrigger><SelectValue placeholder="Score" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Low</SelectItem>
                              <SelectItem value="2">2 - Moderate</SelectItem>
                              <SelectItem value="3">3 - High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs flex items-center">Inherent Risk<InfoTooltip content="Inherent risk is calculated as Likelihood × Impact, before considering any controls. Scores of 1–2 = Low, 3–4 = Moderate, 6–9 = High." /></Label>
                          <div className="mt-1.5"><RiskBadge rating={risk.inherent_risk_rating} /></div>
                        </div>
                        <div>
                          <Label className="text-xs flex items-center">Residual Risk<InfoTooltip content="Residual risk is the risk remaining after considering the effectiveness of applicable controls. Derived from the Inherent Risk rating combined with Overall Control Effectiveness." /></Label>
                          <div className="mt-1.5"><RiskBadge rating={risk.residual_risk_rating} /></div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <Label className="text-xs">Analyst Rationale</Label>
                        <Textarea value={risk.analyst_rationale || ''} rows={2} onChange={e => base44.entities.EngagementRisk.update(risk.id, { analyst_rationale: e.target.value })} />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => removeRisk(risk.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suggested Risks from Intake</DialogTitle>
          </DialogHeader>
          {suggestions.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No new suggestions. Complete more intake sections to generate risk suggestions.</p>
          ) : (
            <>
              <Button onClick={acceptAllSuggestions} className="mb-4 bg-slate-900 hover:bg-slate-800 gap-2">
                <CheckCircle2 className="w-4 h-4" /> Accept All ({suggestions.length})
              </Button>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.risk_name}</p>
                      <p className="text-xs text-slate-500">{s.reason}</p>
                    </div>
                    <Button size="sm" onClick={() => acceptSuggestion(s)} className="bg-slate-900 hover:bg-slate-800">Accept</Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Risk from Library Dialog */}
      <Dialog open={showAddRisk} onOpenChange={setShowAddRisk}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Risk from Library</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {riskLibrary.filter(r => !engRisks.some(er => er.risk_name === r.risk_name)).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.risk_name}</p>
                  <p className="text-xs text-slate-500">{r.risk_category} · {r.description?.slice(0, 80)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => addManualRisk(r)}>Add</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}