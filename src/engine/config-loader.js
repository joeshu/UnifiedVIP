// src/engine/config-loader.js
// 配置加载器 - 修复版 (与 vip-unlock-configs 兼容)

class SimpleConfigLoader {
  constructor(requestId) {
    this._requestId = requestId;
  }

  async load(configId, remoteVersion) {
    // 检查缓存
    const cached = Storage.readConfig(configId);

    if (cached) {
      try {
        // 解析缓存的 JSON 字符串
        const { v, t, d } = JSON.parse(cached);
        if (v === remoteVersion && (Date.now() - t) < CONFIG.CONFIG_CACHE_TTL) {
          Logger.info('ConfigLoader', `${configId} cache hit`);
          return this._prepareConfig(d);
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

      const fresh = Utils.safeJsonParse(res.body);

      // 写入缓存 - 使用兼容格式
      Storage.writeConfig(configId, {
        v: remoteVersion,
        t: Date.now(),
        d: fresh
      });

      return this._prepareConfig(fresh);

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);

      // 降级使用缓存（即使过期）
      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        const { d } = JSON.parse(cached);
        return this._prepareConfig(d);
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

    return config;
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleConfigLoader };
}