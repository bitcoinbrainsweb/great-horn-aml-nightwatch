# NW-UPGRADE-069C — Build Gate + Bootstrap Foundation (Review)

**Upgrade ID:** NW-UPGRADE-069C  
**Risk:** LOW

---

## Files to Create

| File | Purpose |
|---|---|
| `docs/NIGHTWATCH_WORKFLOW.md` | Master workflow doc — canonical protocol reference |
| `project-bootstrap/KERNEL_TEMPLATE.txt` | Reusable project kernel template |
| `project-bootstrap/SESSION_BRIEF_TEMPLATE.txt` | Per-session/upgrade prompt template |
| `project-bootstrap/TOOL_ROLES.txt` | Tool responsibility matrix |
| `project-bootstrap/UPGRADE_PROTOCOL.txt` | Upgrade execution protocol (with GATE) |
| `project-bootstrap/GATE_TEMPLATE.txt` | GATE artifact template |
| `project-bootstrap/ADAPTATION_GUIDE.txt` | 5-question customization guide for new projects |
| `docs/NW-UPGRADE-069C_GATE.md` | First GATE artifact (for this upgrade itself) |

## Files to Update

None. No existing files are modified.

---

## GATE File Design

```
BUILD: [UPGRADE_ID]
DATE: [YYYY-MM-DD]
SMOKE TEST: [PASS / FAIL / SKIPPED + reason]
CHECKLIST: [list of verification items, each PASS/FAIL]
VERDICT: [GO / NO-GO]
FAILURE REASON: [if NO-GO]
ESCALATION: [if NO-GO, who/what]
NEXT ACTION: [next upgrade ID or follow-up]
```

Concise, binary, operational. Not a report.

---

## Cursor Protocol Change

Before:
```
SANITYCHECK → REVIEW → IMPLEMENT → RESULT
```

After:
```
SANITYCHECK → REVIEW → IMPLEMENT → RESULT → GATE
```

Hard rule: no next bundle proceeds until GATE file exists.

---

## Bootstrap Template Population Plan

| Template | Source convention |
|---|---|
| KERNEL_TEMPLATE | Nightwatch prompt preamble pattern (upgrade ID, product version, canonical context, architecture refs, constraints) |
| SESSION_BRIEF_TEMPLATE | Per-upgrade prompt structure (objective, scope, standing rules, do-not-modify, execution steps, outputs) |
| TOOL_ROLES | Observed Cursor/ChatGPT/user division of labor |
| UPGRADE_PROTOCOL | The 5-step protocol with artifact naming |
| GATE_TEMPLATE | The GATE structure defined above |
| ADAPTATION_GUIDE | 5 customization questions for adapting to a new project |

---

## Risks and Rollback

- **Risk:** None — pure documentation
- **Rollback:** Delete `project-bootstrap/` folder and `docs/NIGHTWATCH_WORKFLOW.md`
