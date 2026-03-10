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
import { Lightbulb, Plus, Trash2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Lock, Info, Search, X, Sparkles, Edit3 } from 'lucide-react';
import InfoTooltip from '../ui/InfoTooltip';
import { Badge } from '../ui/badge';

export default function RisksTab({ engagement, isLocked }) {
  const [engRisks, setEngRisks] = useState([]);
  const [riskLibrary, setRiskLibrary] = useState([]);
  const [controlLibrary, setControlLibrary] = useState([]);
  const [controlAssessments, setControlAssessments] = useState([]);
  const [intakeResponses, setIntakeResponses] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [explainRisk, setExplainRisk] = useState(null);
  const [addControlToRisk, setAddControlToRisk] = useState(null);
  const [controlSearchQuery, setControlSearchQuery] = useState('');
  const [generatingNarrative, setGeneratingNarrative] = useState(null);
  const [editNarrative, setEditNarrative] = useState(null);

  useEffect(() => { loadData(); }, [engagement.id]);

  async function loadData() {
    const [risks, library, intake, ctrlLib, ctrlAssess] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
      base44.entities.RiskLibrary.filter({ status: 'Active' }),
      base44.entities.IntakeResponse.filter({ engagement_id: engagement.id }),
      base44.entities.ControlLibrary.filter({ status: 'Active' }),
      base44.entities.ControlAssessment.filter({ engagement_id: engagement.id })
    ]);
    setEngRisks(risks);
    setRiskLibrary(library);
    setIntakeResponses(intake);
    setControlLibrary(ctrlLib);
    setControlAssessments(ctrlAssess);
    
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
    await logAudit({ objectType: 'EngagementRisk', objectId: risk.id, action: 'score_justification_edit', fieldChanged: field, oldValue: String(risk[field] || ''), newValue: String(value), details: `Score field "${field}" changed on risk "${risk.risk_name}"` });
    await loadData();
  }

  async function saveJustification(risk, value) {
    await base44.entities.EngagementRisk.update(risk.id, { score_justification: value });
    await logAudit({ objectType: 'EngagementRisk', objectId: risk.id, action: 'score_justification_edit', fieldChanged: 'score_justification', newValue: value, details: `Score justification updated for "${risk.risk_name}"` });
  }

  async function attachManualControl(risk, control) {
    // Check for duplicates
    const existing = controlAssessments.find(c => c.engagement_risk_id === risk.id && c.control_name === control.control_name);
    if (existing) {
      alert('This control is already attached to the selected risk.');
      return;
    }

    const newCtrl = await base44.entities.ControlAssessment.create({
      engagement_risk_id: risk.id,
      engagement_id: engagement.id,
      control_id: control.id,
      control_name: control.control_name,
      control_category: control.control_category,
      control_present: false,
      design_effectiveness: 'Not Assessed',
      operational_effectiveness: 'Not Assessed',
      consistency_of_application: 'Not Assessed',
      control_rating: 'Not Assessed',
      notes: 'source=manual_add'
    });

    await logAudit({ 
      objectType: 'ControlAssessment', 
      objectId: newCtrl.id, 
      action: 'control_manually_attached', 
      details: `Manual control "${control.control_name}" attached to risk "${risk.risk_name}" on engagement ${engagement.id}` 
    });

    setAddControlToRisk(null);
    setControlSearchQuery('');
    await loadData();
  }

  function getControlsForRisk(risk) {
    return controlAssessments.filter(c => c.engagement_risk_id === risk.id);
  }

  function getRecommendedControlsForRisk(risk) {
    const libRisk = riskLibrary.find(r => r.risk_name === risk.risk_name);
    const linkedNames = new Set(libRisk?.linked_control_names || []);
    return controlAssessments.filter(c => 
      c.engagement_risk_id === risk.id && 
      linkedNames.has(c.control_name) &&
      !c.notes?.includes('source=manual_add')
    );
  }

  function getManualControlsForRisk(risk) {
    return controlAssessments.filter(c => 
      c.engagement_risk_id === risk.id && 
      c.notes?.includes('source=manual_add')
    );
  }

  async function generateRiskNarrative(risk) {
    setGeneratingNarrative(risk.id);
    const controls = getControlsForRisk(risk);
    const controlsText = controls.length > 0 
      ? controls.map(c => `${c.control_name} (${c.control_rating || 'Not Assessed'})`).join(', ')
      : 'No controls attached';
    
    const prompt = `Generate a professional AML risk consulting narrative for the following risk at ${engagement.client_name}:

Risk: ${risk.risk_name}
Category: ${risk.risk_category}
Inherent Likelihood: ${risk.inherent_likelihood_rating || 'Not Rated'} (score ${risk.inherent_likelihood_score || 'N/A'})
Inherent Impact: ${risk.inherent_impact_rating || 'Not Rated'} (score ${risk.inherent_impact_score || 'N/A'})
Inherent Risk: ${risk.inherent_risk_rating || 'Not Rated'}
Controls: ${controlsText}
Overall Control Effectiveness: ${risk.overall_control_effectiveness || 'Not Assessed'}
Residual Risk: ${risk.residual_risk_rating || 'Not Calculated'}
${risk.analyst_rationale ? `Analyst Rationale: ${risk.analyst_rationale}` : ''}
${risk.score_justification ? `Score Justification: ${risk.score_justification}` : ''}

Generate a structured narrative using this exact format:

Context
[2-3 sentences explaining what this risk is and why it matters for ${engagement.client_name}]

Observations
[2-3 sentences on specific observations about ${engagement.client_name}'s exposure to this risk]

Risk Implication
[2-3 sentences on what could happen if this risk materializes and the potential consequences]

Controls and Mitigation
[2-3 sentences describing the controls in place and their effectiveness]

Conclusion
[1-2 sentences summarizing the residual risk and overall assessment]

Use professional AML consulting language. Reference ${engagement.client_name} by name, not "the organization".`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      await base44.entities.EngagementRisk.update(risk.id, { analyst_rationale: result });
      await logAudit({ objectType: 'EngagementRisk', objectId: risk.id, action: 'analyst_narrative_generated', details: `AI-generated narrative for risk "${risk.risk_name}"` });
      await loadData();
    } catch (error) {
      alert('Failed to generate narrative: ' + error.message);
    }
    setGeneratingNarrative(null);
  }

  async function saveEditedNarrative(risk, narrative) {
    await base44.entities.EngagementRisk.update(risk.id, { analyst_rationale: narrative });
    await logAudit({ objectType: 'EngagementRisk', objectId: risk.id, action: 'analyst_narrative_edited', details: `Narrative edited for risk "${risk.risk_name}"` });
    setEditNarrative(null);
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
      {isLocked && (
        <div className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-600">
          <Lock className="w-4 h-4 flex-shrink-0 text-slate-500" />
          This engagement is locked. Risk scores and assignments are read-only.
        </div>
      )}
      {/* Actions bar + counts */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setShowSuggestions(true)} disabled={isLocked} className="gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" /> Suggested Risks ({suggestions.length})
        </Button>
        <Button variant="outline" onClick={() => setShowAddRisk(true)} disabled={isLocked} className="gap-2">
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
                    <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs flex items-center">Likelihood (1-3)<InfoTooltip content="Likelihood reflects how probable it is that this risk could occur based on the business model, products, delivery channels, and client profile. 1 = Low, 2 = Moderate, 3 = High." /></Label>
                          <Select value={String(risk.inherent_likelihood_score || '')} onValueChange={v => updateRiskScore(risk, 'inherent_likelihood_score', v)} disabled={isLocked}>
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
                          <Select value={String(risk.inherent_impact_score || '')} onValueChange={v => updateRiskScore(risk, 'inherent_impact_score', v)} disabled={isLocked}>
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
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Analyst Rationale</Label>
                          {!isLocked && (
                            <div className="flex gap-1">
                              {risk.analyst_rationale && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditNarrative({ risk, narrative: risk.analyst_rationale })}
                                  className="h-6 px-2 text-xs gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => generateRiskNarrative(risk)}
                                disabled={generatingNarrative === risk.id}
                                className="h-6 px-2 text-xs gap-1"
                              >
                                <Sparkles className="w-3 h-3" /> {generatingNarrative === risk.id ? 'Generating...' : 'Generate Narrative'}
                              </Button>
                            </div>
                          )}
                        </div>
                        <Textarea value={risk.analyst_rationale || ''} rows={6} disabled={isLocked} onChange={e => !isLocked && base44.entities.EngagementRisk.update(risk.id, { analyst_rationale: e.target.value })} placeholder="Professional consulting narrative for this risk..." />
                      </div>
                      <div className="mb-3">
                        <Label className="text-xs flex items-center gap-1">
                          Score Justification
                          <InfoTooltip content="Required if your likelihood or impact score differs from the library default. Briefly explain the client-specific reason." />
                        </Label>
                        <Textarea
                          value={risk.score_justification || ''}
                          rows={2}
                          disabled={isLocked}
                          placeholder="Explain if score differs from library default..."
                          onChange={e => !isLocked && base44.entities.EngagementRisk.update(risk.id, { score_justification: e.target.value })}
                          onBlur={e => !isLocked && saveJustification(risk, e.target.value)}
                        />
                        {!risk.score_justification && (risk.inherent_likelihood_score || risk.inherent_impact_score) && (
                          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Justification recommended when overriding default scores.
                          </p>
                        )}
                      </div>
                      {/* Controls subsection */}
                      {(getRecommendedControlsForRisk(risk).length > 0 || getManualControlsForRisk(risk).length > 0) && (
                        <div className="border-t border-slate-200 pt-3 space-y-3">
                          {getRecommendedControlsForRisk(risk).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 mb-2">Recommended Controls</p>
                              <div className="space-y-1.5">
                                {getRecommendedControlsForRisk(risk).map(ctrl => (
                                  <div key={ctrl.id} className="flex items-center justify-between px-3 py-2 bg-white rounded border border-slate-200">
                                    <div>
                                      <p className="text-xs font-medium text-slate-900">{ctrl.control_name}</p>
                                      <p className="text-[10px] text-slate-500">{ctrl.control_category}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">{ctrl.control_rating || 'Not Assessed'}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {getManualControlsForRisk(risk).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 mb-2">Additional Controls</p>
                              <div className="space-y-1.5">
                                {getManualControlsForRisk(risk).map(ctrl => (
                                  <div key={ctrl.id} className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded border border-blue-200">
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <p className="text-xs font-medium text-slate-900">{ctrl.control_name}</p>
                                        <p className="text-[10px] text-slate-500">{ctrl.control_category}</p>
                                      </div>
                                      <Badge className="bg-blue-600 text-white text-[10px] h-4">Manual Control</Badge>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">{ctrl.control_rating || 'Not Assessed'}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setExplainRisk(risk)} className="gap-1 text-xs h-7">
                            <Info className="w-3 h-3" /> Explain Score
                          </Button>
                          {!isLocked && (
                            <Button variant="outline" size="sm" onClick={() => setAddControlToRisk(risk)} className="gap-1 text-xs h-7">
                              <Plus className="w-3 h-3" /> Add Control from Library
                            </Button>
                          )}
                        </div>
                        {!isLocked && (
                          <Button variant="ghost" size="sm" onClick={() => removeRisk(risk.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Explain Score Dialog */}
      <Dialog open={!!explainRisk} onOpenChange={() => setExplainRisk(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Score Explanation — {explainRisk?.risk_name}</DialogTitle>
          </DialogHeader>
          {explainRisk && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Likelihood Input', explainRisk.inherent_likelihood_rating || `Score: ${explainRisk.inherent_likelihood_score || '—'}`],
                  ['Impact Input', explainRisk.inherent_impact_rating || `Score: ${explainRisk.inherent_impact_score || '—'}`],
                  ['Inherent Risk', explainRisk.inherent_risk_rating || '—'],
                  ['Control Effectiveness', explainRisk.overall_control_effectiveness || 'Not Assessed'],
                  ['Residual Risk', explainRisk.residual_risk_rating || 'Not Calculated'],
                  ['Risk Category', explainRisk.risk_category || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{label}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600">
                <p className="font-semibold text-slate-700 mb-1">Calculation Logic</p>
                <p>Inherent Risk = Likelihood × Impact. Score 1–2 = Low, 3–4 = Moderate, 6–9 = High.</p>
                <p className="mt-1">Residual Risk = Inherent Risk adjusted for Control Effectiveness. Weak controls elevate residual risk; Strong controls reduce it.</p>
              </div>
              {explainRisk.score_justification && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Analyst Justification</p>
                  <p className="text-xs text-blue-900">{explainRisk.score_justification}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Edit Narrative Dialog */}
      <Dialog open={!!editNarrative} onOpenChange={() => setEditNarrative(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Risk Narrative — {editNarrative?.risk?.risk_name}</DialogTitle>
          </DialogHeader>
          <Textarea 
            value={editNarrative?.narrative || ''} 
            onChange={e => setEditNarrative({ ...editNarrative, narrative: e.target.value })}
            rows={16}
            className="font-serif text-sm leading-relaxed"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditNarrative(null)}>Cancel</Button>
            <Button onClick={() => saveEditedNarrative(editNarrative.risk, editNarrative.narrative)}>
              Save Narrative
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Control from Library Dialog */}
      <Dialog open={!!addControlToRisk} onOpenChange={() => { setAddControlToRisk(null); setControlSearchQuery(''); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Control from Library</DialogTitle>
            <p className="text-xs text-slate-500 mt-1">Risk: {addControlToRisk?.risk_name}</p>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by control name, category, or regulatory reference..." 
              value={controlSearchQuery}
              onChange={e => setControlSearchQuery(e.target.value)}
              className="pl-9"
            />
            {controlSearchQuery && (
              <button onClick={() => setControlSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {controlLibrary
              .filter(c => {
                if (!controlSearchQuery) return true;
                const q = controlSearchQuery.toLowerCase();
                return (
                  c.control_name?.toLowerCase().includes(q) ||
                  c.control_category?.toLowerCase().includes(q) ||
                  c.regulatory_reference?.toLowerCase().includes(q)
                );
              })
              .map(ctrl => (
                <div key={ctrl.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{ctrl.control_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ctrl.control_category}</p>
                    {ctrl.regulatory_reference && (
                      <p className="text-[10px] text-slate-400 mt-1">Ref: {ctrl.regulatory_reference}</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => attachManualControl(addControlToRisk, ctrl)} className="ml-3 flex-shrink-0">
                    Add
                  </Button>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}