// src/engine/manifest-loader.js
// Manifest 加载器 - 优化版（使用构建时 findByPrefix 索引）

class SimpleManifestLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._lazyConfigs = (typeof BUILTIN_MANIFEST !== 'undefined' && BUILTIN_MANIFEST)
      ? (BUILTIN_MANIFEST.configs || {})
      : {};
    this._regexCache = new Map();
    this._memoizedMatches = new Map();
    this._maxMemoizedMatchesSize = 300;
    // 缓存 build-time findByPrefix（由 PREFIX_INDEX 驱动）
    this._findByPrefix = (typeof findByPrefix === 'function') ? findByPrefix : null;
  }

  async load() {
    return this._createProxy();
  }

  _normalizeMeta(input, meta) {
    if (meta && typeof meta === 'object' && meta.url) {
      return meta;
    }

    const url = typeof input === 'string'
      ? input
      : (input && typeof input === 'object' && input.url ? String(input.url) : '');

    if (!url) return { url: '', hostname: '', pathname: '', search: '' };

    try {
      const parsed = new URL(url);
      return {
        url,
        hostname: (parsed.hostname || '').toLowerCase(),
        pathname: parsed.pathname || '',
        search: parsed.search || ''
      };
    } catch (e) {
      const m = url.match(/^https?:\/\/([^\/\?#]+)([^\?#]*)?(\?[^#]*)?/i);
      return {
        url,
        hostname: m && m[1] ? m[1].toLowerCase() : url,
        pathname: m && m[2] ? m[2] : '',
        search: m && m[3] ? m[3] : ''
      };
    }
  }

  _remember(cacheKey, value) {
    this._memoizedMatches.set(cacheKey, value);
    if (this._memoizedMatches.size > this._maxMemoizedMatchesSize) {
      const firstKey = this._memoizedMatches.keys().next().value;
      this._memoizedMatches.delete(firstKey);
    }
  }

  _getConfigMeta(configId) {
    const item = this._lazyConfigs[configId];
    return item && item.meta ? item.meta : null;
  }

  _createProxy() {
    const self = this;
    return {
      findMatch: (input, meta) => {
        const requestMeta = self._normalizeMeta(input, meta);
        if (!requestMeta.url) return null;

        // 优化：用 hostname 做缓存 key（同一 host 的请求复用结果）
        const cacheKey = requestMeta.hostname || requestMeta.url;

        if (self._memoizedMatches.has(cacheKey)) {
          return self._memoizedMatches.get(cacheKey);
        }

        let ids = null;

        // 优先使用构建时生成的 findByPrefix（exact → suffix → keyword 三级匹配）
        if (self._findByPrefix && requestMeta.hostname) {
          try {
            const result = self._findByPrefix(requestMeta.hostname);
            if (result && result.ids) ids = result.ids;
          } catch (e) {}
        }

        // 兜底：无 findByPrefix 或无命中时测试全部
        const candidates = ids || Object.keys(self._lazyConfigs || {});

        for (const id of candidates) {
          let regex = self._regexCache.get(id);
          if (!regex && self._lazyConfigs[id]) {
            const patternStr = self._lazyConfigs[id].urlPattern;
            if (!patternStr) continue;
            try {
              regex = new RegExp(patternStr);
              self._regexCache.set(id, regex);
            } catch (e) {
              continue;
            }
          }
          if (regex && regex.test(requestMeta.url)) {
            self._remember(cacheKey, id);
            return id;
          }
        }

        self._remember(cacheKey, null);
        return null;
      },

      getConfigVersion: (configId) => (self._lazyConfigs[configId] ? '1.0' : null),
      getConfigMeta: (configId) => self._getConfigMeta(configId)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleManifestLoader };
}
