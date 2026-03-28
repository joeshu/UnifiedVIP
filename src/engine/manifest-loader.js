class SimpleManifestLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._urlCache = typeof Platform !== 'undefined' && Platform.isQX ? {} : null;

    const runtimeCfg = (typeof CONFIG !== 'undefined' && CONFIG) ? CONFIG : {};

    this._urlCacheKey = runtimeCfg.URL_CACHE_KEY || 'url_match_v22_lazy';
    this._urlMetaKey = runtimeCfg.URL_CACHE_META_KEY || `${this._urlCacheKey}_meta`;

    const legacyKeys = Array.isArray(runtimeCfg.URL_CACHE_LEGACY_KEYS)
      ? runtimeCfg.URL_CACHE_LEGACY_KEYS
      : ['url_match_v22', 'url_match_v21_lazy', 'url_match_cache_v22'];

    this._legacyUrlCacheKeys = [this._urlCacheKey, ...legacyKeys]
      .filter((k, i, arr) => typeof k === 'string' && k && arr.indexOf(k) === i);
    this._legacyMetaKeys = [this._urlMetaKey, ...this._legacyUrlCacheKeys.map(k => `${k}_meta`)]
      .filter((k, i, arr) => typeof k === 'string' && k && arr.indexOf(k) === i);

    this._cacheTtlMs = this._readPositiveNumber(runtimeCfg.URL_CACHE_TTL_MS, 3600000); // 1h
    this._persistIntervalMs = this._readPositiveNumber(runtimeCfg.URL_CACHE_PERSIST_INTERVAL_MS, 15000); // 15s
    this._persistLimit = Math.max(10, Math.min(200, Math.floor(this._readPositiveNumber(runtimeCfg.URL_CACHE_LIMIT, 50))));

    // 命中统计（QX）
    this._statsKey = runtimeCfg.MATCH_STATS_KEY || 'uvip_match_stats_v1';
    this._statsMetaKey = runtimeCfg.MATCH_STATS_META_KEY || `${this._statsKey}_meta`;
    this._statsFlushIntervalMs = this._readPositiveNumber(runtimeCfg.MATCH_STATS_FLUSH_INTERVAL_MS, 60000);
    this._statsFlushEveryN = Math.max(10, Math.floor(this._readPositiveNumber(runtimeCfg.MATCH_STATS_FLUSH_EVERY_N, 20)));
    this._statsMeta = this._loadStatsMeta();
    this._stats = this._loadStats();
    this._statsPending = 0;

    this._regexCache = new Map();

    // 前缀索引（构建时注入）
    this._prefixIndex = typeof PREFIX_INDEX !== 'undefined' ? PREFIX_INDEX : {};

    // 延迟配置
    this._lazyConfigs = typeof BUILTIN_MANIFEST !== 'undefined' ? BUILTIN_MANIFEST.configs : {};

    this._persistMeta = this._loadPersistMeta();

    // 恢复缓存（兼容旧 key）
    if (this._urlCache && typeof $prefs !== 'undefined') {
      const { raw, keyUsed } = this._readFirstAvailable(this._legacyUrlCacheKeys);
      if (raw) {
        this._restoreUrlCache(raw);

        // 如果来自旧 key，尽快迁移到新 key（受节流控制）
        if (keyUsed && keyUsed !== this._urlCacheKey) {
          this._saveUrlCache(true);
        }
      }
    }
  }

  _readPositiveNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  _readFirstAvailable(keys) {
    if (typeof $prefs === 'undefined') return { raw: null, keyUsed: null };

    for (const key of keys) {
      try {
        const raw = $prefs.valueForKey(key);
        if (raw) return { raw, keyUsed: key };
      } catch (e) {}
    }

    return { raw: null, keyUsed: null };
  }

  _restoreUrlCache(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      const now = Date.now();
      for (const [k, v] of Object.entries(parsed)) {
        if (!v || typeof v !== 'object') continue;
        if (!v.id || !v.ts) continue;
        if (now - v.ts < this._cacheTtlMs) {
          this._urlCache[k] = { id: v.id, ts: v.ts };
        }
      }
    } catch (e) {}
  }

  _loadPersistMeta() {
    if (typeof $prefs === 'undefined') {
      return { lastPersistAt: 0 };
    }

    const { raw } = this._readFirstAvailable(this._legacyMetaKeys);
    if (!raw) return { lastPersistAt: 0 };

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lastPersistAt === 'number') {
        return { lastPersistAt: parsed.lastPersistAt };
      }
    } catch (e) {}

    return { lastPersistAt: 0 };
  }

  _loadStatsMeta() {
    if (typeof $prefs === 'undefined') {
      return { lastFlushAt: 0 };
    }

    try {
      const raw = $prefs.valueForKey(this._statsMetaKey);
      if (!raw) return { lastFlushAt: 0 };
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lastFlushAt === 'number') {
        return { lastFlushAt: parsed.lastFlushAt };
      }
    } catch (e) {}

    return { lastFlushAt: 0 };
  }

  _loadStats() {
    const defaults = {
      cacheHit: 0,
      cacheMiss: 0,
      exact: 0,
      suffix: 0,
      keyword: 0,
      fallback: 0,
      missPrefix: 0,
      missRegex: 0,
      invalidPattern: 0,
      urlParseFail: 0,
      updatedAt: Date.now()
    };

    if (typeof $prefs === 'undefined') return defaults;

    try {
      const raw = $prefs.valueForKey(this._statsKey);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return defaults;
      return { ...defaults, ...parsed, updatedAt: Date.now() };
    } catch (e) {
      return defaults;
    }
  }

  _incrementStat(key, delta = 1) {
    if (!this._stats || typeof this._stats !== 'object') return;
    this._stats[key] = (this._stats[key] || 0) + delta;
    this._stats.updatedAt = Date.now();
    this._statsPending += 1;
    this._flushStats(false);
  }

  _flushStats(force = false) {
    if (typeof $prefs === 'undefined' || !this._stats) return;

    const now = Date.now();
    const reachCount = this._statsPending >= this._statsFlushEveryN;
    const reachTime = (now - (this._statsMeta.lastFlushAt || 0)) >= this._statsFlushIntervalMs;

    if (!force && !reachCount && !reachTime) return;

    try {
      $prefs.setValueForKey(this._statsKey, JSON.stringify(this._stats));
      this._statsMeta.lastFlushAt = now;
      $prefs.setValueForKey(this._statsMetaKey, JSON.stringify(this._statsMeta));
      this._statsPending = 0;
    } catch (e) {}
  }

  _buildUrlCacheKey(url) {
    const method = (typeof $request !== 'undefined' && $request && $request.method)
      ? String($request.method).toUpperCase()
      : 'GET';

    try {
      const u = new URL(url);
      return `${method}|${u.hostname.toLowerCase()}|${u.pathname}`;
    } catch (e) {
      return `${method}|${String(url || '').split('?')[0]}`;
    }
  }

  _findByPrefix(hostname) {
    if (typeof findByPrefix === 'function') {
      return findByPrefix(hostname);
    }

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

  _saveUrlCache(force = false) {
    if (!this._urlCache || typeof $prefs === 'undefined') return;

    const now = Date.now();
    if (!force && (now - this._persistMeta.lastPersistAt) < this._persistIntervalMs) {
      return;
    }

    const entries = Object.entries(this._urlCache)
      .filter(([, v]) => v && typeof v.ts === 'number' && (now - v.ts) < this._cacheTtlMs)
      .sort((a, b) => b[1].ts - a[1].ts)
      .slice(0, this._persistLimit);

    try {
      $prefs.setValueForKey(this._urlCacheKey, JSON.stringify(Object.fromEntries(entries)));
      this._persistMeta.lastPersistAt = now;
      $prefs.setValueForKey(this._urlMetaKey, JSON.stringify(this._persistMeta));
    } catch (e) {}
  }

  _touchUrlCache(cacheKey, id) {
    if (!this._urlCache) return;

    const now = Date.now();
    const prev = this._urlCache[cacheKey];
    const changed = !prev || prev.id !== id;

    this._urlCache[cacheKey] = { id, ts: now };

    this._saveUrlCache(changed);
  }

  async load() {
    Logger.info('ManifestLoader', `Lazy load v${BUILTIN_MANIFEST?.version || '22.0.0'}`);
    return this._createLazyProxy();
  }

  _createLazyProxy() {
    const self = this;

    return {
      findMatch: (url) => {
        const cacheKey = self._buildUrlCacheKey(url);

        // L0: URL缓存
        if (self._urlCache) {
          const cached = self._urlCache[cacheKey];
          if (cached && (Date.now() - cached.ts) < self._cacheTtlMs) {
            Logger.info('ManifestLoader', `Cache hit: ${cached.id}`);
            self._incrementStat('cacheHit');
            self._touchUrlCache(cacheKey, cached.id);
            return cached.id;
          }
        }
        self._incrementStat('cacheMiss');

        // L1: 前缀索引
        let candidates = [];
        let matchInfo = null;

        try {
          const hostname = new URL(url).hostname;
          matchInfo = self._findByPrefix(hostname);
          if (matchInfo) {
            candidates = matchInfo.ids;
            self._incrementStat(matchInfo.method);
            Logger.debug('ManifestLoader', `Prefix ${matchInfo.method}: ${matchInfo.matched}`);
          } else {
            self._incrementStat('missPrefix');
            Logger.debug('ManifestLoader', 'MISS_PREFIX: no prefix index match');
          }
        } catch (e) {
          self._incrementStat('urlParseFail');
          Logger.debug('ManifestLoader', 'URL_PARSE_FAIL: parse url failed');
        }

        // L2: 全量回退
        if (candidates.length === 0) {
          self._incrementStat('fallback');
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
              self._incrementStat('invalidPattern');
              Logger.error('ManifestLoader', `INVALID_PATTERN: ${id}`);
              continue;
            }
          }

          if (regex && regex.test(url)) {
            Logger.info('ManifestLoader', `Matched: ${id} (${self._regexCache.size}/${candidates.length})`);

            if (self._urlCache) {
              self._touchUrlCache(cacheKey, id);
            }
            return id;
          }
        }

        self._incrementStat('missRegex');
        Logger.warn('ManifestLoader', `MISS_REGEX: No match for ${url.substring(0,40)}...`);
        return null;
      },

      getConfigVersion: (configId) => {
        return self._lazyConfigs[configId] ? '1.0' : null;
      },

      getStats: () => ({ ...self._stats }),

      flushStats: () => self._flushStats(true)
    };
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleManifestLoader };
}
