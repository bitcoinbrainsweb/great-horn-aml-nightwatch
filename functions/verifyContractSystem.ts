import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      systemReady: true
    };

    // 1. Check GenerationContract entity
    const contracts = await base44.entities.GenerationContract.list();
    results.checks.push({
      name: 'GenerationContract exists',
      passed: contracts.length > 0,
      details: `Found ${contracts.length} active contracts`
    });

    const contractIds = contracts.map(c => c.data?.contractId || c.contractId).filter(Boolean);
    const requiredContracts = [
      'RiskNarrative',
      'ControlAnalysis',
      'ResidualRisk',
      'Recommendation'
    ];

    for (const contractId of requiredContracts) {
      const exists = contractIds.includes(contractId);
      results.checks.push({
        name: `Contract exists: ${contractId}`,
        passed: exists,
        details: exists ? 'Active' : 'Missing'
      });
      if (!exists) results.systemReady = false;
    }

    // 2. Check PromptTemplate entity
    const templates = await base44.entities.PromptTemplate.list();
    results.checks.push({
      name: 'PromptTemplate exists',
      passed: templates.length > 0,
      details: `Found ${templates.length} active templates`
    });

    const templateIds = templates.map(t => t.data?.templateId || t.templateId).filter(Boolean);
    const requiredTemplates = [
      'RiskNarrativeTemplate_v1',
      'ControlAnalysisTemplate_v1',
      'ResidualRiskTemplate_v1',
      'RecommendationTemplate_v1'
    ];

    for (const templateId of requiredTemplates) {
      const exists = templateIds.includes(templateId);
      results.checks.push({
        name: `Template exists: ${templateId}`,
        passed: exists,
        details: exists ? 'Active' : 'Missing'
      });
      if (!exists) results.systemReady = false;
    }

    // 3. Check contract-template linkage
    for (const template of templates) {
      const contractId = template.data?.contractId || template.contractId;
      const linkedContract = contracts.find(c => (c.data?.contractId || c.contractId) === contractId);
      const linked = !!linkedContract;
      results.checks.push({
        name: `Template linked to contract: ${template.data.templateId}`,
        passed: linked,
        details: linked ? `→ ${contractId}` : 'Orphaned'
      });
      if (!linked) results.systemReady = false;
    }

    // 4. Test contractValidator function
    try {
      const validationTest = await base44.functions.invoke('contractValidator', {
        contractId: 'RiskNarrative',
        inputData: {
          riskId: 'RISK-TEST-001',
          riskName: 'Test Risk',
          riskDescription: 'Test description',
          inherentRiskScore: 4
        }
      });

      results.checks.push({
        name: 'contractValidator function callable',
        passed: validationTest.data.valid === true,
        details: validationTest.data.valid ? 'Validation passed' : 'Validation failed'
      });
    } catch (e) {
      results.checks.push({
        name: 'contractValidator function callable',
        passed: false,
        details: e.message
      });
      results.systemReady = false;
    }

    // 5. Test contractValidator with invalid input
    try {
      const invalidTest = await base44.functions.invoke('contractValidator', {
        contractId: 'RiskNarrative',
        inputData: {
          riskId: 'RISK-TEST-002'
          // Missing required fields
        }
      });

      results.checks.push({
        name: 'contractValidator rejects invalid input',
        passed: invalidTest.data.valid === false,
        details: invalidTest.data.valid ? 'Failed to reject' : 'Correctly rejected'
      });
    } catch (e) {
      results.checks.push({
        name: 'contractValidator rejects invalid input',
        passed: false,
        details: e.message
      });
    }

    // 6. Test promptTemplateRenderer
    try {
      const renderTest = await base44.functions.invoke('promptTemplateRenderer', {
        templateId: 'RiskNarrativeTemplate_v1',
        inputData: {
          riskName: 'Test Risk',
          riskGroup: 'Geography',
          riskDescription: 'Testing template rendering',
          inherentRiskScore: 4,
          jurisdiction: 'Canada'
        }
      });

      results.checks.push({
        name: 'promptTemplateRenderer function callable',
        passed: renderTest.data.success === true,
        details: renderTest.data.success ? 'Template rendered' : 'Render failed'
      });
    } catch (e) {
      results.checks.push({
        name: 'promptTemplateRenderer function callable',
        passed: false,
        details: e.message
      });
      results.systemReady = false;
    }

    // 7. Verify template placeholder substitution
    const sampleTemplate = templates.find(t => (t.data?.templateId || t.templateId) === 'RiskNarrativeTemplate_v1');
    if (sampleTemplate) {
      const bodyHasPlaceholders = (sampleTemplate.data?.templateBody || sampleTemplate.templateBody || '').includes('{{');
      results.checks.push({
        name: 'Templates contain placeholders',
        passed: bodyHasPlaceholders,
        details: bodyHasPlaceholders ? 'Found {{field}} patterns' : 'No placeholders'
      });
    }

    // 8. Verify contracts reference only contract fields
    for (const contract of contracts) {
      const inputSchemaStr = contract.data?.inputSchema || contract.inputSchema || '{}';
      const inputSchema = JSON.parse(inputSchemaStr);
      const properties = inputSchema.properties || {};
      const fieldCount = Object.keys(properties).length;
      const acceptsAdditional = inputSchema.additionalProperties !== false;

      const contractIdDisplay = contract.data?.contractId || contract.contractId;
      results.checks.push({
        name: `Contract ${contractIdDisplay} enforces strict schema`,
        passed: !acceptsAdditional && fieldCount > 0,
        details: `${fieldCount} allowed fields, additionalProperties: ${acceptsAdditional}`
      });
    }

    // 9. Check generation functions exist
    const generationFunctions = [
      'generateRiskNarrative',
      'generateControlAnalysis',
      'generateResidualRisk',
      'generateRecommendation'
    ];

    for (const funcName of generationFunctions) {
      const contract = contracts.find(c => (c.data?.generatorFunction || c.generatorFunction) === funcName);
      results.checks.push({
        name: `Generation function registered: ${funcName}`,
        passed: !!contract,
        details: contract ? `Bound to ${contract.data?.contractId || contract.contractId}` : 'Not found'
      });
    }

    // 10. System readiness summary
    const passCount = results.checks.filter(c => c.passed).length;
    const totalCount = results.checks.length;

    results.summary = {
      totalChecks: totalCount,
      passedChecks: passCount,
      failedChecks: totalCount - passCount,
      readinessPercentage: Math.round((passCount / totalCount) * 100),
      systemReady: results.systemReady && passCount === totalCount
    };

    return Response.json(results);
  } catch (error) {
    return Response.json(
      { error: error.message, systemReady: false },
      { status: 500 }
    );
  }
});