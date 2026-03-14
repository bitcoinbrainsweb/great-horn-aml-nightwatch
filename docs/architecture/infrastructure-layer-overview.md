# NIGHTWATCH Infrastructure Layer — Architecture Reference

> Archived from `src/pages/InfrastructureLayerOverview.jsx` during NW-UPGRADE-068B.

---

## Infrastructure Components

| Component | Description |
|---|---|
| Library Cache | Caches RiskLibrary, ControlLibrary, JurisdictionRules with hash-based matching |
| Narrative Cache | Caches LLM-rendered narratives with input hash matching |
| Execution Metrics | Tracks token usage, latency, cache hits, and cost |
| System Events | Chronological event timeline for debugging and auditing |
| Help Documentation | Auto-generated and manual documentation entities |
| Page Help | Page-specific guidance and common mistakes |

## Backend Functions

- **libraryCachingLayer** — Caches libraries with hash-based matching
- **narrativeCachingLayer** — Caches LLM narratives by input hash
- **executionMetricsRecorder** — Records token and performance metrics
- **systemEventLogger** — Logs system events for timeline
- **documentationGenerator** — Auto-generates help documentation
- **pageExplanationGenerator** — Creates page-specific guidance
- **verifyInfrastructureLayer** — Verification checks
- **comprehensiveSystemAudit** — Full system audit report

## Performance Benefits

- **Library Loading:** 90% cache hit rate expected. Reuse cached libraries across assessments.
- **Narrative Generation:** 20-30% of narratives reused from cache. Reduces LLM calls and latency.
- **Cost Reduction:** Combined caching (library + narrative) reduces LLM usage by 50-70%.
- **Debugging & Observability:** SystemEvent timeline and ExecutionMetrics enable root cause analysis.

## Integration Architecture

```
Library Layer
  ↓ (via libraryCachingLayer)
Deterministic Engine
  ↓ (via systemEventLogger)
AssessmentFinding + DecisionTrace
  ↓ (via narrativeCachingLayer)
Generation Contracts + Prompt Templates
  ↓ (via executionMetricsRecorder)
Narrative Rendering (LLM)
  ↓
Report Assembly
```
