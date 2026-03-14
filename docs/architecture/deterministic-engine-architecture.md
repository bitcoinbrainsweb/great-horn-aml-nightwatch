# Deterministic Assessment Engine — Architecture Reference

> Archived from `src/pages/DeterministicEngineArchitecture.jsx` during NW-UPGRADE-068B.

---

## Architecture

A deterministic computation layer that processes all risk logic before narrative generation. Findings are stored as structured facts, enabling LLM prompts to be minimal, auditable, and deterministic.

## Computation Flow

1. **Risk Profile Finding** — Load risk library entry, mapped controls, scoring data
2. **Control Gap Finding** — Compare required vs. implemented controls, classify severity
3. **Control Effectiveness Finding** — Calculate effectiveness score: (implemented + compensating*0.5) / total
4. **Residual Risk Finding** — Apply Balanced formula: InherentRisk - (ControlEffectiveness / 2)
5. **Recommendation Finding** — Map gaps to remediation controls and priorities
6. **Narrative Rendering** — LLM consumes findings through GenerationContracts only

## Core Entities

### AssessmentFinding
Stores deterministic computation results.

| Field | Description |
|---|---|
| findingType | risk_profile, control_gap, control_effectiveness, residual_risk, recommendation_candidate |
| inputs | JSON inputs used for computation |
| result | JSON result of computation |
| inputHash | SHA-256(inputs + rulesApplied + dependencies) for invalidation tracking |
| dependsOnFindingIds | Upstream findings this depends on |
| status | pending, computed, invalidated, recomputed |
| DecisionTraceRefs | Links to reasoning steps |

### DecisionTrace
Records reasoning behind each computation.

| Field | Description |
|---|---|
| object_type | risk, control, gap, score, narrative, recommendation |
| input_snapshot | JSON of inputs evaluated |
| rules_triggered | Which rules/conditions matched |
| calculations_performed | Intermediate values and steps |
| output_snapshot | JSON of final result |

## Backend Functions

- **deterministicRiskEngine** — Orchestrates finding computation for selected risks. Creates findings for gaps, effectiveness, and residual risk.
- **controlEffectivenessCalculator** — Computes control effectiveness score: (implemented + compensating*0.5) / totalMapped.
- **residualRiskCalculator** — Computes residual risk using Balanced formula. Depends on control effectiveness finding.
- **recommendationEngine** — Generates remediation recommendations from gaps and jurisdiction relevance.

## Key Patterns

### Finding Hashing
Each finding stores inputHash = SHA-256(inputs + rulesApplied + dependsOnFindingIds). If hash unchanged on recompute, skip expensive regeneration.

### Dependency Graph
control_gap -> control_effectiveness -> residual_risk. If upstream finding invalidated, dependent findings marked invalid.

### Prompt Guardrail
promptController validates payloads: rejects RiskLibrary, ControlLibrary, AssessmentState objects. Max payload size 10KB. Only contract-defined fields allowed.

### Contract-Finding Integration
AssessmentFinding -> GenerationContract input schema -> PromptTemplate -> LLM narrative. LLM sees only finding result + contract fields, not raw libraries.

## Performance Impact

- **Prompt Size Reduction:** Before: 50-100 KB (full AssessmentState + libraries). After: 2-5 KB (contract fields + finding result only). Reduction: 90-95%.
- **LLM Load Reduction:** LLM no longer performs risk analysis, scoring, or gap evaluation. Only renders structured findings into narrative prose. Expected latency reduction: 30-50%.
- **Caching Ready:** Findings are deterministic and hashable, enabling template + finding caching, batch precomputation, and result deduplication across similar assessments.

## Security & Compliance

- Prompt payloads validated against GenerationContract input schema
- Forbidden fields rejected: RiskLibrary, ControlLibrary, AssessmentState, fullContext
- Payload size limited to 10KB (prevents context injection)
- All findings recorded with DecisionTraces for auditability
- Output validation enforces schema compliance
- Hash-based invalidation prevents stale findings
