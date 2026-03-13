import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { engagement_id, control_ids } = await req.json();

    if (!engagement_id) {
      return Response.json({ error: 'engagement_id required' }, { status: 400 });
    }

    const engagement = await base44.entities.Engagement.filter({ id: engagement_id });
    if (!engagement || engagement.length === 0) {
      return Response.json({ error: 'Engagement not found' }, { status: 404 });
    }

    // Get controls to snapshot
    let controls = [];
    if (control_ids && control_ids.length > 0) {
      controls = await base44.asServiceRole.entities.ControlLibrary.filter({ 
        id: { $in: control_ids } 
      });
    } else {
      // Default: snapshot all active controls
      controls = await base44.asServiceRole.entities.ControlLibrary.filter({ 
        lifecycle_state: "active" 
      });
    }

    const snapshots = [];
    const now = new Date().toISOString();

    for (const control of controls) {
      // Get linked risks
      const linkedRisks = await base44.asServiceRole.entities.RiskLibrary.filter({
        linked_control_ids: { $contains: control.id }
      });

      const snapshot = await base44.entities.AuditControlSnapshot.create({
        engagement_id,
        source_control_id: control.id,
        control_name: control.control_name,
        control_description: control.description,
        control_category: control.control_category,
        control_owner: control.owner,
        testing_frequency: control.testing_frequency,
        snapshot_timestamp: now,
        linked_risks: JSON.stringify(linkedRisks.map(r => ({ 
          id: r.id, 
          risk_name: r.risk_name 
        }))),
        regulatory_references: control.regulatory_reference,
        control_version_info: control.updated_date || control.created_date
      });

      snapshots.push(snapshot);
    }

    return Response.json({
      success: true,
      engagement_id,
      snapshots_created: snapshots.length,
      snapshots: snapshots.map(s => ({
        id: s.id,
        control_name: s.control_name,
        source_control_id: s.source_control_id
      }))
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});