// src/engine/config-loader.js
// 配置加载器 - 支持远程加载和缓存

class SimpleConfigLoader {
  constructor(requestId) {
    this._requestId = requestId;
  }

  async load(configId, remoteVersion) {
    // 检查缓存
    const cached = Storage.readConfig(configId);
    if (cached) {
      Logger.info('ConfigLoader', `${configId} cache hit`);
      return this._prepareConfig(cached);
    }

    // 远程加载
    const remoteBase = typeof CONFIG !== 'undefined' ? CONFIG.REMOTE_BASE : 'https://joeshu.github.io/UnifiedVIP';
    const url = `${remoteBase}/configs/${configId}.json?t=${Date.now()}`;
    
    Logger.info('ConfigLoader', `${configId} fetching...`);

    try {
      const res = await HTTP.get(url, typeof CONFIG !== 'undefined' ? CONFIG.TIMEOUT * 1000 : 10000);
      
      if (res.statusCode !== 200 || !res.body) {
        throw new Error(`HTTP ${res.statusCode}`);
      }

      const config = Utils.safeJsonParse(res.body);
      if (!config) {
        throw new Error('Invalid JSON');
      }

      // 写入缓存
      Storage.writeConfig(configId, config);
      
      // 返回预处理后的配置
      return this._prepareConfig(config);

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);
      
      // 降级使用缓存（即使过期）
      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        return this._prepareConfig(cached);
      }
      
      throw e;
    }
  }

  // 预处理配置（关键修复：预编译正则规则）
  _prepareConfig(raw) {
    const config = Object.assign({}, raw);

    // forward/remote 模式不需要预处理
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleConfigLoader };
}