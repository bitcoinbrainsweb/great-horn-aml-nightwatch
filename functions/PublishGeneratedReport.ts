import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      reportTitle,
      reportType,
      upgradeId,
      upgradeName,
      productVersion,
      sourceRunId,
      sourceType,
      content,
      summary,
    } = payload;

    // Validate required fields
    if (!reportTitle || !reportType || !upgradeId || !productVersion) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing published report to prevent duplicates
    const existing = await base44.entities.GeneratedReport.filter({
      upgradeId,
      productVersion,
      reportType,
    });

    if (existing.length > 0 && existing[0].status === 'published') {
      // Return existing published report
      return Response.json({
        reportId: existing[0].id,
        status: 'already_published',
        message: 'Report already published',
      });
    }

    // Create or update report
    const reportId = `gr-${upgradeId}-${reportType}-${Date.now()}`;
    const now = new Date().toISOString();

    try {
      const report = await base44.entities.GeneratedReport.create({
        reportId,
        reportTitle,
        reportType,
        upgradeId,
        upgradeName,
        productVersion,
        sourceRunId,
        sourceType,
        content,
        summary,
        reportDate: now,
        publishedAt: now,
        status: 'published',
        visibleOnReportsPage: true,
      });

      return Response.json({
        reportId: report.id,
        status: 'published',
        message: 'Report published successfully',
      });
    } catch (e) {
      // Mark as failed
      if (existing.length > 0) {
        await base44.entities.GeneratedReport.update(existing[0].id, {
          status: 'failed',
          publicationError: e.message,
        });
      }

      return Response.json({
        error: 'Publication failed',
        details: e.message,
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});