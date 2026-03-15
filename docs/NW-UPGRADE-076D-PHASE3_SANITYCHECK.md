# NW-UPGRADE-076D-PHASE3 — Apply Nightwatch Auth Middleware (Write Routes) — SANITYCHECK

## Objective

Protect operator **write endpoints** with Nightwatch middleware: createRisk, updateRisk, createControl, updateControl, engagement edits.

## Prerequisite Validation

**Confirm before or after implementation:**

1. **Phase 1 and Phase 2 routes still function with token**
   - With valid `Authorization: Bearer <session_token>`, Phase 1 routes (verifyRiskControlIntegrity, verifyInfrastructureLayer, auditReportPublicationArchitecture) return 200/403 as expected.
   - Phase 2 routes (listEngagements, listRisks, listControls) return 200 with list data.

2. **Invalid token returns 401**
   - Request to any Phase 1 or Phase 2 route with invalid or missing Bearer token returns 401 JSON.

3. **Write routes blocked without token**
   - Request to createRisk, updateRisk, createControl, updateControl, createEngagement, updateEngagement without valid Nightwatch session returns 401.

## Scope

- **Write routes to protect:** createRisk (EngagementRisk.create), updateRisk (EngagementRisk.update), createControl (ControlLibrary.create), updateControl (ControlLibrary.update), createEngagement (Engagement.create), updateEngagement (Engagement.update).
- **Implementation:** New backend functions that apply nwAuthMiddleware + requireAuth, then perform the write via base44.asServiceRole.entities. Frontend currently uses SDK entity create/update directly; these endpoints are available for API/cutover use.
- **Do not modify:** login UI, Base44 auth. Do not break existing read routes (Phase 1 and Phase 2).

## Risk Assessment

- **Medium.** Write operations are sensitive; middleware ensures only authenticated Nightwatch sessions can call them. No change to Base44 auth or login UI.

## Verdict

Proceed to implement write route wrappers with middleware. Ensure Phase 1/Phase 2 still work and write routes return 401 without token.
