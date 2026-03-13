import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CORE_AML_REVIEW_AREAS = [
  { area_name: "Governance", display_order: 1 },
  { area_name: "FINTRAC MSB Registration", display_order: 2 },
  { area_name: "Compliance Program & Special Measures", display_order: 3 },
  { area_name: "AML Compliance Officer", display_order: 4 },
  { area_name: "Written Policies & Procedures", display_order: 5 },
  { area_name: "Client Verification", display_order: 6 },
  { area_name: "Enhanced Due Diligence", display_order: 7 },
  { area_name: "Ongoing Monitoring", display_order: 8 },
  { area_name: "Alert Management", display_order: 9 },
  { area_name: "Escalations", display_order: 10 },
  { area_name: "Employee Execution Handling", display_order: 11 },
  { area_name: "PEP & HIO Screening", display_order: 12 },
  { area_name: "FINTRAC Travel Rule", display_order: 13 },
  { area_name: "Risk Assessment", display_order: 14 },
  { area_name: "AML Training Program", display_order: 15 },
  { area_name: "Effectiveness Review", display_order: 16 },
  { area_name: "STRs & ASTRs", display_order: 17 },
  { area_name: "EFTRs", display_order: 18 },
  { area_name: "LPEPRs", display_order: 19 },
  { area_name: "Canadian Sanctions", display_order: 20 },
  { area_name: "Ministerial Directives", display_order: 21 },
  { area_name: "Record Keeping", display_order: 22 },
  { area_name: "Requests for Information", display_order: 23 }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const existingAreas = await base44.entities.ReviewArea.list();
    const createdAreas = [];
    const skippedAreas = [];

    for (const area of CORE_AML_REVIEW_AREAS) {
      const exists = existingAreas.find(a => a.area_name === area.area_name);
      if (exists) {
        skippedAreas.push(area.area_name);
        continue;
      }

      const created = await base44.entities.ReviewArea.create({
        ...area,
        is_core_aml_area: true,
        status: "Active"
      });
      createdAreas.push(created);
    }

    return Response.json({
      success: true,
      created_count: createdAreas.length,
      skipped_count: skippedAreas.length,
      created_areas: createdAreas.map(a => a.area_name),
      skipped_areas: skippedAreas
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});