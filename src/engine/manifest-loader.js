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

  _extractHostname(url) {
    try {
      const m = url.match(/^https?:\/\/([^\/\?#]+)/);
      return m ? m[1].toLowerCase() : url;
    } catch (e) {
      return url;
    }
  }

  _createProxy() {
    const self = this;
    return {
      findMatch: (url) => {
        if (!url) return null;

        // 优化：用 hostname 做缓存 key（同一 host 的请求复用结果）
        const cacheKey = self._extractHostname(url);

        if (self._memoizedMatches.has(cacheKey)) {
          return self._memoizedMatches.get(cacheKey);
        }

        let ids = null;

        // 优先使用构建时生成的 findByPrefix（exact → suffix → keyword 三级匹配）
        if (self._findByPrefix) {
          try {
            const hostname = self._extractHostname(url);
            const result = self._findByPrefix(hostname);
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
          if (regex && regex.test(url)) {
            self._memoizedMatches.set(cacheKey, id);
            if (self._memoizedMatches.size > self._maxMemoizedMatchesSize) {
              const firstKey = self._memoizedMatches.keys().next().value;
              self._memoizedMatches.delete(firstKey);
            }
            return id;
          }
        }

        self._memoizedMatches.set(cacheKey, null);
        if (self._memoizedMatches.size > self._maxMemoizedMatchesSize) {
          const firstKey = self._memoizedMatches.keys().next().value;
          self._memoizedMatches.delete(firstKey);
        }
        return null;
      },

      getConfigVersion: (configId) => (self._lazyConfigs[configId] ? '1.0' : null)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleManifestLoader };
}
