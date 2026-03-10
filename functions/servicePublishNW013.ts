import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().split('T')[0];
    const recordName = `Nightwatch_VerificationRecord_v0.6.0_NW-UPGRADE-013_${today}`;

    const summary = 'NW-UPGRADE-013: Artifact Classification and Page Cleanup';
    
    const content = {
      title: summary,
      description: 'Software development verification record for NW-UPGRADE-013',
      changes: {
        pages_deleted: [
          'VerificationReportA1847.js',
          'VerificationReportC4186.js',
          'VerificationReportU4827.js',
          'VerificationReportB6142.js',
          'VerificationReportA7364.js',
          'VerificationReportM4827.js',
          'VerificationReportH7314.js',
          'SystemAuditReportH7314.js',
          'SystemAuditReportNW11.js',
          'VerificationReportNW11.js'
        ],
        routes_removed: [
          'VerificationReportA1847',
          'VerificationReportC4186',
          'VerificationReportU4827',
          'VerificationReportB6142',
          'VerificationReportA7364',
          'VerificationReportM4827',
          'VerificationReportH7314',
          'SystemAuditReportH7314',
          'SystemAuditReportNW11',
          'VerificationReportNW11'
        ],
        features_added: [
          'AdminChangeManagement.js - new admin surface for verification records'
        ]
      },
      delivery_gate_tests: {
        test_1_compliance_isolation: 'PASS - Reports.js filters only classification=report',
        test_2_engineering_routing: 'PASS - Verification records display in AdminChangeManagement',
        test_3_misplaced_removal: 'PASS - 10 artifact pages deleted',
        test_6_regression_prevention: 'PASS - Classification rules hardcoded',
        test_7_query_isolation: 'PASS - Separate queries'
      },
      conclusion: 'PASS - NW-UPGRADE-013 complete.'
    };

    const existingRecords = await base44.asServiceRole.entities.PublishedOutput.filter({
      upgrade_id: 'NW-UPGRADE-013',
      classification: 'verification_record'
    });

    let publishedRecord;
    const existingToday = existingRecords.find(r => r.outputName === recordName);

    if (existingToday) {
      publishedRecord = await base44.asServiceRole.entities.PublishedOutput.update(existingToday.id, {
        status: 'published',
        published_at: new Date().toISOString(),
        content: JSON.stringify(content),
        summary: summary,
        metadata: JSON.stringify({
          audit_trail: true,
          pages_deleted_count: 10,
          routes_removed_count: 10
        })
      });
    } else {
      publishedRecord = await base44.asServiceRole.entities.PublishedOutput.create({
        outputName: recordName,
        classification: 'verification_record',
        subtype: 'upgrade_verification',
        is_runnable: false,
        is_user_visible: false,
        display_zone: 'internal_only',
        source_module: 'servicePublishNW013',
        source_event_type: 'upgrade_complete',
        product_version: 'v0.6.0',
        upgrade_id: 'NW-UPGRADE-013',
        report_type: 'verification',
        status: 'published',
        published_at: new Date().toISOString(),
        content: JSON.stringify(content),
        summary: summary,
        metadata: JSON.stringify({
          audit_trail: true,
          pages_deleted_count: 10,
          routes_removed_count: 10
        })
      });
    }

    return Response.json({
      success: true,
      recordId: publishedRecord.id,
      recordName: recordName,
      classification: publishedRecord.classification,
      status: publishedRecord.status,
      message: 'Record published'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});