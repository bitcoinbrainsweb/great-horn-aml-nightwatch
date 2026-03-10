import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { templateId, inputData } = await req.json();

    if (!templateId || !inputData) {
      return Response.json(
        { error: 'templateId and inputData required' },
        { status: 400 }
      );
    }

    // Fetch template
    const templates = await base44.entities.PromptTemplate.filter({
      templateId
    });

    if (templates.length === 0) {
      return Response.json(
        { error: `Template not found: ${templateId}` },
        { status: 404 }
      );
    }

    const template = templates[0];

    if (!template.data.active) {
      return Response.json(
        { error: `Template inactive: ${templateId}` },
        { status: 403 }
      );
    }

    // Render template
    let renderedPrompt = template.data.templateBody;
    const expectedFields = template.data.expectedInputFields || [];
    const missingFields = [];

    for (const field of expectedFields) {
      const placeholder = `{{${field}}}`;
      const value = inputData[field];

      if (value === undefined || value === null) {
        missingFields.push(field);
        continue;
      }

      renderedPrompt = renderedPrompt.replaceAll(
        placeholder,
        String(value)
      );
    }

    if (missingFields.length > 0) {
      return Response.json(
        {
          error: `Missing template fields: ${missingFields.join(', ')}`,
          templateId,
          missingFields
        },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      templateId,
      contractId: template.data.contractId,
      renderedPrompt,
      fieldsUsed: expectedFields
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});