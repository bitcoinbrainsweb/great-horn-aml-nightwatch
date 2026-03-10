import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RiskBadge } from '../ui/RiskBadge';
import { calculateControlEffectiveness, calculateResidualRisk } from '../scoring/riskScoringEngine';
import { ChevronDown, ChevronRight, Save, Paperclip } from 'lucide-react';
import InfoTooltip from '../ui/InfoTooltip';
import { logAudit } from '../util/auditLog';

export default function ControlsTab({ engagement }) {
  const [engRisks, setEngRisks] = useState([]);
  const [controlAssessments, setControlAssessments] = useState([]);
  const [controlLibrary, setControlLibrary] = useState([]);
  const [riskLibrary, setRiskLibrary] = useState([]);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => { loadData(); }, [engagement.id]);

  async function loadData() {
    const [risks, controls, lib, rLib, me] = await Promise.all([
      base44.entities.EngagementRisk.filter({ engagement_id: engagement.id }),
      base44.entities.ControlAssessment.filter({ engagement_id: engagement.id }),
      base44.entities.ControlLibrary.filter({ status: 'Active' }),
      base44.entities.RiskLibrary.filter({ status: 'Active' }),
      base44.auth.me(),
    ]);
    setEngRisks(risks);
    setControlAssessments(controls);
    setControlLibrary(lib);
    setRiskLibrary(rLib);
    setUser(me);
    setLoading(false);
  }

  function getControlsForRisk(risk) {
    const libRisk = riskLibrary.find(r => r.risk_name === risk.risk_name);
    const linkedNames = libRisk?.linked_control_names || [];
    return controlAssessments.filter(c => c.engagement_risk_id === risk.id);
  }

  async function addSuggestedControls(risk) {
    const libRisk = riskLibrary.find(r => r.risk_name === risk.risk_name);
    const linkedNames = libRisk?.linked_control_names || [];
    const existingNames = controlAssessments.filter(c => c.engagement_risk_id === risk.id).map(c => c.control_name);
    
    const toAdd = linkedNames.filter(name => !existingNames.includes(name));
    for (const name of toAdd) {
      const libControl = controlLibrary.find(c => c.control_name === name);
      const newCtrl = await base44.entities.ControlAssessment.create({
        engagement_risk_id: risk.id,
        engagement_id: engagement.id,
        control_id: libControl?.id || '',
        control_name: name,
        control_category: libControl?.control_category || '',
        control_present: false,
        design_effectiveness: 'Not Assessed',
        operational_effectiveness: 'Not Assessed',
        consistency_of_application: 'Not Assessed',
        control_rating: 'Not Assessed'
      });
      await logAudit({
        userEmail: user?.email,
        objectType: 'ControlAssessment',
        objectId: newCtrl.id,
        action: 'created',
        details: `Control "${name}" added to risk "${risk.risk_name}" on engagement ${engagement.id}`,
      });
    }
    await loadData();
  }

  async function updateControl(controlId, updates) {
    let data = { ...updates };
    
    // If all three effectiveness ratings are set, calculate overall
    const ctrl = controlAssessments.find(c => c.id === controlId);
    const design = updates.design_effectiveness || ctrl?.design_effectiveness;
    const operational = updates.operational_effectiveness || ctrl?.operational_effectiveness;
    const consistency = updates.consistency_of_application || ctrl?.consistency_of_application;
    
    if (design && operational && consistency && design !== 'Not Assessed' && operational !== 'Not Assessed' && consistency !== 'Not Assessed') {
      data.control_rating = calculateControlEffectiveness(design, consistency, operational);
    }
    
    await base44.entities.ControlAssessment.update(controlId, data);

    const changedFields = Object.keys(updates);
    const oldValues = changedFields.map(k => `${k}: ${ctrl?.[k] ?? ''}`).join('; ');
    const newValues = changedFields.map(k => `${k}: ${updates[k]}`).join('; ');
    await logAudit({
      userEmail: user?.email,
      objectType: 'ControlAssessment',
      objectId: controlId,
      action: 'updated',
      fieldChanged: changedFields.join(', '),
      oldValue: oldValues,
      newValue: newValues,
      details: `Control "${ctrl?.control_name}" updated on risk in engagement ${engagement.id}`,
    });

    await loadData();
  }

  async function calculateResiduals(risk) {
    const riskControls = controlAssessments.filter(c => c.engagement_risk_id === risk.id);
    const ratings = riskControls.filter(c => c.control_rating && c.control_rating !== 'Not Assessed').map(c => c.control_rating);
    
    if (ratings.length === 0) return;
    
    // Overall control effectiveness for this risk
    let overallCtrl;
    if (ratings.some(r => r === 'Weak')) overallCtrl = 'Weak';
    else if (ratings.every(r => r === 'Strong')) overallCtrl = 'Strong';
    else overallCtrl = 'Partially Effective';

    const residual = risk.inherent_risk_rating ? calculateResidualRisk(risk.inherent_risk_rating, overallCtrl) : null;
    
    await base44.entities.EngagementRisk.update(risk.id, {
      design_adequacy_rating: overallCtrl,
      overall_control_effectiveness: overallCtrl,
      residual_risk_rating: residual
    });
    await logAudit({
      userEmail: user?.email,
      objectType: 'EngagementRisk',
      objectId: risk.id,
      action: 'residual_calculated',
      fieldChanged: 'residual_risk_rating, overall_control_effectiveness',
      oldValue: `residual: ${risk.residual_risk_rating ?? 'unset'}`,
      newValue: `residual: ${residual}, controls: ${overallCtrl}`,
      details: `Residual risk calculated for "${risk.risk_name}": inherent ${risk.inherent_risk_rating} + controls ${overallCtrl} = ${residual}`,
    });
    await loadData();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Assess controls for each identified risk. Controls are suggested based on the risk library mappings.</p>

      {engRisks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-8 text-center">
          <p className="text-sm text-slate-500">No risks to assess controls for. Add risks first.</p>
        </div>
      ) : (
        engRisks.map(risk => {
          const riskControls = getControlsForRisk(risk);
          const isExpanded = expandedRisk === risk.id;
          
          return (
            <div key={risk.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
              <div 
                className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{risk.risk_name}</p>
                    <p className="text-xs text-slate-500">{risk.risk_category} · {riskControls.length} controls</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge rating={risk.inherent_risk_rating} />
                  <span className="text-xs text-slate-400">→</span>
                  <RiskBadge rating={risk.residual_risk_rating} />
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 py-4 border-t border-slate-100 space-y-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addSuggestedControls(risk)}>
                      Add Suggested Controls
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => calculateResiduals(risk)} className="gap-1">
                      <Save className="w-3.5 h-3.5" /> Calculate Residual
                    </Button>
                  </div>

                  {riskControls.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No controls added. Click "Add Suggested Controls" to begin.</p>
                  ) : (
                    <div className="space-y-3">
                      {riskControls.map(ctrl => (
                        <div key={ctrl.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{ctrl.control_name}</p>
                              <p className="text-xs text-slate-500">{ctrl.control_category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Present</Label>
                              <Switch checked={ctrl.control_present} onCheckedChange={v => updateControl(ctrl.id, { control_present: v })} />
                            </div>
                          </div>
                          {ctrl.control_present && (
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs flex items-center">Design<InfoTooltip content="Design adequacy: Is the control appropriately designed to mitigate the risk? Does it address the right threat vectors?" /></Label>
                                <Select value={ctrl.design_effectiveness || ''} onValueChange={v => updateControl(ctrl.id, { design_effectiveness: v })}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Rate..." /></SelectTrigger>
                                  <SelectContent>
                                    {['Strong', 'Partially Effective', 'Weak'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs flex items-center">Operational<InfoTooltip content="Operational performance: Is the control functioning in practice? Is there evidence of effective operation?" /></Label>
                                <Select value={ctrl.operational_effectiveness || ''} onValueChange={v => updateControl(ctrl.id, { operational_effectiveness: v })}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Rate..." /></SelectTrigger>
                                  <SelectContent>
                                    {['Strong', 'Partially Effective', 'Weak'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs flex items-center">Consistency<InfoTooltip content="Consistency of application: Is the control applied consistently across the organization, channels, and staff?" /></Label>
                                <Select value={ctrl.consistency_of_application || ''} onValueChange={v => updateControl(ctrl.id, { consistency_of_application: v })}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Rate..." /></SelectTrigger>
                                  <SelectContent>
                                    {['Strong', 'Partially Effective', 'Weak'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          {ctrl.control_rating && ctrl.control_rating !== 'Not Assessed' && (
                            <p className="text-xs"><span className="text-slate-500">Overall:</span> <span className="font-semibold">{ctrl.control_rating}</span></p>
                          )}
                          {/* Evidence & Testing */}
                          {ctrl.control_present && (
                            <div className="border-t border-slate-200/60 pt-3 space-y-2 mt-1">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Paperclip className="w-3 h-3" /> Evidence & Testing</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Evidence Reference</Label>
                                  <Textarea rows={2} className="text-xs mt-0.5" placeholder="Document title, file reference..." value={ctrl.evidence_reference || ''} onChange={e => updateControl(ctrl.id, { evidence_reference: e.target.value })} />
                                </div>
                                <div>
                                  <Label className="text-xs">Sample Size</Label>
                                  <input className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-0.5" placeholder="e.g. 25 transactions" value={ctrl.sample_size || ''} onChange={e => updateControl(ctrl.id, { sample_size: e.target.value })} />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Testing Notes</Label>
                                <Textarea rows={2} className="text-xs mt-0.5" placeholder="Testing approach and methodology..." value={ctrl.testing_notes || ''} onChange={e => updateControl(ctrl.id, { testing_notes: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Sample Results</Label>
                                <Textarea rows={2} className="text-xs mt-0.5" placeholder="Summary of sample testing results..." value={ctrl.sample_results || ''} onChange={e => updateControl(ctrl.id, { sample_results: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Reviewer Notes</Label>
                                <Textarea rows={2} className="text-xs mt-0.5" placeholder="Reviewer comments on this control..." value={ctrl.reviewer_notes || ''} onChange={e => updateControl(ctrl.id, { reviewer_notes: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Testing Conclusion</Label>
                                <Textarea rows={2} className="text-xs mt-0.5" placeholder="Overall conclusion on control effectiveness based on evidence and testing..." value={ctrl.testing_conclusion || ''} onChange={e => updateControl(ctrl.id, { testing_conclusion: e.target.value })} />
                              </div>
                            </div>
                            {/* Reviewer Sign-Off */}
                            <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 mt-1">
                              <div>
                                <p className="text-xs font-medium text-slate-700">Reviewer Sign-Off</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {ctrl.reviewer_sign_off
                                    ? `Signed off${ctrl.reviewer_sign_off_date ? ` on ${ctrl.reviewer_sign_off_date}` : ''}`
                                    : 'Not yet signed off by reviewer'}
                                </p>
                              </div>
                              <Switch
                                checked={!!ctrl.reviewer_sign_off}
                                onCheckedChange={v => updateControl(ctrl.id, {
                                  reviewer_sign_off: v,
                                  reviewer_sign_off_date: v ? new Date().toISOString().split('T')[0] : null,
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}