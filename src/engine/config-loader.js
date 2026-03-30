// src/engine/config-loader.js
// 配置加载器 - 修复版 (与 vip-unlock-configs 兼容)

class SimpleConfigLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._versionTag = (typeof BUILTIN_MANIFEST !== 'undefined' && BUILTIN_MANIFEST && BUILTIN_MANIFEST.version)
      ? String(BUILTIN_MANIFEST.version)
      : 'v1';
  }

  _versionedId(configId) {
    return `${configId}@${this._versionTag}`;
  }

  async load(configId, remoteVersion) {
    const versionedId = this._versionedId(configId);

    // 检查缓存
    const cached = Storage.readConfig(versionedId);

    if (cached) {
      try {
        // 解析缓存的 JSON 字符串
        const { v, t, d } = JSON.parse(cached);
        if (v === remoteVersion && (Date.now() - t) < CONFIG.CONFIG_CACHE_TTL) {
          Logger.info('ConfigLoader', `${configId} cache hit`);
          // 热缓存路径：直接返回预处理后的对象，避免二次解析
          return d;
        }
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
      return this._prepareConfig(fresh);

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);

      // 降级使用缓存（即使过期）
      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        const { d } = JSON.parse(cached);
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

    // 预编译正则替换规则
    if (raw.regexReplacements) {
      config._regexReplacements = raw.regexReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'g'),
        replacement: r.replacement
      }));
    }

    // 预编译游戏资源规则
    if (raw.gameResources) {
      config._gameResources = raw.gameResources.map(r => ({
        field: r.field,
        value: r.value,
        pattern: RegexPool.get(`"${r.field}":\\d+`, 'g')
      }));
    }

    // 预编译 HTML 替换规则
    if (raw.htmlReplacements) {
      config._htmlReplacements = raw.htmlReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'gi'),
        replacement: r.replacement
      }));
    }

    // 预编译 HTML markers（用于短路）
    if (Array.isArray(raw.htmlMarkers)) {
      config._htmlMarkers = raw.htmlMarkers
        .filter(Boolean)
        .map(m => String(m));
    }

    return config;
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleConfigLoader };
}