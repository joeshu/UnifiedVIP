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
    // 预编译 hostname 前缀 → [configId] 索引
    this._prefixIndex = new Map();
    this._buildPrefixIndex();
  }

  _buildPrefixIndex() {
    const ids = Object.keys(this._lazyConfigs);
    for (const id of ids) {
      const patternStr = this._lazyConfigs[id] && this._lazyConfigs[id].urlPattern;
      if (!patternStr) continue;
      let prefix = null;
      try {
        // 提取 hostname 首段作为前缀（tv/keep/vvebo 等）
        const m = patternStr.match(/https?:\/\/([^.\/]+)/);
        if (m && m[1]) prefix = m[1];
      } catch (e) {}
      if (prefix) {
        if (!this._prefixIndex.has(prefix)) this._prefixIndex.set(prefix, []);
        this._prefixIndex.get(prefix).push(id);
      }
    }
  }

  _getPrefixCandidates(url) {
    try {
      const m = url.match(/https?:\/\/([^.\/]+)/);
      if (m && m[1]) return this._prefixIndex.get(m[1]) || null;
    } catch (e) {}
    return null;
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

        // 前缀快速命中
        const prefixCandidates = self._getPrefixCandidates(url);
        const ids = prefixCandidates || Object.keys(self._lazyConfigs || {});

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
