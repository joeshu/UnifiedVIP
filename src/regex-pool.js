// 正则缓存池
const RegexPool = (() => {
  const cache = new Map();
  const MAX_SIZE = 100;

  return {
    get: (pattern, flags = '') => {
      const key = `${pattern}|||${flags}`;
      if (cache.has(key)) {
        cache.get(key).lastUsed = Date.now();
        return cache.get(key).regex;
      }

      try {
        const regex = new RegExp(pattern, flags);
        
        // LRU淘汰
        if (cache.size >= MAX_SIZE) {
          let oldest = null;
          let oldestTime = Infinity;
          for (const [k, v] of cache) {
            if (v.lastUsed < oldestTime) {
              oldestTime = v.lastUsed;
              oldest = k;
            }
          }
          if (oldest) cache.delete(oldest);
        }
        
        cache.set(key, { regex, lastUsed: Date.now() });
        return regex;
      } catch (e) {
        console.error(`Invalid regex: ${pattern}`);
        return /(?!)/; // 永不匹配的正则
      }
    },

    clear: () => cache.clear()
  };
})();
