class SimpleManifestLoader {
  constructor() {
    this._urlCache = Platform.isQX ? {} : null;
    this._urlCacheKey = 'url_match_v22';
    this._regexCache = new Map();
    
    // 🔥 自动生成前缀索引
    this._prefixIndex = this._generatePrefixIndex(BUILTIN_MANIFEST.configs);
    
    this._lazyConfigs = BUILTIN_MANIFEST.configs;
    
    // 恢复缓存
    if (Platform.isQX) {
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

  // 🔥 自动生成前缀索引
  _generatePrefixIndex(configs) {
    const index = {
      exact: {},
      suffix: {},
      keyword: {}
    };

    for (const [id, cfg] of Object.entries(configs)) {
      const pattern = cfg.urlPattern;
      
      // 提取域名
      const domainMatches = pattern.match(/[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/gi);
      if (!domainMatches) continue;

      for (const domain of domainMatches) {
        const parts = domain.toLowerCase().split('.');
        
        if (parts.length >= 3) {
          // 三级域名 → exact
          index.exact[domain] = [id];
          // 二级域名 → suffix
          const suffix = parts.slice(-2).join('.');
          if (!index.suffix[suffix]) {
            index.suffix[suffix] = [];
          }
          if (!index.suffix[suffix].includes(id)) {
            index.suffix[suffix].push(id);
          }
        } else {
          // 二级域名 → suffix
          if (!index.suffix[domain]) {
            index.suffix[domain] = [];
          }
          if (!index.suffix[domain].includes(id)) {
            index.suffix[domain].push(id);
          }
        }
        
        // 提取关键字（去掉通用词）
        const keywords = parts.filter(p => 
          p.length >= 4 && 
          !['api', 'www', 'm', 'mobile', 'app', 'v1', 'v2', 'v3', 'service'].includes(p)
        );
        
        for (const kw of keywords) {
          if (!index.keyword[kw] && kw.length >= 4) {
            index.keyword[kw] = [id];
          }
        }
      }
    }

    return index;
  }

  _findByPrefix(hostname) {
    const h = hostname.toLowerCase();
    
    if (this._prefixIndex.exact[h]) {
      return { ids: this._prefixIndex.exact[h], method: 'exact' };
    }
    
    for (const [suffix, ids] of Object.entries(this._prefixIndex.suffix)) {
      if (h.endsWith('.' + suffix) || h === suffix) {
        return { ids, method: 'suffix' };
      }
    }
    
    for (const [kw, ids] of Object.entries(this._prefixIndex.keyword)) {
      if (h.includes(kw)) {
        return { ids, method: 'keyword' };
      }
    }
    
    return null;
  }

  load() {
    return this._createProxy();
  }

  _saveUrlCache() {
    if (!Platform.isQX || !this._urlCache) return;
    const entries = Object.entries(this._urlCache)
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, 10);
    $prefs.setValueForKey(this._urlCacheKey, JSON.stringify(Object.fromEntries(entries)));
  }

  _createProxy() {
    const self = this;
    
    return {
      findMatch: (url) => {
        if (Platform.isQX && self._urlCache) {
          const hash = url.split('?')[0];
          const cached = self._urlCache[hash];
          if (cached && (Date.now() - cached.ts) < 3600000) {
            return cached.id;
          }
        }

        let candidates = [];
        
        try {
          const hostname = new URL(url).hostname;
          const match = self._findByPrefix(hostname);
          
          if (match) {
            candidates = match.ids;
          }
        } catch (e) {}

        if (candidates.length === 0) {
          candidates = Object.keys(self._lazyConfigs);
        }

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
            if (Platform.isQX && self._urlCache) {
              const hash = url.split('?')[0];
              self._urlCache[hash] = { id, ts: Date.now() };
              self._saveUrlCache();
            }
            
            return id;
          }
        }
        
        return null;
      },

      getConfigVersion: () => '1.0'
    };
  }
}
