# NW-UPGRADE-068B — Zombie Page Retirement (Review)

**Upgrade ID:** NW-UPGRADE-068B  
**Risk:** MEDIUM

---

## Exact Removal Plan (8 pages)

For each page: delete .jsx file, remove import + PAGES entry from pages.config.js, remove App.jsx import + route if present.

1. `src/pages/DeterministicEngineUpgradeSummary.jsx` — delete file, remove from pages.config.js
2. `src/pages/GovernanceDeliveryGateSummary.jsx` — delete file, remove from pages.config.js
3. `src/pages/HistoricalNormalizationSummary.jsx` — delete file, remove from pages.config.js
4. `src/pages/NW010DeliveryGateSummary.jsx` — delete file, remove from pages.config.js
5. `src/pages/NW013DeliveryGateFinal.jsx` — delete file, remove from pages.config.js
6. `src/pages/NW040UpgradeSummary.jsx` — delete file, remove from pages.config.js AND App.jsx (import L45, route L114)
7. `src/pages/PublishNW013.jsx` — delete file, remove from pages.config.js
8. `src/pages/RunNW040Verification.jsx` — delete file, remove from pages.config.js AND App.jsx (import L46, route L115)

Also clean up discovered dead components:
- `src/components/admin/NW013VerificationDisplay.jsx` — delete (never imported)
- `src/components/docs/NW_UPGRADE_040_RESULT.jsx` — delete (never imported)

---

## Exact Archive/Export Plan (3 pages)

1. Read JSX content, extract architecture/reference material
2. Write to markdown files under `docs/architecture/`
3. Remove import + PAGES entry from pages.config.js
4. Delete the .jsx file

| Source Page | Archive Destination |
|---|---|
| DeterministicEngineArchitecture.jsx | `docs/architecture/deterministic-engine-architecture.md` |
| InfrastructureLayerOverview.jsx | `docs/architecture/infrastructure-layer-overview.md` |
| PromptTemplateSystemSummary.jsx | `docs/architecture/prompt-template-system.md` |

---

## Exact Admin-Hide Plan (4 pages)

All 4 are already absent from Layout.jsx NAV_ITEMS (not in sidebar). Actions:

| Page | Action |
|---|---|
| ArtifactDiagnostics | Already has admin guard + App.jsx route. Remove Layout.jsx L232 active-state reference. |
| PageInventoryAudit | Add admin/super_admin guard to component. Keep in pages.config.js. |
| RegressionTestDashboard | Add admin/super_admin guard to component. Keep in pages.config.js. |
| ReportPublicationDebug | Add admin/super_admin guard to component (URGENT — has destructive button). Keep in pages.config.js. |

---

## Route/Nav/Guard Impact Summary

- pages.config.js: Remove 11 imports + 11 PAGES entries (8 REMOVE + 3 ARCHIVE)
- App.jsx: Remove 2 imports + 2 routes (NW040UpgradeSummary, RunNW040Verification)
- Layout.jsx: Remove 1 active-state reference for ArtifactDiagnostics (L232)
- 3 HIDE pages: Add admin guard code blocks

---

## Rollback Considerations

All deleted files can be recovered from git history. Archive docs preserve the content. No data model changes. Low rollback risk.
