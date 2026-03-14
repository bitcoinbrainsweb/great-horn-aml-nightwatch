# NW-UPGRADE-069C — Build Gate + Bootstrap Foundation (Sanity Check)

**Upgrade ID:** NW-UPGRADE-069C  
**Risk:** LOW — documentation/infrastructure only, no code changes

---

## Current State

### Workflow Files
- **No master workflow doc exists.** Conventions are implicit in conversation history and prompt templates.
- **No `.cursor/rules/` or `AGENTS.md`.** Protocol is enforced manually via prompt standards.
- **No `project-bootstrap/` folder.** Templates do not yet exist.

### Current Protocol Sequence
Observed from 11 completed upgrades (032–068C):

```
SANITYCHECK → REVIEW (if medium/high) → IMPLEMENT → RESULT
```

Artifact naming convention: `docs/NW-UPGRADE-XXX_SANITYCHECK.md`, `_REVIEW.md`, `_RESULT.md`

### Conventions to Extract for Bootstrap
- Kernel: upgrade ID, product version, canonical context, scope constraints, "do not modify" guardrails
- Session brief: objective, scope, standing rules, execution sequence, outputs
- Tool roles: Cursor (implementation), ChatGPT (review/architecture), user (decisions/GATE)
- Upgrade protocol: the SANITYCHECK → REVIEW → IMPLEMENT → RESULT → GATE sequence
- Gate: go/no-go binary decision artifact

---

## What Changes

| Area | Change |
|---|---|
| Protocol | Add GATE as 5th mandatory step |
| Master workflow doc | Create `docs/NIGHTWATCH_WORKFLOW.md` |
| Bootstrap folder | Create `/project-bootstrap/` with 6 templates |
| Existing docs | No modifications needed |

---

## Risk Assessment

- **LOW** — no application code changes
- No domain model impact
- No compliance graph impact
- No routing/UI impact
- Pure documentation/template infrastructure
- Proceed directly without external review
