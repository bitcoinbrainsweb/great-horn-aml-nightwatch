import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contractId, inputData, assessmentId } = await req.json();

    // GUARDRAIL: Enforce strict payload rules
    const forbiddenKeys = ['RiskLibrary', 'ControlLibrary', 'AssessmentState', 'fullContext', 'allRisks'];
    for (const key of forbiddenKeys) {
      if (inputData && inputData[key]) {
        console.warn(`[PROMPT_GUARDRAIL] Rejected payload containing ${key}`);
        return Response.json({ 
          error: `Payload contains forbidden key: ${key}. Only contract fields allowed.` 
        }, { status: 400 });
      }
    }

    // Check payload size (max 10KB for small prompts)
    const payloadSize = JSON.stringify(inputData).length;
    if (payloadSize > 10000) {
      console.warn(`[PROMPT_GUARDRAIL] Payload too large: ${payloadSize} bytes`);
      return Response.json({ 
        error: `Payload too large (${payloadSize} bytes). Max 10KB.` 
      }, { status: 400 });
    }

    if (!contractId || !inputData || !assessmentId) {
      return Response.json(
        { error: 'contractId, inputData, and assessmentId required' },
        { status: 400 }
      );
    }

    // Step 1: Validate input against contract
    const validationRes = await base44.functions.invoke('contractValidator', {
      contractId,
      inputData
    });

    if (!validationRes.data.valid) {
      return Response.json(
        {
          error: 'Validation failed',
          contractId,
          errors: validationRes.data.errors
        },
        { status: 400 }
      );
    }

    const contract = validationRes.data.contract;
    const validatedInput = validationRes.data.validatedInput;

    // Step 2: Retrieve and render template
    if (!contract.templateId) {
      return Response.json(
        { error: `No template assigned to contract: ${contractId}` },
        { status: 400 }
      );
    }

    const templateRes = await base44.functions.invoke(
      'promptTemplateRenderer',
      {
        templateId: contract.templateId,
        inputData: validatedInput
      }
    );

    if (!templateRes.data.success) {
      return Response.json(
        {
          error: 'Template rendering failed',
          templateId: contract.templateId,
          details: templateRes.data.error
        },
        { status: 400 }
      );
    }

    const renderedPrompt = templateRes.data.renderedPrompt;

    // Step 3: Execute generation function
    const generatorFunction = contract.generatorFunction;
    const generationRes = await base44.functions.invoke(generatorFunction, {
      contractId,
      assessmentId,
      prompt: renderedPrompt,
      inputData: validatedInput
    });

    if (!generationRes.data.success) {
      return Response.json(
        {
          error: 'Generation failed',
          contractId,
          details: generationRes.data.error
        },
        { status: 500 }
      );
    }

    const generatedOutput = generationRes.data.output;

    // Step 4: Validate output against contract output schema
    const outputSchema = contract.outputSchema;
    const requiredOutputFields = outputSchema.required || [];
    const allowedOutputFields = outputSchema.properties
      ? Object.keys(outputSchema.properties)
      : [];

    const outputErrors = [];

    for (const field of requiredOutputFields) {
      if (!(field in generatedOutput)) {
        outputErrors.push(`Missing required output field: ${field}`);
      }
    }

    for (const field of Object.keys(generatedOutput)) {
      if (!allowedOutputFields.includes(field)) {
        outputErrors.push(`Unsupported output field: ${field}`);
      }
    }

    if (outputErrors.length > 0) {
      return Response.json(
        {
          error: 'Output validation failed',
          contractId,
          errors: outputErrors,
          output: generatedOutput
        },
        { status: 500 }
      );
    }

    // Step 5: Write narrative to AssessmentState
    const riskId = validatedInput.riskId;
    const assessments = await base44.entities.AssessmentState.filter({
      id: assessmentId
    });

    if (assessments.length === 0) {
      return Response.json(
        { error: `Assessment not found: ${assessmentId}` },
        { status: 404 }
      );
    }

    const assessment = assessments[0].data;
    const narratives = assessment.narratives || {};

    // Determine narrative field based on contract
    let narrativeField = null;
    if (contractId === 'RiskNarrative') {
      narrativeField = `risk_${riskId}_narrative`;
    } else if (contractId === 'ControlAnalysis') {
      narrativeField = `risk_${riskId}_control_analysis`;
    } else if (contractId === 'ResidualRisk') {
      narrativeField = `risk_${riskId}_residual_risk`;
    } else if (contractId === 'Recommendation') {
      narrativeField = `risk_${riskId}_recommendation`;
    }

    if (!narrativeField) {
      return Response.json(
        { error: `Unknown narrative field mapping for contract: ${contractId}` },
        { status: 400 }
      );
    }

    narratives[narrativeField] = {
      contractId,
      riskId,
      narrative: generatedOutput[Object.keys(generatedOutput)[1]], // First narrative field
      generatedAt: new Date().toISOString(),
      inputSnapshot: validatedInput
    };

    // Update assessment
    await base44.entities.AssessmentState.update(assessmentId, {
      narratives
    });

    return Response.json({
      success: true,
      contractId,
      riskId,
      narrativeField,
      generatedAt: new Date().toISOString(),
      generatedOutput
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});