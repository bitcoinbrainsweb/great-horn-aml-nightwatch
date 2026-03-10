import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function generateHash(inputs) {
  const str = JSON.stringify(inputs);
  return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str))).slice(0, 16);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { contractId, inputData, operation } = payload;

    if (!contractId || !inputData) {
      return Response.json({ error: 'contractId and inputData required' }, { status: 400 });
    }

    const inputHash = generateHash({ contractId, inputData });

    if (operation === 'check') {
      // Check if narrative is cached
      const cached = await base44.asServiceRole.entities.NarrativeCache.filter({
        contractId,
        inputHash
      });

      if (cached && cached.length > 0) {
        const result = JSON.parse(cached[0].renderedOutput);
        
        // Log cache hit
        await base44.asServiceRole.entities.SystemEvent.create({
          eventId: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          eventType: 'finding_cached',
          entityType: 'NarrativeCache',
          entityId: cached[0].id,
          actor: user.email,
          sourceFunction: 'narrativeCachingLayer',
          description: `Narrative cache hit for ${contractId}`,
          severity: 'info'
        });

        return Response.json({
          success: true,
          cacheHit: true,
          output: result
        });
      }

      return Response.json({
        success: true,
        cacheHit: false
      });
    }

    if (operation === 'store') {
      // Store narrative in cache
      const { output, modelVersion } = payload;

      const cacheId = `NCACHE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 7200000).toISOString(); // 2 hour expiry

      await base44.asServiceRole.entities.NarrativeCache.create({
        cacheId,
        contractId,
        inputHash,
        renderedOutput: JSON.stringify(output),
        modelVersion: modelVersion || 'gpt-4o-mini',
        expiresAt
      });

      return Response.json({
        success: true,
        message: `Narrative cached with ID ${cacheId}`
      });
    }

    return Response.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});