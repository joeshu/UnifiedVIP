// src/engine/config-loader.js
// 配置加载器 - 修复版 (与 vip-unlock-configs 兼容)

function prepareRegexReplacements(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.map(r => ({
    pattern: RegexPool.get(r.pattern, r.flags || 'g'),
    replacement: r.replacement
  }));
}

function prepareGameResources(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.map(r => ({
    field: r.field,
    value: r.value,
    pattern: RegexPool.get(`"${r.field}":\\d+`, 'g')
  }));
}

function prepareHtmlReplacements(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.map(r => ({
    pattern: RegexPool.get(r.pattern, r.flags || 'gi'),
    replacement: r.replacement
  }));
}

function prepareHtmlMarkers(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.filter(Boolean).map(m => String(m));
}

function buildPreparedMeta(config) {
  return {
    mode: config && config.mode ? String(config.mode) : '',
    hasProcessor: typeof config._processor === 'function' || !!config.processor,
    hasRegex: Array.isArray(config._regexReplacements) ? config._regexReplacements.length > 0 : Array.isArray(config.regexReplacements) && config.regexReplacements.length > 0,
    hasGame: Array.isArray(config._gameResources) ? config._gameResources.length > 0 : Array.isArray(config.gameResources) && config.gameResources.length > 0,
    hasHtml: Array.isArray(config._htmlReplacements) ? config._htmlReplacements.length > 0 : Array.isArray(config.htmlReplacements) && config.htmlReplacements.length > 0,
    hasHtmlMarkers: Array.isArray(config._htmlMarkers) ? config._htmlMarkers.length > 0 : Array.isArray(config.htmlMarkers) && config.htmlMarkers.length > 0
  };
}

class SimpleConfigLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._versionTag = (typeof BUILTIN_MANIFEST !== 'undefined' && BUILTIN_MANIFEST && BUILTIN_MANIFEST.version)
      ? String(BUILTIN_MANIFEST.version)
      : 'v1';

    const g = (typeof globalThis !== 'undefined') ? globalThis : {};
    this._memCache = g.__UVIP_CFG_MEM || (g.__UVIP_CFG_MEM = new Map());
    this._cacheTtl = (typeof CONFIG !== 'undefined' && CONFIG.CONFIG_CACHE_TTL)
      ? CONFIG.CONFIG_CACHE_TTL
      : 24 * 60 * 60 * 1000;

    this._factory = createProcessorFactory(this._requestId);
    this._compiler = createCompiler(this._factory);
  }

  _versionedId(configId) {
    return `${configId}@${this._versionTag}`;
  }

  _rememberPrepared(versionedId, prepared) {
    this._memCache.set(versionedId, { t: Date.now(), d: prepared });
    return prepared;
  }

  _ensurePrepared(configLike) {
    if (!configLike || typeof configLike !== 'object') return configLike;
    if (configLike._prepared === true) return configLike;
    return this._prepareConfig(configLike);
  }

  async load(configId, remoteVersion) {
    const versionedId = this._versionedId(configId);

    const memHit = this._memCache.get(versionedId);
    if (memHit) {
      return this._ensurePrepared(memHit.d);
    }

    const cached = Storage.readConfig(versionedId);
    if (cached) {
      try {
        const { d } = JSON.parse(cached);
        return this._rememberPrepared(versionedId, this._ensurePrepared(d));
      } catch (e) {}
    }

    const url = `${CONFIG.REMOTE_BASE}/configs/${configId}.json`;

    Logger.info('ConfigLoader', `${configId} fetching...`);

    try {
      const res = await HTTP.get(url);
      if (res.statusCode !== 200 || !res.body) {
        throw new Error(`HTTP ${res.statusCode}`);
      }

      const body = String(res.body);
      const firstChar = body.trimStart()[0];
      if (firstChar !== '{' && firstChar !== '[') {
        throw new Error('Non-JSON config response');
      }

      const fresh = Utils.safeJsonParse(body);
      if (!fresh || typeof fresh !== 'object') {
        throw new Error('Invalid config JSON');
      }

      Storage.writeConfig(versionedId, {
        v: remoteVersion,
        t: Date.now(),
        d: fresh
      });

      return this._rememberPrepared(versionedId, this._prepareConfig(fresh));

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);

      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        const { d } = JSON.parse(cached);
        return this._rememberPrepared(versionedId, this._ensurePrepared(d));
      }
      throw e;
    }
  }

  _prepareConfig(raw) {
    const config = Object.assign({}, raw);

    if (config._prepared === true) {
      if (!config._meta) config._meta = buildPreparedMeta(config);
      return config;
    }

    if (config.mode === 'forward' || config.mode === 'remote') {
      config._meta = buildPreparedMeta(config);
      config._prepared = true;
      return config;
    }

    if (config.processor && !config._processor) {
      try {
        config._processor = this._compiler(config.processor);
        config.processor = null;
      } catch (e) {}
    }

    if (!config._regexReplacements && raw.regexReplacements) {
      config._regexReplacements = prepareRegexReplacements(raw.regexReplacements);
      config.regexReplacements = null;
    }

    if (!config._gameResources && raw.gameResources) {
      config._gameResources = prepareGameResources(raw.gameResources);
      config.gameResources = null;
    }

    if (!config._htmlReplacements && raw.htmlReplacements) {
      config._htmlReplacements = prepareHtmlReplacements(raw.htmlReplacements);
      config.htmlReplacements = null;
    }

    if (!config._htmlMarkers && Array.isArray(raw.htmlMarkers)) {
      config._htmlMarkers = prepareHtmlMarkers(raw.htmlMarkers);
      config.htmlMarkers = null;
    }

    config._meta = buildPreparedMeta(config);
    config._prepared = true;
    return config;
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleConfigLoader };
}