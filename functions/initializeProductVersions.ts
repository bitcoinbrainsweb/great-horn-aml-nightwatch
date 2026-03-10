import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Product versions
    const versions = [
      {
        versionId: 'PV-001',
        versionNumber: 'v0.3.0',
        releaseName: 'Core Architecture Foundation',
        releaseDescription: 'Initial Nightwatch platform with core AML risk assessment engine, remediation workflows, and prompt template system',
        releaseDate: '2025-12-20',
        status: 'deprecated'
      },
      {
        versionId: 'PV-002',
        versionNumber: 'v0.4.0',
        releaseName: 'Deterministic Assessment Engine',
        releaseDescription: 'Deployed deterministic risk analysis with findings layer, infrastructure improvements, and observability stack',
        releaseDate: '2026-02-01',
        status: 'deprecated'
      },
      {
        versionId: 'PV-003',
        versionNumber: 'v0.5.0',
        releaseName: 'Enterprise Governance',
        releaseDescription: 'Added user access control, system configuration registry, and evidence & control testing framework',
        releaseDate: '2026-03-10',
        status: 'active'
      }
    ];

    // Upgrade mappings
    const mappings = [
      { mappingId: 'UVM-001', upgradeId: 'NW-UPGRADE-001', productVersion: 'v0.3.0', upgradeName: 'Core Architecture + Internal Audit' },
      { mappingId: 'UVM-002', upgradeId: 'NW-UPGRADE-002', productVersion: 'v0.3.0', upgradeName: 'Remediation + Retest' },
      { mappingId: 'UVM-003', upgradeId: 'NW-UPGRADE-003', productVersion: 'v0.3.0', upgradeName: 'Prompt Templates + Generation Contracts' },
      { mappingId: 'UVM-004', upgradeId: 'NW-UPGRADE-004', productVersion: 'v0.4.0', upgradeName: 'Deterministic Assessment Engine + Findings' },
      { mappingId: 'UVM-005', upgradeId: 'NW-UPGRADE-005', productVersion: 'v0.4.0', upgradeName: 'Platform Infrastructure + Observability' },
      { mappingId: 'UVM-006', upgradeId: 'NW-UPGRADE-006', productVersion: 'v0.5.0', upgradeName: 'User Access + Activity Monitoring' },
      { mappingId: 'UVM-007', upgradeId: 'NW-UPGRADE-007', productVersion: 'v0.5.0', upgradeName: 'System Configuration Registry' },
      { mappingId: 'UVM-008', upgradeId: 'NW-UPGRADE-008', productVersion: 'v0.5.0', upgradeName: 'Evidence & Control Testing Framework' }
    ];

    let versionCount = 0;
    for (const version of versions) {
      try {
        await base44.asServiceRole.entities.ProductVersion.create(version);
        versionCount++;
      } catch (e) {
        console.error(`Failed to create version ${version.versionNumber}:`, e.message);
      }
    }

    let mappingCount = 0;
    for (const mapping of mappings) {
      try {
        await base44.asServiceRole.entities.UpgradeVersionMapping.create({
          ...mapping,
          dateMapped: new Date().toISOString()
        });
        mappingCount++;
      } catch (e) {
        console.error(`Failed to create mapping ${mapping.mappingId}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      versionsCreated: versionCount,
      mappingsCreated: mappingCount,
      message: `Initialized ${versionCount} product versions and ${mappingCount} upgrade mappings`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});