const Storage = (() => {
  const KEY = 'vip_v22_data';
  
  // QX存储接口
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
        const ttl = typeof CONFIG !== 'undefined' ? CONFIG.CONFIG_CACHE_TTL : 86400000;
        if (item && (Date.now() - item.t) < ttl) {
          return item.d;
        }
      } catch (e) {}
      return null;
    },

    writeConfig: (configId, data) => {
      let all = {};
      const raw = qx.read(KEY);
      if (raw) {
        try { all = JSON.parse(raw); } catch (e) {}
      }

      all[configId] = { 
        v: '1.0',
        t: Date.now(), 
        d: data 
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
        if (typeof Logger !== 'undefined') {
          Logger.info('Storage', 'Storage limit exceeded, kept recent 3 configs');
        }
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
