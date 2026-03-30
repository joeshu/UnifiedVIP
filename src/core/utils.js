// src/core/utils.js
// 工具函数集 - 完整版

const Utils = {
  safeJsonParse: (str, defaultVal = null) => {
    if (typeof str !== 'string') return defaultVal;
    const s = str.trim();
    if (!s) return defaultVal;
    const c = s[0];
    if (c !== '{' && c !== '[') return defaultVal;
    try { return JSON.parse(s); } catch (e) { return defaultVal; }
  },

  safeJsonStringify: (obj) => {
    try { return JSON.stringify(obj); } catch (e) { return '{}'; }
  },

  getPath: (obj, path) => {
    if (!path || !obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      const match = part.match(/^([^\\[\\]+)\\[(\\d+)\\]$/);
      if (match) {
        current = current[match[1]] && current[match[1]][parseInt(match[2])];
      } else {
        current = current[part];
      }
    }
    return current;
  },

  setPath: (obj, path, value) => {
    if (!path || !obj) return obj;
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const next = parts[i + 1];
      const match = part.match(/^([^\\[\\]+)\\[(\\d+)\\]$/);
      const isNextArray = /^\\[.*\\]$/.test(next);

      if (match) {
        const arr = current[match[1]] || (current[match[1]] = []);
        current = arr[parseInt(match[2])] || (arr[parseInt(match[2])] = isNextArray ? [] : {});
      } else {
        current = current[part] || (current[part] = isNextArray ? [] : {});
      }
    }

    const last = parts[parts.length - 1];
    const lastMatch = last.match(/^([^\\[\\]+)\\[(\\d+)\\]$/);
    if (lastMatch) {
      const arr = current[lastMatch[1]] || (current[lastMatch[1]] = []);
      arr[parseInt(lastMatch[2])] = value;
    } else {
      current[last] = value;
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