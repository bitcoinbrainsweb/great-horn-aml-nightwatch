import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function generateHash(data) {
  const str = JSON.stringify(data);
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
    const { libraryType, filters = {} } = payload;

    if (!libraryType) {
      return Response.json({ error: 'libraryType required' }, { status: 400 });
    }

    const inputHash = generateHash({ libraryType, filters });

    // Check cache first
    const cachedResults = await base44.asServiceRole.entities.LibraryCache.filter({
      libraryType,
      inputHash
    });

    if (cachedResults && cachedResults.length > 0) {
      const cached = cachedResults[0];
      const libraryData = JSON.parse(cached.libraryData);
      
      // Log cache hit
      await base44.asServiceRole.entities.SystemEvent.create({
        eventId: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        eventType: 'cache_hit',
        entityType: 'LibraryCache',
        entityId: cached.id,
        actor: user.email,
        sourceFunction: 'libraryCachingLayer',
        description: `Cache hit for ${libraryType}`,
        severity: 'info'
      });

      return Response.json({
        success: true,
        cacheHit: true,
        libraryType,
        itemCount: Array.isArray(libraryData) ? libraryData.length : 1,
        data: libraryData
      });
    }

    // Cache miss - load library
    const libraryResults = await base44.asServiceRole.entities[libraryType].list();
    const libraryData = libraryResults || [];

    // Store in cache
    const cacheId = `CACHE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry

    await base44.asServiceRole.entities.LibraryCache.create({
      cacheId,
      libraryType,
      libraryVersion: 1,
      libraryData: JSON.stringify(libraryData),
      inputHash,
      expiresAt
    });

    // Log cache miss
    await base44.asServiceRole.entities.SystemEvent.create({
      eventId: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType: 'cache_miss',
      entityType: 'LibraryCache',
      entityId: cacheId,
      actor: user.email,
      sourceFunction: 'libraryCachingLayer',
      description: `Cache miss for ${libraryType}, loaded and cached ${libraryData.length} items`,
      severity: 'info'
    });

    return Response.json({
      success: true,
      cacheHit: false,
      libraryType,
      itemCount: libraryData.length,
      data: libraryData
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});