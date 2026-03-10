import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contractId, assessmentId, prompt, inputData } = await req.json();

    if (!prompt || !inputData) {
      return Response.json(
        { error: 'prompt and inputData required' },
        { status: 400 }
      );
    }

    // Call LLM with strict prompt
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          riskId: { type: 'string' },
          residualRiskNarrative: { type: 'string' },
          riskAcceptance: { type: 'string' }
        },
        required: ['riskId', 'residualRiskNarrative']
      }
    });

    // Validate response
    if (!llmRes.riskId || !llmRes.residualRiskNarrative) {
      return Response.json(
        {
          success: false,
          error: 'LLM did not return required fields',
          response: llmRes
        },
        { status: 500 }
      );
    }

    // Validate output length
    if (llmRes.residualRiskNarrative.length < 100 || llmRes.residualRiskNarrative.length > 5000) {
      return Response.json(
        {
          success: false,
          error: `Narrative length ${llmRes.residualRiskNarrative.length} outside valid range [100, 5000]`,
          length: llmRes.residualRiskNarrative.length
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      contractId,
      output: {
        riskId: inputData.riskId,
        residualRiskNarrative: llmRes.residualRiskNarrative,
        riskAcceptance: llmRes.riskAcceptance || ''
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});