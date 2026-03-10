import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contractId, inputData, operationType } = await req.json();

    if (!contractId || !inputData) {
      return Response.json(
        { error: 'contractId and inputData required' },
        { status: 400 }
      );
    }

    // Fetch contract
    const contracts = await base44.entities.GenerationContract.filter({
      contractId
    });

    if (contracts.length === 0) {
      return Response.json(
        { error: `Contract not found: ${contractId}` },
        { status: 404 }
      );
    }

    const contract = contracts[0];

    if (!contract.data.active) {
      return Response.json(
        { error: `Contract inactive: ${contractId}` },
        { status: 403 }
      );
    }

    // Parse schemas
    let inputSchema = {};
    let validationRules = {};

    try {
      inputSchema = JSON.parse(contract.data.inputSchema || '{}');
      validationRules = JSON.parse(contract.data.validationRules || '{}');
    } catch (e) {
      return Response.json(
        { error: 'Invalid schema JSON in contract' },
        { status: 500 }
      );
    }

    // Validate input
    const requiredFields = inputSchema.required || [];
    const allowedFields = inputSchema.properties
      ? Object.keys(inputSchema.properties)
      : [];

    const errors = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in inputData)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check for unsupported fields
    const providedFields = Object.keys(inputData);
    for (const field of providedFields) {
      if (!allowedFields.includes(field)) {
        errors.push(`Unsupported field: ${field}`);
      }
    }

    // Validate field types (basic)
    for (const [field, value] of Object.entries(inputData)) {
      const fieldSchema = inputSchema.properties?.[field];
      if (!fieldSchema) continue;

      const expectedType = fieldSchema.type;
      const actualType = typeof value;

      if (expectedType === 'string' && actualType !== 'string') {
        errors.push(
          `Field ${field} must be string, got ${actualType}`
        );
      } else if (expectedType === 'number' && actualType !== 'number') {
        errors.push(
          `Field ${field} must be number, got ${actualType}`
        );
      } else if (expectedType === 'boolean' && actualType !== 'boolean') {
        errors.push(
          `Field ${field} must be boolean, got ${actualType}`
        );
      }

      // Check string length limits
      if (expectedType === 'string' && validationRules[field]?.maxLength) {
        if (value.length > validationRules[field].maxLength) {
          errors.push(
            `Field ${field} exceeds max length ${validationRules[field].maxLength}`
          );
        }
      }
    }

    if (errors.length > 0) {
      return Response.json(
        {
          valid: false,
          contractId,
          errors,
          inputData
        },
        { status: 400 }
      );
    }

    return Response.json({
      valid: true,
      contractId,
      contract: {
        id: contract.id,
        contractId: contract.data.contractId,
        inputSchema,
        outputSchema: JSON.parse(contract.data.outputSchema || '{}'),
        generatorFunction: contract.data.generatorFunction,
        templateId: contract.data.templateId
      },
      validatedInput: inputData
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});