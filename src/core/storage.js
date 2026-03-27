// src/core/storage.js
// M3单键存储系统 - 与 vip-unlock-configs 兼容版本

const Storage = (() => {
  const KEY = 'vip_v22_data';

  const qx = {
    read: (k) => $prefs.valueForKey(k),
    write: (k, v) => $prefs.setValueForKey(v, k),
    remove: (k) => $prefs.removeValueForKey(k)
  };

  return {
    readConfig: (configId) => {
      const raw = qx.read(KEY);
      if (!raw) return null;
      try {
        const all = JSON.parse(raw);
        const item = all[configId];
        const ttl = typeof CONFIG !== 'undefined' ? CONFIG.CONFIG_CACHE_TTL : 24 * 60 * 60 * 1000;
        if (item && (Date.now() - item.t) < ttl) {
          // 修复：返回 JSON 字符串，与 vip-unlock-configs 兼容
          return JSON.stringify(item);
        }
      } catch (e) {}
      return null;
    },

    writeConfig: (configId, value) => {
      let all = {};
      const raw = qx.read(KEY);
      if (raw) {
        try { all = JSON.parse(raw); } catch (e) {}
      }

      // 兼容处理：value 可能是对象或 JSON 字符串
      let parsed;
      try {
        parsed = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        parsed = value;
      }

      // 确保存储结构包含 v, t, d
      all[configId] = {
        v: parsed.v || '1.0',
        t: Date.now(),
        d: parsed.d || parsed
      };

      let str = JSON.stringify(all);
      const maxSize = typeof Platform !== 'undefined' && Platform.isQX ? 500000 : Infinity;

      // M3: 超限保护，保留最近3个
      if (str.length > maxSize) {
        const sorted = Object.entries(all)
          .sort((a, b) => (b[1].t || 0) - (a[1].t || 0))
          .slice(0, 3);
        all = Object.fromEntries(sorted);
        str = JSON.stringify(all);
        Logger.info('Storage', 'QX存储超限，保留最近3个配置');
      }

      qx.write(KEY, str);
    },

    read: (key) => qx.read(key),
    write: (key, value) => qx.write(key, value),
    remove: (key) => qx.remove(key)
  };
})();

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Storage };
}
