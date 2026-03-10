import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { Zap, GitBranch, Lock, Database } from 'lucide-react';

export default function DeterministicEngineArchitecture() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Deterministic Assessment Engine"
        subtitle="Findings layer decouples risk logic from narrative generation"
      />

      {/* Overview */}
      <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-2">🔧 Architecture</h2>
        <p className="text-sm text-blue-800">
          A deterministic computation layer that processes all risk logic before narrative generation. Findings are stored as structured facts, enabling LLM prompts to be minimal, auditable, and deterministic.
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Computation Flow</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
            <div className="flex-1 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="font-semibold text-blue-900">Risk Profile Finding</p>
              <p className="text-xs text-blue-800 mt-1">Load risk library entry, mapped controls, scoring data</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">2</div>
            <div className="flex-1 p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="font-semibold text-purple-900">Control Gap Finding</p>
              <p className="text-xs text-purple-800 mt-1">Compare required vs. implemented controls, classify severity</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">3</div>
            <div className="flex-1 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="font-semibold text-amber-900">Control Effectiveness Finding</p>
              <p className="text-xs text-amber-800 mt-1">Calculate effectiveness score: (implemented + compensating*0.5) / total</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">4</div>
            <div className="flex-1 p-4 rounded-lg bg-rose-50 border border-rose-200">
              <p className="font-semibold text-rose-900">Residual Risk Finding</p>
              <p className="text-xs text-rose-800 mt-1">Apply Balanced formula: InherentRisk - (ControlEffectiveness / 2)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">5</div>
            <div className="flex-1 p-4 rounded-lg bg-teal-50 border border-teal-200">
              <p className="font-semibold text-teal-900">Recommendation Finding</p>
              <p className="text-xs text-teal-800 mt-1">Map gaps to remediation controls and priorities</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">6</div>
            <div className="flex-1 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="font-semibold text-emerald-900">Narrative Rendering</p>
              <p className="text-xs text-emerald-800 mt-1">LLM consumes findings through GenerationContracts only</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Entities */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" /> Core Entities
        </h3>
        
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">AssessmentFinding</p>
            <p className="text-xs text-slate-600 mt-2">Stores deterministic computation results. Fields:</p>
            <ul className="text-xs text-slate-600 mt-2 ml-4 space-y-1">
              <li>• findingType: risk_profile, control_gap, control_effectiveness, residual_risk, recommendation_candidate</li>
              <li>• inputs: JSON inputs used for computation</li>
              <li>• result: JSON result of computation</li>
              <li>• inputHash: SHA-256(inputs + rulesApplied + dependencies) for invalidation tracking</li>
              <li>• dependsOnFindingIds: Upstream findings this depends on</li>
              <li>• status: pending | computed | invalidated | recomputed</li>
              <li>• DecisionTraceRefs: Links to reasoning steps</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">DecisionTrace</p>
            <p className="text-xs text-slate-600 mt-2">Records reasoning behind each computation:</p>
            <ul className="text-xs text-slate-600 mt-2 ml-4 space-y-1">
              <li>• object_type: risk, control, gap, score, narrative, recommendation</li>
              <li>• input_snapshot: JSON of inputs evaluated</li>
              <li>• rules_triggered: Which rules/conditions matched</li>
              <li>• calculations_performed: Intermediate values and steps</li>
              <li>• output_snapshot: JSON of final result</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Functions */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Backend Functions
        </h3>
        
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">deterministicRiskEngine</p>
            <p className="text-xs text-slate-600 mt-2">
              Orchestrates finding computation for selected risks. Creates findings for gaps, effectiveness, and residual risk.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">controlEffectivenessCalculator</p>
            <p className="text-xs text-slate-600 mt-2">
              Computes control effectiveness score: (implemented + compensating*0.5) / totalMapped.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">residualRiskCalculator</p>
            <p className="text-xs text-slate-600 mt-2">
              Computes residual risk using Balanced formula. Depends on control effectiveness finding.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">recommendationEngine</p>
            <p className="text-xs text-slate-600 mt-2">
              Generates remediation recommendations from gaps and jurisdiction relevance.
            </p>
          </div>
        </div>
      </div>

      {/* Key Patterns */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5" /> Key Patterns
        </h3>
        
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">Finding Hashing</p>
            <p className="text-xs text-slate-600 mt-2">
              Each finding stores inputHash = SHA-256(inputs + rulesApplied + dependsOnFindingIds). 
              If hash unchanged on recompute, skip expensive regeneration.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">Dependency Graph</p>
            <p className="text-xs text-slate-600 mt-2">
              control_gap → control_effectiveness → residual_risk. 
              If upstream finding invalidated, dependent findings marked invalid.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">Prompt Guardrail</p>
            <p className="text-xs text-slate-600 mt-2">
              promptController validates payloads: rejects RiskLibrary, ControlLibrary, AssessmentState objects. 
              Max payload size 10KB. Only contract-defined fields allowed.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-900">Contract-Finding Integration</p>
            <p className="text-xs text-slate-600 mt-2">
              AssessmentFinding → GenerationContract input schema → PromptTemplate → LLM narrative.
              LLM sees only finding result + contract fields, not raw libraries.
            </p>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Performance Impact
        </h3>
        
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="font-semibold text-emerald-900">Prompt Size Reduction</p>
            <p className="text-xs text-emerald-800 mt-2">
              Before: 50-100 KB (full AssessmentState + libraries)
              After: 2-5 KB (contract fields + finding result only)
              Reduction: 90-95%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="font-semibold text-emerald-900">LLM Load Reduction</p>
            <p className="text-xs text-emerald-800 mt-2">
              LLM no longer performs risk analysis, scoring, or gap evaluation.
              Only renders structured findings into narrative prose.
              Expected latency reduction: 30-50%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="font-semibold text-emerald-900">Caching Ready</p>
            <p className="text-xs text-emerald-800 mt-2">
              Findings are deterministic and hashable, enabling:
              - Template + finding caching
              - Batch precomputation
              - Result deduplication across similar assessments
            </p>
          </div>
        </div>
      </div>

      {/* Guardrails */}
      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Lock className="w-5 h-5" /> Security & Compliance
        </h3>
        <ul className="text-sm text-slate-700 space-y-2">
          <li>✅ Prompt payloads validated against GenerationContract input schema</li>
          <li>✅ Forbidden fields rejected: RiskLibrary, ControlLibrary, AssessmentState, fullContext</li>
          <li>✅ Payload size limited to 10KB (prevents context injection)</li>
          <li>✅ All findings recorded with DecisionTraces for auditability</li>
          <li>✅ Output validation enforces schema compliance</li>
          <li>✅ Hash-based invalidation prevents stale findings</li>
        </ul>
      </div>
    </div>
  );
}