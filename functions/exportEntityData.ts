import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_name, format = 'csv', filters = {} } = await req.json();

    if (!entity_name) {
      return Response.json({ error: 'entity_name required' }, { status: 400 });
    }

    // Fetch all records (respecting filters)
    let records = await base44.entities[entity_name].list('-created_date', 1000);

    // Add coverage data for RiskLibrary exports
    if (entity_name === 'RiskLibrary') {
      const enhancedRecords = [];
      for (const risk of records) {
        let coverage_status = 'UNCONTROLLED';
        if (risk.linked_control_ids && risk.linked_control_ids.length > 0) {
          try {
            const response = await base44.asServiceRole.functions.invoke('calculateRiskCoverage', {
              risk_id: risk.id,
              linked_control_ids: risk.linked_control_ids
            });
            coverage_status = response.data.coverage_status;
          } catch (e) {
            coverage_status = 'NOT_TESTED';
          }
        }
        enhancedRecords.push({
          ...risk,
          coverage_status,
          linked_controls_count: risk.linked_control_ids?.length || 0
        });
      }
      records = enhancedRecords;
    }
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      records = records.filter(r => {
        for (const [key, value] of Object.entries(filters)) {
          if (r[key] !== value) return false;
        }
        return true;
      });
    }

    if (format === 'json') {
      // Return JSON
      const sanitized = records.map(r => {
        const obj = { ...r };
        delete obj.is_deleted;
        delete obj.deleted_date;
        delete obj.is_sample;
        delete obj.environment;
        return obj;
      });

      return Response.json({
        success: true,
        format: 'json',
        count: sanitized.length,
        data: sanitized
      });
    } else if (format === 'csv') {
      // Build CSV
      if (records.length === 0) {
        return Response.json({
          success: true,
          format: 'csv',
          count: 0,
          csv: ''
        });
      }

      const headers = Object.keys(records[0]).filter(k => 
        !['is_deleted', 'deleted_date', 'is_sample', 'environment'].includes(k)
      );

      const rows = records.map(r => 
        headers.map(h => {
          const val = r[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val).replace(/"/g, '""');
        }).join(',')
      );

      const csv = [
        headers.map(h => `"${h}"`).join(','),
        ...rows
      ].join('\n');

      return Response.json({
        success: true,
        format: 'csv',
        count: records.length,
        csv: csv
      });
    }

    return Response.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});