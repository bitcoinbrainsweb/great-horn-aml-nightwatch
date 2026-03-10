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
          riskNarrative: { type: 'string' }
        },
        required: ['riskId', 'riskNarrative']
      }
    });

    // Validate response
    if (!llmRes.riskId || !llmRes.riskNarrative) {
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
    if (llmRes.riskNarrative.length < 100 || llmRes.riskNarrative.length > 5000) {
      return Response.json(
        {
          success: false,
          error: `Narrative length ${llmRes.riskNarrative.length} outside valid range [100, 5000]`,
          length: llmRes.riskNarrative.length
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      contractId,
      output: {
        riskId: inputData.riskId,
        riskNarrative: llmRes.riskNarrative
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});