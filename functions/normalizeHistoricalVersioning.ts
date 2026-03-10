import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [],
    };

    // Define canonical product version map
    const canonicalMap = {
      'v0.1.0': ['NW-UPGRADE-001', 'NW-UPGRADE-002', 'NW-UPGRADE-003'],
      'v0.2.0': ['NW-UPGRADE-004', 'NW-UPGRADE-005'],
      'v0.3.0': ['NW-UPGRADE-006', 'NW-UPGRADE-007'],
      'v0.4.0': ['NW-UPGRADE-008'],
      'v0.5.0': ['NW-UPGRADE-009', 'NW-UPGRADE-010'],
      'v0.6.0': ['NW-UPGRADE-011', 'NW-UPGRADE-012'],
    };

    // 1. Normalize ProductVersion records
    const productVersions = [
      { versionId: 'pv-0.1.0', versionNumber: 'v0.1.0', releaseName: 'Core Architecture', status: 'deprecated' },
      { versionId: 'pv-0.2.0', versionNumber: 'v0.2.0', releaseName: 'Deterministic Engine', status: 'deprecated' },
      { versionId: 'pv-0.3.0', versionNumber: 'v0.3.0', releaseName: 'User & Config Management', status: 'deprecated' },
      { versionId: 'pv-0.4.0', versionNumber: 'v0.4.0', releaseName: 'Evidence & Testing', status: 'deprecated' },
      { versionId: 'pv-0.5.0', versionNumber: 'v0.5.0', releaseName: 'Release Versioning & Regression Testing', status: 'active' },
    ];

    for (const pv of productVersions) {
      try {
        const existing = await base44.entities.ProductVersion.filter({ versionNumber: pv.versionNumber });
        if (existing.length === 0) {
          await base44.entities.ProductVersion.create(pv);
          results.tasks.push({ type: 'ProductVersion', action: 'created', id: pv.versionId });
        } else {
          // Update status if needed
          await base44.entities.ProductVersion.update(existing[0].id, { status: pv.status });
          results.tasks.push({ type: 'ProductVersion', action: 'updated', id: existing[0].id });
        }
      } catch (e) {
        results.tasks.push({ type: 'ProductVersion', action: 'error', id: pv.versionId, error: e.message });
      }
    }

    // 2. Normalize UpgradeVersionMapping
    const mappings = [];
    for (const [version, upgradeIds] of Object.entries(canonicalMap)) {
      for (const upgradeId of upgradeIds) {
        mappings.push({
          mappingId: `uvmap-${upgradeId}`,
          upgradeId,
          productVersion: version,
        });
      }
    }

    for (const mapping of mappings) {
      try {
        const existing = await base44.entities.UpgradeVersionMapping.filter({ upgradeId: mapping.upgradeId });
        if (existing.length === 0) {
          await base44.entities.UpgradeVersionMapping.create(mapping);
          results.tasks.push({ type: 'UpgradeVersionMapping', action: 'created', upgradeId: mapping.upgradeId, productVersion: mapping.productVersion });
        }
      } catch (e) {
        results.tasks.push({ type: 'UpgradeVersionMapping', action: 'error', upgradeId: mapping.upgradeId, error: e.message });
      }
    }

    // 3. Normalize UpgradeRegistry
    const allUpgrades = await base44.entities.UpgradeRegistry.list();
    for (const upgrade of allUpgrades) {
      try {
        // Find correct product version from mapping
        const mapping = mappings.find(m => m.upgradeId === upgrade.upgradeId);
        if (mapping && upgrade.version !== mapping.productVersion) {
          await base44.entities.UpgradeRegistry.update(upgrade.id, { version: mapping.productVersion });
          results.tasks.push({ type: 'UpgradeRegistry', action: 'normalized', upgradeId: upgrade.upgradeId, newVersion: mapping.productVersion });
        }
      } catch (e) {
        results.tasks.push({ type: 'UpgradeRegistry', action: 'error', upgradeId: upgrade.upgradeId, error: e.message });
      }
    }

    // 4. Backfill PromptHistoryRecords for major prompts
    const promptHistoryRecords = [
      {
        promptHistoryId: 'phr-001',
        upgradeId: 'NW-UPGRADE-001',
        promptName: 'Core Architecture Overview',
        targetProductVersion: 'v0.1.0',
        normalizedPromptLabel: 'Prompt ID: NW-UPGRADE-001 | Core Architecture Overview | Target: v0.1.0',
      },
      {
        promptHistoryId: 'phr-004',
        upgradeId: 'NW-UPGRADE-004',
        promptName: 'Deterministic Risk Engine',
        targetProductVersion: 'v0.2.0',
        normalizedPromptLabel: 'Prompt ID: NW-UPGRADE-004 | Deterministic Risk Engine | Target: v0.2.0',
      },
      {
        promptHistoryId: 'phr-008',
        upgradeId: 'NW-UPGRADE-008',
        promptName: 'Evidence & Control Testing Framework',
        targetProductVersion: 'v0.4.0',
        normalizedPromptLabel: 'Prompt ID: NW-UPGRADE-008 | Evidence & Control Testing Framework | Target: v0.4.0',
      },
      {
        promptHistoryId: 'phr-010',
        upgradeId: 'NW-UPGRADE-010',
        promptName: 'Regression Test Framework',
        targetProductVersion: 'v0.5.0',
        normalizedPromptLabel: 'Prompt ID: NW-UPGRADE-010 | Regression Test Framework | Target: v0.5.0',
      },
      {
        promptHistoryId: 'phr-011',
        upgradeId: 'NW-UPGRADE-011',
        promptName: 'Role/Permission Model & Override Governance',
        targetProductVersion: 'v0.6.0',
        normalizedPromptLabel: 'Prompt ID: NW-UPGRADE-011 | Role/Permission Model | Target: v0.6.0',
      },
    ];

    for (const phr of promptHistoryRecords) {
      try {
        const existing = await base44.entities.PromptHistoryRecord.filter({ upgradeId: phr.upgradeId });
        if (existing.length === 0) {
          await base44.entities.PromptHistoryRecord.create({
            ...phr,
            dateRecorded: new Date().toISOString(),
          });
          results.tasks.push({ type: 'PromptHistoryRecord', action: 'created', upgradeId: phr.upgradeId });
        }
      } catch (e) {
        results.tasks.push({ type: 'PromptHistoryRecord', action: 'error', upgradeId: phr.upgradeId, error: e.message });
      }
    }

    // 5. Normalize DeliveryGateRun records
    const deliveryGateRuns = await base44.entities.DeliveryGateRun.list();
    for (const run of deliveryGateRuns) {
      try {
        const mapping = mappings.find(m => m.upgradeId === run.upgradeId);
        if (mapping) {
          const canonicalTitle = `Nightwatch_DeliveryGate_${mapping.productVersion}_${run.upgradeId}_${new Date(run.startedAt).toISOString().split('T')[0]}`;
          const updates = {};
          if (!run.productVersion || run.productVersion !== mapping.productVersion) {
            updates.productVersion = mapping.productVersion;
          }
          if (!run.canonicalReportTitle) {
            updates.canonicalReportTitle = canonicalTitle;
          }
          if (Object.keys(updates).length > 0) {
            await base44.entities.DeliveryGateRun.update(run.id, updates);
            results.tasks.push({ type: 'DeliveryGateRun', action: 'normalized', upgradeId: run.upgradeId, productVersion: mapping.productVersion });
          }
        }
      } catch (e) {
        results.tasks.push({ type: 'DeliveryGateRun', action: 'error', id: run.id, error: e.message });
      }
    }

    results.summary = `Normalization complete: ${results.tasks.length} entities processed`;
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});