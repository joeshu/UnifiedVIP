// ==========================================
// 配置加载器 - 远程加载+缓存
// ==========================================

class SimpleConfigLoader {
  constructor(requestId) {
    this._requestId = requestId;
  }

  async load(configId, remoteVersion) {
    // 检查缓存
    const cached = Storage.readConfig(configId);
    if (cached) {
      Logger.info('ConfigLoader', `${configId} cache hit`);
      return cached;
    }

    // 远程加载
    const remoteBase = typeof CONFIG !== 'undefined' ? CONFIG.REMOTE_BASE : 'https://joeshu.github.io/vip-unlock-configs';
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
      
      return config;

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);
      
      // 降级使用缓存（即使过期）
      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        return cached;
      }
      
      throw e;
    }
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleConfigLoader };
}
