import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CONFIG_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { configKey, returnType = 'value' } = payload;

    if (!configKey) {
      return Response.json({ error: 'configKey required' }, { status: 400 });
    }

    // Check cache
    const cached = CONFIG_CACHE.get(configKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json({
        success: true,
        configKey,
        value: cached.value,
        default: cached.default,
        cached: true,
        type: cached.type
      });
    }

    // Load from database
    const configs = await base44.asServiceRole.entities.SystemConfig.filter({
      configKey,
      active: true
    });

    if (!configs || configs.length === 0) {
      return Response.json({
        success: false,
        configKey,
        value: null,
        error: 'Config not found'
      }, { status: 404 });
    }

    const config = configs[0];
    let value = config.configValue;

    // Parse based on type
    if (config.configType === 'boolean') {
      value = value === 'true' || value === '1';
    } else if (config.configType === 'number') {
      value = parseFloat(value);
    } else if (config.configType === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        console.error('Failed to parse JSON config:', configKey, e.message);
      }
    }

    // Cache the result
    CONFIG_CACHE.set(configKey, {
      value,
      default: config.defaultValue,
      type: config.configType,
      expiresAt: Date.now() + CACHE_TTL
    });

    return Response.json({
      success: true,
      configKey,
      value,
      default: config.defaultValue,
      description: config.description,
      type: config.configType,
      active: config.active
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});