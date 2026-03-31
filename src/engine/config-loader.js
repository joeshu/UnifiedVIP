// src/engine/config-loader.js
// 配置加载器 - 修复版 (与 vip-unlock-configs 兼容)

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

  async load(configId, remoteVersion) {
    const versionedId = this._versionedId(configId);

    // 热路径：内存缓存命中直接返回（跳过 JSON.parse 验证）
    const memHit = this._memCache.get(versionedId);
    if (memHit) {
      return memHit.d;
    }

    // 冷路径：检查持久化缓存（仅内存未命中时执行）
    const cached = Storage.readConfig(versionedId);
    if (cached) {
      try {
        const { d } = JSON.parse(cached);
        this._memCache.set(versionedId, { t: Date.now(), d });
        return d;
      } catch (e) {}
    }

    // 远程加载
    const url = `${CONFIG.REMOTE_BASE}/configs/${configId}.json?t=${Date.now()}`;

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

      // 写入缓存 - 使用兼容格式
      Storage.writeConfig(versionedId, {
        v: remoteVersion,
        t: Date.now(),
        d: fresh
      });

      // 预处理配置
      const prepared = this._prepareConfig(fresh);
      this._memCache.set(versionedId, { t: Date.now(), d: prepared });
      return prepared;

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);

      // 降级使用缓存（即使过期）
      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        const { d } = JSON.parse(cached);
        this._memCache.set(versionedId, { t: Date.now(), d });
        return d; // 热缓存路径
      }
      throw e;
    }
  }

  _prepareConfig(raw) {
    const config = Object.assign({}, raw);

    if (config.mode === 'forward' || config.mode === 'remote') {
      return config;
    }

    // 预编译处理器（减少每次请求的编译开销）
    if (config.processor) {
      try {
        config._processor = this._compiler(config.processor);
        config.processor = null;
      } catch (e) {
        // ignore compile error, fallback at runtime
      }
    }

    // 预编译正则替换规则
    if (raw.regexReplacements) {
      config._regexReplacements = raw.regexReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'g'),
        replacement: r.replacement
      }));
      config.regexReplacements = null;
    }

    // 预编译游戏资源规则
    if (raw.gameResources) {
      config._gameResources = raw.gameResources.map(r => ({
        field: r.field,
        value: r.value,
        pattern: RegexPool.get(`"${r.field}":\\d+`, 'g')
      }));
      config.gameResources = null;
    }

    // 预编译 HTML 替换规则
    if (raw.htmlReplacements) {
      config._htmlReplacements = raw.htmlReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'gi'),
        replacement: r.replacement
      }));
      config.htmlReplacements = null;
    }

    // 预编译 HTML markers（用于短路）
    if (Array.isArray(raw.htmlMarkers)) {
      config._htmlMarkers = raw.htmlMarkers
        .filter(Boolean)
        .map(m => String(m));
      config.htmlMarkers = null;
    }

    return config;
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleConfigLoader };
}