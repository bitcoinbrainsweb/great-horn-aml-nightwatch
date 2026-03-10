import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { INTAKE_SECTIONS } from '../scoring/intakeQuestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Save, Lock } from 'lucide-react';

export default function IntakeTab({ engagement, isLocked }) {
  const [sections, setSections] = useState({});
  const [savedSections, setSavedSections] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [intakeRecords, setIntakeRecords] = useState([]);

  useEffect(() => { loadIntake(); }, [engagement.id]);

  async function loadIntake() {
    const records = await base44.entities.IntakeResponse.filter({ engagement_id: engagement.id });
    setIntakeRecords(records);
    const data = {};
    const saved = {};
    records.forEach(r => {
      data[r.section] = r.responses || {};
      saved[r.section] = true;
    });
    setSections(data);
    setSavedSections(saved);
    if (!activeSection) {
      setActiveSection(filteredSections[0]?.id);
    }
  }

  const methodology = engagement.methodology_name || '';
  const filteredSections = INTAKE_SECTIONS.filter(s => {
    if (!s.methodology) return true;
    return methodology.includes(s.methodology.replace(' EWRA', ''));
  });

  function updateField(sectionId, key, value) {
    setSections(prev => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [key]: value }
    }));
    setSavedSections(prev => ({ ...prev, [sectionId]: false }));
  }

  async function saveSection(sectionId) {
    setSaving(true);
    const existing = intakeRecords.find(r => r.section === sectionId);
    if (existing) {
      await base44.entities.IntakeResponse.update(existing.id, { responses: sections[sectionId] || {} });
    } else {
      await base44.entities.IntakeResponse.create({
        engagement_id: engagement.id,
        section: sectionId,
        responses: sections[sectionId] || {}
      });
    }
    await loadIntake();
    setSaving(false);
  }

  const currentSection = filteredSections.find(s => s.id === activeSection);

  return (
    <div className="space-y-4">
    {isLocked && (
      <div className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-600">
        <Lock className="w-4 h-4 flex-shrink-0 text-slate-500" />
        This engagement is locked. Intake responses are read-only.
      </div>
    )}
    <div className="flex gap-6">
      {/* Section nav */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <div className="bg-white rounded-xl border border-slate-200/60 p-3 sticky top-20">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Sections</p>
          <div className="space-y-0.5">
            {filteredSections.map(s => {
              const isComplete = savedSections[s.id];
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs transition-colors ${
                    isActive ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="flex-1 min-w-0">
        {/* Mobile section selector */}
        <div className="lg:hidden mb-4">
          <Select value={activeSection || ''} onValueChange={setActiveSection}>
            <SelectTrigger><SelectValue placeholder="Select section..." /></SelectTrigger>
            <SelectContent>
              {filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {currentSection && (
          <div className="bg-white rounded-xl border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">{currentSection.title}</h3>
              {!isLocked && (
                <Button onClick={() => saveSection(currentSection.id)} disabled={saving} className="gap-2 bg-slate-900 hover:bg-slate-800">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Section'}
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {currentSection.questions.map(q => {
                const value = sections[currentSection.id]?.[q.key];
                return (
                  <div key={q.key} className="space-y-1.5">
                    <Label className="text-sm">{q.label}</Label>
                    {q.type === 'boolean' ? (
                      <div className="flex items-center gap-3">
                        <Switch checked={value === true || value === 'yes'} onCheckedChange={v => !isLocked && updateField(currentSection.id, q.key, v)} disabled={isLocked} />
                        <span className="text-sm text-slate-600">{value === true || value === 'yes' ? 'Yes' : 'No'}</span>
                      </div>
                    ) : q.type === 'select' ? (
                      <Select value={value || ''} onValueChange={v => updateField(currentSection.id, q.key, v)} disabled={isLocked}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {q.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : q.type === 'textarea' ? (
                      <Textarea value={value || ''} onChange={e => updateField(currentSection.id, q.key, e.target.value)} rows={3} disabled={isLocked} />
                    ) : q.type === 'number' ? (
                      <Input type="number" value={value || ''} onChange={e => updateField(currentSection.id, q.key, e.target.value)} disabled={isLocked} />
                    ) : (
                      <Input value={value || ''} onChange={e => updateField(currentSection.id, q.key, e.target.value)} disabled={isLocked} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}