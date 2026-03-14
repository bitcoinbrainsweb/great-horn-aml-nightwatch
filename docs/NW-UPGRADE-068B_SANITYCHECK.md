# NW-UPGRADE-068B — Zombie Page Retirement (Sanity Check)

**Upgrade ID:** NW-UPGRADE-068B  
**Branch:** nw-upgrade-068b-zombie-page-retirement  
**Risk:** MEDIUM

---

## REMOVE Group (8 pages)

All 8 pages are isolated leaf nodes with ZERO inbound links from other pages. None define shared components. All only consume standard shared UI (PageHeader, Card, Badge, Button).

| Page | File | pages.config.js | Layout.jsx nav | App.jsx route | Inbound links |
|---|---|---|---|---|---|
| DeterministicEngineUpgradeSummary | EXISTS | Yes (L86, L152) | No | No | None |
| GovernanceDeliveryGateSummary | EXISTS | Yes (L94, L160) | No | No | None |
| HistoricalNormalizationSummary | EXISTS | Yes (L96, L162) | No | No | None |
| NW010DeliveryGateSummary | EXISTS | Yes (L99, L165) | No | No | None |
| NW013DeliveryGateFinal | EXISTS | Yes (L100, L166) | No | No | None |
| NW040UpgradeSummary | EXISTS | Yes (L101, L167) | No | **Yes (L45, L114)** | None |
| PublishNW013 | EXISTS | Yes (L104, L170) | No | No | None |
| RunNW040Verification | EXISTS | Yes (L110, L176) | No | **Yes (L46, L115)** | None |

**Shared components at risk:** NONE. Safe to remove all 8.

**Additional dead code found:**
- `src/components/admin/NW013VerificationDisplay.jsx` — never imported anywhere
- `src/components/docs/NW_UPGRADE_040_RESULT.jsx` — never imported anywhere

---

## ARCHIVE Group (3 pages)

All 3 are documentation/architecture reference pages with no sidebar entry and no inbound links.

| Page | File | pages.config.js | App.jsx | Content type |
|---|---|---|---|---|
| DeterministicEngineArchitecture | EXISTS | Yes (L85, L151) | No | Static architecture docs (240 lines) |
| InfrastructureLayerOverview | EXISTS | Yes (L97, L163) | No | Dynamic audit + architecture docs (213 lines) |
| PromptTemplateSystemSummary | EXISTS | Yes (L103, L169) | No | Static architecture docs (299 lines) |

**Archive destinations:**
- `docs/architecture/deterministic-engine-architecture.md`
- `docs/architecture/infrastructure-layer-overview.md`
- `docs/architecture/prompt-template-system.md`

---

## HIDE Group (4 pages)

| Page | File | Nav entry | App.jsx route | Admin guard |
|---|---|---|---|---|
| ArtifactDiagnostics | EXISTS | No (has ChangeLog active-state link in Layout.jsx L232) | **Yes (L107)** | **Yes** (admin/super_admin) |
| PageInventoryAudit | EXISTS | No | No | **No** — needs guard |
| RegressionTestDashboard | EXISTS | No | No | **No** — needs guard |
| ReportPublicationDebug | EXISTS | No | No | **No** — has destructive backfill button with no guard |

---

## Risk Assessment

- **MEDIUM risk** — touching 15 pages, 3 config files, creating archive docs
- No shared components at risk
- No deep links or external references
- REVIEW file required
