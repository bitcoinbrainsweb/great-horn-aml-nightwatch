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
    const contracts = await base44.asServiceRole.entities.GenerationContract.list();
    const contractList = Array.isArray(contracts) ? contracts : [];
    
    results.checks.push({
      name: 'GenerationContract entity exists',
      passed: contractList.length > 0,
      details: `Found ${contractList.length} contracts`
    });

    // 2. Check required contracts
    const contractIds = contractList
      .map(c => c.contractId || (c.data && c.data.contractId))
      .filter(Boolean);

    const requiredContracts = ['RiskNarrative', 'ControlAnalysis', 'ResidualRisk', 'Recommendation'];
    for (const id of requiredContracts) {
      const exists = contractIds.includes(id);
      results.checks.push({
        name: `Contract exists: ${id}`,
        passed: exists,
        details: exists ? 'Active' : 'Missing'
      });
      if (!exists) results.systemReady = false;
    }

    // 3. Check PromptTemplate entity
    const templates = await base44.asServiceRole.entities.PromptTemplate.list();
    const templateList = Array.isArray(templates) ? templates : [];

    results.checks.push({
      name: 'PromptTemplate entity exists',
      passed: templateList.length > 0,
      details: `Found ${templateList.length} templates`
    });

    // 4. Check required templates
    const templateIds = templateList
      .map(t => t.templateId || (t.data && t.data.templateId))
      .filter(Boolean);

    const requiredTemplates = ['RiskNarrativeTemplate_v1', 'ControlAnalysisTemplate_v1', 'ResidualRiskTemplate_v1', 'RecommendationTemplate_v1'];
    for (const id of requiredTemplates) {
      const exists = templateIds.includes(id);
      results.checks.push({
        name: `Template exists: ${id}`,
        passed: exists,
        details: exists ? 'Active' : 'Missing'
      });
      if (!exists) results.systemReady = false;
    }

    // 5. Test contractValidator
    try {
      const validation = await base44.functions.invoke('contractValidator', {
        contractId: 'RiskNarrative',
        inputData: {
          riskId: 'TEST-001',
          riskName: 'Test Risk',
          riskDescription: 'Test description',
          inherentRiskScore: 4
        }
      });

      results.checks.push({
        name: 'contractValidator validates correct input',
        passed: validation.data.valid === true,
        details: validation.data.valid ? 'Passed' : 'Failed'
      });
    } catch (e) {
      results.checks.push({
        name: 'contractValidator validates correct input',
        passed: false,
        details: e.message
      });
      results.systemReady = false;
    }

    // 6. Test contractValidator rejects invalid input
    try {
      const invalid = await base44.functions.invoke('contractValidator', {
        contractId: 'RiskNarrative',
        inputData: { riskId: 'TEST-002' }
      });

      results.checks.push({
        name: 'contractValidator rejects invalid input',
        passed: invalid.data.valid === false,
        details: invalid.data.valid ? 'Failed to reject' : 'Correctly rejected'
      });
    } catch (e) {
      results.checks.push({
        name: 'contractValidator rejects invalid input',
        passed: false,
        details: e.message
      });
    }

    // 7. Test promptTemplateRenderer
    try {
      const render = await base44.functions.invoke('promptTemplateRenderer', {
        templateId: 'RiskNarrativeTemplate_v1',
        inputData: {
          riskName: 'Test Risk',
          riskGroup: 'Geography',
          riskDescription: 'Test description',
          inherentRiskScore: 4,
          jurisdiction: 'Canada'
        }
      });

      results.checks.push({
        name: 'promptTemplateRenderer renders template',
        passed: render.data.success === true,
        details: render.data.success ? 'Rendered' : 'Failed'
      });
    } catch (e) {
      results.checks.push({
        name: 'promptTemplateRenderer renders template',
        passed: false,
        details: e.message
      });
      results.systemReady = false;
    }

    // 8. Check schema enforcement
    for (const contract of contractList) {
      const contractId = contract.contractId || (contract.data && contract.data.contractId);
      const inputSchema = contract.inputSchema || (contract.data && contract.data.inputSchema);
      
      if (!inputSchema) continue;
      
      const schema = typeof inputSchema === 'string' ? JSON.parse(inputSchema) : inputSchema;
      const allowsAdditional = schema.additionalProperties !== false;

      results.checks.push({
        name: `Contract ${contractId} enforces strict input schema`,
        passed: !allowsAdditional,
        details: `additionalProperties: ${allowsAdditional}`
      });
    }

    // 9. Verify generation functions registered
    const functions = ['generateRiskNarrative', 'generateControlAnalysis', 'generateResidualRisk', 'generateRecommendation'];
    for (const funcName of functions) {
      const isBound = contractList.some(c => {
        const fn = c.generatorFunction || (c.data && c.data.generatorFunction);
        return fn === funcName;
      });

      results.checks.push({
        name: `Generator function registered: ${funcName}`,
        passed: isBound,
        details: isBound ? 'Bound to contract' : 'Not bound'
      });
    }

    // Summary
    const passCount = results.checks.filter(c => c.passed).length;
    const totalCount = results.checks.length;

    results.summary = {
      totalChecks: totalCount,
      passed: passCount,
      failed: totalCount - passCount,
      percentage: Math.round((passCount / totalCount) * 100),
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