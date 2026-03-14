# Template-Driven Prompt System v1 — Architecture Reference

> Archived from `src/pages/PromptTemplateSystemSummary.jsx` during NW-UPGRADE-068B.

---

## System Architecture

### 1. GenerationContract Entity
Defines strict schemas for narrative generation. Each contract specifies:
- Required input fields (riskId, scores, jurisdiction, etc.)
- Allowed fields only (additionalProperties: false)
- Expected output schema
- Field type validation
- Min/max length constraints

### 2. PromptTemplate Entity
Reusable prompt templates with `{{placeholder}}` syntax:
- Templates reference contract fields only
- Small, deterministic, cacheable
- Version-controlled
- Linked to specific contracts

### 3. contractValidator Function
Validates inputs before generation:
- Checks required fields present
- Rejects unsupported fields
- Validates field types
- Enforces length constraints
- Raises structured errors

### 4. promptTemplateRenderer Function
Renders templates with validated data:
- Injects contract fields into `{{placeholders}}`
- Detects missing fields
- Returns clean prompt text
- Tracks fields used

### 5. promptController Function
Orchestrates the full generation pipeline:
1. Retrieve contract
2. Validate inputs
3. Retrieve template
4. Render prompt
5. Execute generator function
6. Validate outputs
7. Write narrative to AssessmentState

## Generation Contracts

| Contract | Inputs | Output |
|---|---|---|
| RiskNarrative | riskId, riskName, riskDescription, inherentRiskScore, [jurisdiction, riskGroup, decisionTraces] | riskNarrative (100-5000 chars) + generatedAt |
| ControlAnalysis | riskId, requiredControls[], implementedControls[], controlGaps[], [gapSeverity, decisionTraces] | controlAnalysisNarrative (100-5000 chars) + gapSummary |
| ResidualRisk | riskId, inherentRiskScore, controlEffectivenessScore, residualRiskScore, residualRiskLevel, [jurisdiction] | residualRiskNarrative (100-5000 chars) + riskAcceptance |
| Recommendation | riskId, identifiedGaps[], suggestedControls[], [gapSeverity, jurisdiction] | recommendationNarrative (100-5000 chars) + actionItems[] |

## Prompt Templates

- **RiskNarrativeTemplate_v1** — Risk narrative generation prompt
- **ControlAnalysisTemplate_v1** — Control effectiveness analysis prompt
- **ResidualRiskTemplate_v1** — Residual risk assessment prompt
- **RecommendationTemplate_v1** — Remediation recommendation prompt

## Generation Functions

- **generateRiskNarrative** — LLM -> riskNarrative (length-validated)
- **generateControlAnalysis** — LLM -> controlAnalysisNarrative + gapSummary
- **generateResidualRisk** — LLM -> residualRiskNarrative + riskAcceptance
- **generateRecommendation** — LLM -> recommendationNarrative + actionItems[]

## Key Benefits

- **Deterministic Architecture:** Templates + contracts enable caching, precomputation, and reproducible outputs
- **Strict Input/Output Validation:** No more arbitrary context. Only contract-defined fields flow to LLM. Outputs validated against schema.
- **Minimal Prompt Payloads:** Prompts contain only required data + template (~2-3 KB vs. previous ~50-100 KB full-context)
- **Maintainable & Version-Controlled:** Contracts and templates are entities, versionable, auditable, and easily updated without code changes
- **Ready for Narrative Rendering Layer:** Foundation prepared for deterministic report generation and batch narrative precomputation

## Integration Path

1. Update RisksTab/ControlsTab to call promptController instead of direct LLM
2. Replace current narrative generation flows with contract-validated inputs
3. Map existing LLM calls to appropriate contracts (RiskNarrative, ControlAnalysis, etc.)
4. Leverage contractValidator to prevent invalid data flows
5. Enable template caching and precomputation for batch narrative generation
