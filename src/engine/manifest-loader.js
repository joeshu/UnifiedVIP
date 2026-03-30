// src/engine/manifest-loader.js
// Manifest 加载器 - QX 纯净版（去除统计/迁移/多分支）

class SimpleManifestLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._versionTag = (typeof BUILTIN_MANIFEST !== 'undefined' && BUILTIN_MANIFEST && BUILTIN_MANIFEST.version)
      ? String(BUILTIN_MANIFEST.version)
      : 'v1';

    this._cacheKey = `uvip_manifest_${this._versionTag}`;
    this._manifest = null;
    this._lazyConfigs = null;
    this._regexCache = new Map();
    this._maxMemoizedMatchesSize = 128;
    this._memoizedMatches = new Map();

    // QX: 直接读取缓存
    const raw = (typeof $prefs !== 'undefined') ? $prefs.valueForKey(this._cacheKey) : null;
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data && data.data) {
          this._manifest = data;
          this._lazyConfigs = data.data || {};
        }
      } catch (e) {}
    }
  }

  async load() {
    if (this._manifest) return this._manifest;

    const url = `${CONFIG.REMOTE_BASE}/manifest.json?t=${Date.now()}`;
    const res = await HTTP.get(url);
    if (res.statusCode !== 200 || !res.body) {
      throw new Error(`HTTP ${res.statusCode}`);
    }

    const body = String(res.body);
    const firstChar = body.trimStart()[0];
    if (firstChar !== '{' && firstChar !== '[') {
      throw new Error('Non-JSON manifest response');
    }

    const fresh = Utils.safeJsonParse(body);
    if (!fresh || typeof fresh !== 'object') {
      throw new Error('Invalid manifest JSON');
    }

    this._manifest = fresh;
    this._lazyConfigs = fresh.data || {};
    if (typeof $prefs !== 'undefined') {
      $prefs.setValueForKey(JSON.stringify(fresh), this._cacheKey);
    }
    return fresh;
  }

  getManifest() {
    return this._manifest;
  }

  findByUrl(url) {
    if (!url) return null;

    const cacheKey = url;
    const memo = this._memoizedMatches.get(cacheKey);
    if (memo !== undefined) return memo;

    const data = this._lazyConfigs || {};
    const candidates = Object.keys(data);

    for (const id of candidates) {
      let regex = this._regexCache.get(id);

      if (!regex && data[id]) {
        const patternStr = data[id].urlPattern;
        if (!patternStr) continue;

        try {
          regex = new RegExp(patternStr);
          this._regexCache.set(id, regex);
        } catch (e) {
          continue;
        }
      }

      if (regex && regex.test(url)) {
        this._memoizedMatches.set(cacheKey, id);
        if (this._memoizedMatches.size > this._maxMemoizedMatchesSize) {
          const firstKey = this._memoizedMatches.keys().next().value;
          this._memoizedMatches.delete(firstKey);
        }
        return id;
      }
    }

    this._memoizedMatches.set(cacheKey, null);
    if (this._memoizedMatches.size > this._maxMemoizedMatchesSize) {
      const firstKey = this._memoizedMatches.keys().next().value;
      this._memoizedMatches.delete(firstKey);
    }
    return null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleManifestLoader };
}
