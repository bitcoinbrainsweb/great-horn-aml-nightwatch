# Nightwatch — AI Development Operating System Workflow

---

## Overview

Nightwatch uses an **AI development operating system** workflow to coordinate implementation, review, and deployment across AI tools and human decision-makers.

The workflow enforces:
- Sequential, controlled upgrades
- Mandatory pre-implementation sanity checks
- Risk-gated review escalation
- Post-implementation GATE approval before any next upgrade

---

## Upgrade Protocol

Every upgrade follows this exact sequence. No steps may be skipped.

```
SANITYCHECK → REVIEW (if medium/high risk) → IMPLEMENT → RESULT → GATE
```

### Step 1 — SANITYCHECK
Assess scope, risk, and readiness. Classify risk as LOW / MEDIUM / HIGH.

**Artifact:** `docs/[UPGRADE_ID]_SANITYCHECK.md`

### Step 2 — REVIEW (conditional)
Required when risk is MEDIUM or HIGH. Provides the implementation plan, risk analysis, and rollback strategy.

**Artifact:** `docs/[UPGRADE_ID]_REVIEW.md`

### Step 3 — IMPLEMENT
Execute the smallest durable change set. Sequential execution only.

### Step 4 — RESULT
Document what was done, what was validated, and what follow-ups remain.

**Artifact:** `docs/[UPGRADE_ID]_RESULT.md`

### Step 5 — GATE
Produce the canonical go/no-go decision artifact. This is a concise, binary, operational record — not a report.

**Artifact:** `docs/[UPGRADE_ID]_GATE.md`

**Hard rule:** No next upgrade proceeds until a GATE file exists with a VERDICT.

---

## Tool Roles

| Tool | Role | Produces |
|---|---|---|
| **Cursor** | Implementation agent | Code changes, SANITYCHECK, REVIEW, RESULT, GATE |
| **ChatGPT** | Architecture advisor | Risk assessments, architecture guidance |
| **User** | Decision authority | Scope, approval, GATE verdict review |
| **Browser Use** | Smoke test agent *(future)* | Automated smoke test results for GATE |

---

## GATE Artifact Structure

```
BUILD:          [UPGRADE_ID]
DATE:           [YYYY-MM-DD]
SMOKE TEST:     [PASS / FAIL / SKIPPED — reason]
CHECKLIST:      [verification items, each PASS/FAIL]
VERDICT:        [GO / NO-GO]
FAILURE REASON: [if NO-GO]
ESCALATION:     [if NO-GO, who/what]
NEXT ACTION:    [next upgrade ID or follow-up]
```

---

## Project Bootstrap

Reusable templates for the AI development operating system are located in:

```
/project-bootstrap/
  KERNEL_TEMPLATE.txt        — Project identity and standing rules
  SESSION_BRIEF_TEMPLATE.txt — Per-upgrade prompt structure
  TOOL_ROLES.txt             — Tool responsibility matrix
  UPGRADE_PROTOCOL.txt       — Full protocol reference
  GATE_TEMPLATE.txt          — GATE artifact template
  ADAPTATION_GUIDE.txt       — 5-question setup for new projects
```

These templates codify the Nightwatch workflow conventions so they can be adapted to other projects.

---

## Standing Rules

1. Follow the upgrade protocol exactly.
2. Preserve prior verified fixes unless explicitly replacing them.
3. Make the smallest durable fix.
4. Do not create throwaway debug or upgrade pages.
5. Do not modify protected systems without explicit scope.
6. Sequential execution only within each upgrade.
7. No next upgrade proceeds until the current GATE file exists.

---

## Framing

This workflow is an **AI development operating system** — a structured operating protocol for building software with AI tools. It is not a generic platform, framework, or product. It is documentation and convention infrastructure that coordinates human decisions with AI implementation.

---

## Roadmap

| Item | Status |
|---|---|
| GATE as mandatory protocol step | **Implemented** (NW-UPGRADE-069C) |
| Project bootstrap templates | **Implemented** (NW-UPGRADE-069C) |
| Browser Use smoke test integration | **Future** — placeholder in TOOL_ROLES and GATE |
| Feedback loop closure (GATE → next session auto-context) | **Future** — not yet built |
| Cross-project bootstrap reuse | **Future** — templates exist, no automation yet |
