// ==========================================
// Manifest加载器 - 延迟加载+三级索引
// ==========================================

class SimpleManifestLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._urlCache = typeof Platform !== 'undefined' && Platform.isQX ? {} : null;
    this._urlCacheKey = 'url_match_v22_lazy';
    this._regexCache = new Map();
    
    // 前缀索引（构建时注入）
    this._prefixIndex = typeof PREFIX_INDEX !== 'undefined' ? PREFIX_INDEX : {};
    
    // 延迟配置
    this._lazyConfigs = typeof BUILTIN_MANIFEST !== 'undefined' ? BUILTIN_MANIFEST.configs : {};
    
    // 恢复缓存
    if (this._urlCache && typeof $prefs !== 'undefined') {
      const saved = $prefs.valueForKey(this._urlCacheKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          for (const [k, v] of Object.entries(parsed)) {
            if (now - v.ts < 3600000) this._urlCache[k] = v;
          }
        } catch (e) {}
      }
    }
  }

  _findByPrefix(hostname) {
    if (typeof findByPrefix === 'function') {
      return findByPrefix(hostname);
    }
    
    // 内联实现（备用）
    const h = hostname.toLowerCase();
    if (this._prefixIndex.exact && this._prefixIndex.exact[h]) {
      return { ids: this._prefixIndex.exact[h], method: 'exact', matched: h };
    }
    if (this._prefixIndex.suffix) {
      for (const [suffix, ids] of Object.entries(this._prefixIndex.suffix)) {
        if (h.endsWith('.' + suffix) || h === suffix) {
          return { ids, method: 'suffix', matched: suffix };
        }
      }
    }
    if (this._prefixIndex.keyword) {
      for (const [kw, ids] of Object.entries(this._prefixIndex.keyword)) {
        if (h.includes(kw)) {
          return { ids, method: 'keyword', matched: kw };
        }
      }
    }
    return null;
  }

  _saveUrlCache() {
    if (!this._urlCache || typeof $prefs === 'undefined') return;
    const entries = Object.entries(this._urlCache)
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, 10);
    $prefs.setValueForKey(this._urlCacheKey, JSON.stringify(Object.fromEntries(entries)));
  }

  async load() {
    Logger.info('ManifestLoader', `Lazy load v${BUILTIN_MANIFEST?.version || '22.0.0'}`);
    return this._createLazyProxy();
  }

  _createLazyProxy() {
    const self = this;

    return {
      findMatch: (url) => {
        // L0: URL缓存
        if (self._urlCache) {
          const hash = url.split('?')[0];
          const cached = self._urlCache[hash];
          if (cached && (Date.now() - cached.ts) < 3600000) {
            Logger.info('ManifestLoader', `Cache hit: ${cached.id}`);
            return cached.id;
          }
        }

        // L1: 前缀索引
        let candidates = [];
        let matchInfo = null;
        
        try {
          const hostname = new URL(url).hostname;
          matchInfo = self._findByPrefix(hostname);
          if (matchInfo) {
            candidates = matchInfo.ids;
            Logger.debug('ManifestLoader', `Prefix ${matchInfo.method}: ${matchInfo.matched}`);
          }
        } catch (e) {
          Logger.debug('ManifestLoader', 'URL parse failed');
        }

        // L2: 全量回退
        if (candidates.length === 0) {
          candidates = Object.keys(self._lazyConfigs);
          Logger.debug('ManifestLoader', `Fallback: scanning ${candidates.length} patterns`);
        }

        // L3: 延迟编译+匹配
        for (const id of candidates) {
          let regex = self._regexCache.get(id);
          
          if (!regex && self._lazyConfigs[id]) {
            const patternStr = self._lazyConfigs[id].urlPattern;
            if (!patternStr) continue;
            
            try {
              regex = new RegExp(patternStr);
              self._regexCache.set(id, regex);
            } catch (e) {
              Logger.error('ManifestLoader', `Invalid regex ${id}`);
              continue;
            }
          }
          
          if (regex && regex.test(url)) {
            Logger.info('ManifestLoader', `Matched: ${id} (${self._regexCache.size}/${candidates.length})`);

            if (self._urlCache) {
              const hash = url.split('?')[0];
              self._urlCache[hash] = { id, ts: Date.now() };
              self._saveUrlCache();
            }

            return id;
          }
        }
        
        Logger.warn('ManifestLoader', `No match for ${url.substring(0,40)}...`);
        return null;
      },

      getConfigVersion: (configId) => {
        return self._lazyConfigs[configId] ? '1.0' : null;
      }
    };
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleManifestLoader };
}
