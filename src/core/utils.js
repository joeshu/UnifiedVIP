// src/core/utils.js
// 工具函数集 - 路径预编译优化版

const __pathTokenCache = new Map();
const __maxPathTokenCacheSize = 300;

function _tokenizePath(path) {
  if (!path || typeof path !== 'string') return [];
  const hit = __pathTokenCache.get(path);
  if (hit) return hit;

  const tokens = path.split('.').map(part => {
    const m = part.match(/^([^\[\]]+)\[(\d+)\]$/);
    if (m) {
      return { key: m[1], isArray: true, index: parseInt(m[2], 10) };
    }
    return { key: part, isArray: false, index: -1 };
  });

  if (__pathTokenCache.size >= __maxPathTokenCacheSize) {
    const firstKey = __pathTokenCache.keys().next().value;
    __pathTokenCache.delete(firstKey);
  }
  __pathTokenCache.set(path, tokens);
  return tokens;
}

const Utils = {
  safeJsonParse: (str, defaultVal = null) => {
    try { return JSON.parse(str); } catch (e) { return defaultVal; }
  },

  safeJsonStringify: (obj) => {
    try { return JSON.stringify(obj); } catch (e) { return '{}'; }
  },

  compilePath: (path) => _tokenizePath(path),

  getPath: (obj, pathOrTokens) => {
    if (!obj || !pathOrTokens) return undefined;
    const tokens = Array.isArray(pathOrTokens) ? pathOrTokens : _tokenizePath(pathOrTokens);
    let current = obj;

    for (const token of tokens) {
      if (current == null) return undefined;
      if (token.isArray) {
        const arr = current[token.key];
        current = arr && arr[token.index];
      } else {
        current = current[token.key];
      }
    }
    return current;
  },

  setPath: (obj, pathOrTokens, value) => {
    if (!obj || !pathOrTokens) return obj;
    const tokens = Array.isArray(pathOrTokens) ? pathOrTokens : _tokenizePath(pathOrTokens);
    if (!tokens.length) return obj;

    let current = obj;

    for (let i = 0; i < tokens.length - 1; i++) {
      const token = tokens[i];
      const next = tokens[i + 1];

      if (token.isArray) {
        const arr = current[token.key] || (current[token.key] = []);
        if (arr[token.index] == null) {
          arr[token.index] = next && next.isArray ? [] : {};
        }
        current = arr[token.index];
      } else {
        if (current[token.key] == null) {
          current[token.key] = next && next.isArray ? [] : {};
        }
        current = current[token.key];
      }
    }

    const last = tokens[tokens.length - 1];
    if (last.isArray) {
      const arr = current[last.key] || (current[last.key] = []);
      arr[last.index] = value;
    } else {
      current[last.key] = value;
    }
    return obj;
  },

  simpleHash: (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },

  resolveTemplate: (str, obj) => {
    if (typeof str !== 'string') return str;
    if (!str.includes('{{')) return str;
    return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = Utils.getPath(obj, path.trim());
      return value !== undefined ? value : match;
    });
  },

  formatObject: (obj, separator = '\n') => {
    if (typeof obj !== 'object' || obj === null) return String(obj);
    if (Array.isArray(obj)) {
      return obj.map(item => Utils.formatObject(item, separator)).join(separator);
    }
    return Object.entries(obj)
      .map(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          return `${k}: ${Utils.formatObject(v, separator)}`;
        }
        return `${k}: ${v}`;
      })
      .join(separator);
  }
};

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Utils };
}
