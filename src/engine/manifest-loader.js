// src/engine/manifest-loader.js
// Manifest 加载器 - QX 精简版（保留主入口所需接口）

class SimpleManifestLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._lazyConfigs = (typeof BUILTIN_MANIFEST !== 'undefined' && BUILTIN_MANIFEST)
      ? (BUILTIN_MANIFEST.configs || {})
      : {};
    this._regexCache = new Map();
    this._memoizedMatches = new Map();
    this._maxMemoizedMatchesSize = 300;
  }

  async load() {
    return this._createProxy();
  }

  _createProxy() {
    const self = this;
    return {
      findMatch: (url) => {
        if (!url) return null;
        const cacheKey = url;

        if (self._memoizedMatches.has(cacheKey)) {
          return self._memoizedMatches.get(cacheKey);
        }

        const ids = Object.keys(self._lazyConfigs || {});
        for (const id of ids) {
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
