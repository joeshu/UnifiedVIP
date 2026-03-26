// ==========================================
// 正则缓存池 - LRU淘汰
// ==========================================

const RegexPool = (() => {
  const cache = new Map();
  const MAX_SIZE = 50;

  return {
    get: (pattern, flags = '') => {
      const key = `${pattern}|||${flags}`;
      if (cache.has(key)) return cache.get(key);

      try {
        const regex = new RegExp(pattern, flags);
        if (cache.size >= MAX_SIZE) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, regex);
        return regex;
      } catch (e) {
        return /(?!)/; // 永不匹配的正则
      }
    }
  };
})();

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RegexPool };
}
