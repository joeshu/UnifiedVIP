/*
 * ==========================================
 * Unified VIP Unlock Manager v22.0.0
 * 构建时间: 2026-03-30T11:43:34.313Z
 * APP数量: 21
 * ==========================================
 *
 * 订阅规则: https://joeshu.github.io/UnifiedVIP/rewrite.conf
 * 诊断功能: 在 QX 控制台运行 diagnose() 查看详细匹配信息
 */

'use strict';

// ==========================================
// 0. 环境修复 & 配置
// ==========================================
if (typeof console === 'undefined') { globalThis.console = { log: () => {} }; }

const CONFIG = {
  REMOTE_BASE: 'https://joeshu.github.io/UnifiedVIP',
  CONFIG_CACHE_TTL: 24 * 60 * 60 * 1000,
  MAX_BODY_SIZE: 5 * 1024 * 1024,
  MAX_PROCESSORS_PER_REQUEST: 30,
  TIMEOUT: 10,
  DEBUG: true,
  VERBOSE_PATTERN_LOG: true,

  URL_CACHE_KEY: 'url_match_v22_lazy',
  URL_CACHE_META_KEY: 'url_match_v22_lazy_meta',
  URL_CACHE_MIGRATED_KEY: 'url_match_v22_lazy_migrated',
  URL_CACHE_LEGACY_KEYS: ['url_match_v22', 'url_match_v21_lazy', 'url_match_cache_v22'],
  URL_CACHE_TTL_MS: 60 * 60 * 1000,
  URL_CACHE_PERSIST_INTERVAL_MS: 15 * 1000,
  URL_CACHE_LIMIT: 50
};

const META = { name: 'UnifiedVIP', version: '22.0.0' };

// ==========================================
// 1. 内置Manifest (P2压缩)
// ==========================================
const BUILTIN_MANIFEST = {"version":"22.0.0-118ca2cb","updated":"2026-03-30","total":21,"configs":{"bqwz":{"name":"标枪王者","urlPattern":"^https?:\\/\\/javelin\\.mandrillvr\\.com\\/api\\/data\\/get_game_data"},"bxkt":{"name":"伴学课堂","urlPattern":"^https?:\\/\\/api\\.banxueketang\\.com\\/api\\/classpal\\/app\\/v1"},"cyljy":{"name":"成语来解压","urlPattern":"^https?:\\/\\/yr-game-api\\.feigo\\.fun\\/api\\/user\\/get-game-user-value"},"foday":{"name":"复游会","urlPattern":"^https?:\\/\\/apis\\.folidaymall\\.com\\/online\\/capi\\/component\\/getPageComponents"},"gps":{"name":"GPS工具箱","urlPattern":"^https:\\/\\/service\\.gpstool\\.com\\/app\\/index\\/getUserInfo"},"iappdaily":{"name":"iAppDaily","urlPattern":"^https:\\/\\/api\\.iappdaily\\.com\\/my\\/balance"},"kada":{"name":"KaDa 阅读 VIP Unlock","urlPattern":"^https://service\\.hhdd\\.com/book2"},"keep":{"name":"Keep","urlPattern":"^https?:\\/\\/(?:api|kit)\\.gotokeep\\.com\\/(?:nuocha|gerudo|athena|nuocha\\/plans|suit\\/v5\\/smart|kprime\\/v4\\/suit\\/sales)\\/"},"kyxq":{"name":"口语星球","urlPattern":"^https?:\\/\\/mapi\\.kouyuxingqiu\\.com\\/api\\/v2"},"mhlz":{"name":"魔幻粒子","urlPattern":"^https?:\\/\\/ss\\.landintheair\\.com\\/storage\\/"},"mingcalc":{"name":"明计算","urlPattern":"^https?://jsq\\.mingcalc\\.cn/XMGetMeCount\\.ashx"},"qiujingapp":{"name":"球竞APP","urlPattern":"^https?:\\/\\/gateway-api\\.yizhilive\\.com\\/api\\/(?:v2\\/index\\/carouses\\/(?:3|6|8|11)|v3\\/index\\/all)"},"qmjyzc":{"name":"全民解压找茬","urlPattern":"^https?://res5\\.haotgame\\.com/cu03/static/OpenDoors/Res/data/levels/\\d+\\.json"},"sylangyue":{"name":"思朗月影视","urlPattern":"^https?:\\/\\/theater-api\\.sylangyue\\.xyz\\/api\\/user\\/info"},"tophub":{"name":"TopHub","urlPattern":"^https:\\/\\/(?:api[23]\\.tophub\\.(?:xyz|today|app)|tophub(?:2)?\\.(?:tophubdata\\.com|idaily\\.today|remai\\.today|iappdaiy\\.com|ipadown\\.com))\\/account\\/sync"},"tv":{"name":"影视去广告","urlPattern":"^https?:\\/\\/(?:yzy0916|yz1018|yz250907|yz0320|cfvip)\\..+\\.com\\/(?:v2|v1)\\/api\\/(?:basic\\/init|home\\/firstScreen|adInfo\\/getPageAd|home\\/body)"},"v2ex":{"name":"V2EX去广告","urlPattern":"^https?:\\/\\/.*v2ex\\.com\\/(?!(?:.*(?:api|login|cdn-cgi|verify|auth|captch|\\.(js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf)))).*$"},"vvebo":{"name":"Vvebo Subscription Forward","urlPattern":"^https:\\/\\/fluxapi\\.vvebo\\.vip\\/v1\\/purchase\\/iap\\/subscription"},"wohome":{"name":"联通智家","urlPattern":"^https:\\/\\/iotpservice\\.smartont\\.net\\/wohome\\/dispatcher"},"xjsm":{"name":"星际使命","urlPattern":"^https?:\\/\\/star\\.jvplay\\.cn\\/v2\\/storage"},"zhenti":{"name":"真题伴侣","urlPattern":"^https?://newtest\\.zoooy111\\.com/mobilev4\\.php/User/index"}}};

// ==========================================
// 2. 前缀索引 (构建时生成)
// ==========================================
const PREFIX_INDEX = {
 exact: {
  'javelin.mandrillvr.com': ["bqwz"],
  'api.banxueketang.com': ["bxkt"],
  'yr-game-api.feigo.fun': ["cyljy"],
  'apis.folidaymall.com': ["foday"],
  'service.gpstool.com': ["gps"],
  'api.iappdaily.com': ["iappdaily"],
  'service.hhdd.com': ["kada"],
  'mapi.kouyuxingqiu.com': ["kyxq"],
  'ss.landintheair.com': ["mhlz"],
  'jsq.mingcalc.cn': ["mingcalc"],
  'gateway-api.yizhilive.com': ["qiujingapp"],
  'res5.haotgame.com': ["qmjyzc"],
  'theater-api.sylangyue.xyz': ["sylangyue"],
  'fluxapi.vvebo.vip': ["vvebo"],
  'iotpservice.smartont.net': ["wohome"],
  'star.jvplay.cn': ["xjsm"],
  'newtest.zoooy111.com': ["zhenti"]
 },
 suffix: {
  'mandrillvr.com': ["bqwz"],
  'banxueketang.com': ["bxkt"],
  'feigo.fun': ["cyljy"],
  'folidaymall.com': ["foday"],
  'gpstool.com': ["gps"],
  'iappdaily.com': ["iappdaily"],
  'hhdd.com': ["kada"],
  'gotokeep.com': ["keep"],
  'kouyuxingqiu.com': ["kyxq"],
  'landintheair.com': ["mhlz"],
  'mingcalc.cn': ["mingcalc"],
  'xmgetmecount.ashx': ["mingcalc"],
  'yizhilive.com': ["qiujingapp"],
  'haotgame.com': ["qmjyzc"],
  'sylangyue.xyz': ["sylangyue"],
  'tophubdata.com': ["tophub"],
  'idaily.today': ["tophub"],
  'remai.today': ["tophub"],
  'iappdaiy.com': ["tophub"],
  'ipadown.com': ["tophub"],
  'v2ex.com': ["v2ex"],
  'vvebo.vip': ["vvebo"],
  'smartont.net': ["wohome"],
  'jvplay.cn': ["xjsm"],
  'zoooy111.com': ["zhenti"]
 },
 keyword: {
  'yz': ["tv"],
  'yzy': ["tv"],
  'yz1018': ["tv"],
  'yz250907': ["tv"],
  'yz0320': ["tv"],
  'cfvip': ["tv"],
  'cf': ["tv"],
  'keep': ["keep"],
  'gotokeep': ["keep"],
  'nuocha': ["keep"],
  'gerudo': ["keep"],
  'athena': ["keep"],
  'tophub': ["tophub"],
  'tophubdata': ["tophub"],
  'idaily': ["tophub"],
  'remai': ["tophub"],
  'v2ex': ["v2ex"],
  'vvebo': ["vvebo"],
  'fluxapi': ["vvebo"],
  'slzd': ["slzd"],
  'lifeweek': ["slzd"],
  'kyxq': ["kyxq"],
  'kouyuxingqiu': ["kyxq"],
  'mhlz': ["mhlz"],
  'xjsm': ["xjsm"],
  'jvplay': ["xjsm"],
  'bqwz': ["bqwz"],
  'mandrillvr': ["bqwz"],
  'javelin': ["bqwz"],
  'qmj': ["qmjyzc"],
  'qmjyzc': ["qmjyzc"],
  'haotgame': ["qmjyzc"],
  'bxkt': ["bxkt"],
  'banxueketang': ["bxkt"],
  'cyljy': ["cyljy"],
  'feigo': ["cyljy"],
  'wohome': ["wohome"],
  'smartont': ["wohome"],
  'iotpservice': ["wohome"],
  'kada': ["kada"],
  'hhdd': ["kada"],
  'ipalfish': ["ipalfish"],
  'picturebook': ["ipalfish"],
  'gps': ["gps"],
  'gpstool': ["gps"],
  'iapp': ["iappdaily"],
  'iappdaily': ["iappdaily"],
  'sylangyue': ["sylangyue"],
  'theater-api': ["sylangyue"],
  'mingcalc': ["mingcalc"],
  'jsq': ["mingcalc"],
  'qiujing': ["qiujingapp"],
  'qiujingapp': ["qiujingapp"],
  'yizhilive': ["qiujingapp"],
  'foday': ["foday"],
  'folidaymall': ["foday"],
  'zhenti': ["zhenti"]
 }
};
function findByPrefix(hostname){const h=hostname.toLowerCase();if(PREFIX_INDEX.exact[h])return{ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};for(const[suffix,ids]of Object.entries(PREFIX_INDEX.suffix))if(h.endsWith('.'+suffix)||h===suffix)return{ids,method:'suffix',matched:suffix};if(PREFIX_INDEX.keyword)for(const[kw,ids]of Object.entries(PREFIX_INDEX.keyword))if(h.includes(kw))return{ids,method:'keyword',matched:kw};return null}

// ==========================================
// 3. 平台检测
// ==========================================
// src/core/platform.js
// 平台检测

const Platform = {
  isQX: typeof $task !== 'undefined',
  isLoon: typeof $loon !== 'undefined',
  isSurge: typeof $httpClient !== 'undefined' && typeof $loon === 'undefined',
  isStash: typeof $stash !== 'undefined',

  getName() {
    if (this.isQX) return 'QX';
    if (this.isLoon) return 'Loon';
    if (this.isSurge) return 'Surge';
    if (this.isStash) return 'Stash';
    return 'Unknown';
  }
};

// ==========================================
// 4. 日志系统
// ==========================================
// src/core/logger.js
// 日志系统 - 仅基于 CONFIG.DEBUG + 采样

const Logger = (() => {
  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const metaName = typeof META !== 'undefined' ? META.name : 'UnifiedVIP';

  const normalizeTagSet = () => {
    const tags = (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.LOG_ALWAYS_TAGS))
      ? CONFIG.LOG_ALWAYS_TAGS
      : [];
    return new Set(tags.map(t => String(t)));
  };

  const alwaysTags = normalizeTagSet();

  const getSampleRate = () => {
    const v = typeof CONFIG !== 'undefined' ? Number(CONFIG.LOG_SAMPLE_RATE) : NaN;
    if (!Number.isFinite(v)) return 1;
    if (v <= 0) return 0;
    if (v >= 1) return 1;
    return v;
  };

  const isDebugEnabled = () => {
    return typeof CONFIG !== 'undefined' && CONFIG.DEBUG === true;
  };

  const canLogBySampling = (tag, level) => {
    if (level === 'ERROR') return true;
    if (level === 'WARN') return true;
    if (alwaysTags.has(String(tag))) return true;

    const rate = getSampleRate();
    if (rate >= 1) return true;
    if (rate <= 0) return false;
    return Math.random() < rate;
  };

  const print = (level, tag, msg) => {
    if (!canLogBySampling(tag, level)) return;
    console.log(`[${metaName}][${now()}][${level}][${tag}] ${msg}`);
  };

  return {
    info: (tag, msg) => {
      if (!isDebugEnabled()) return;
      print('INFO', tag, msg);
    },
    error: (tag, msg) => print('ERROR', tag, msg),
    debug: (tag, msg) => {
      if (!isDebugEnabled()) return;
      const verbose = typeof CONFIG !== 'undefined' && CONFIG.VERBOSE_PATTERN_LOG;
      if (!verbose) return;
      print('DEBUG', tag, msg);
    },
    warn: (tag, msg) => {
      if (!isDebugEnabled()) return;
      print('WARN', tag, msg);
    }
  };
})();

// ==========================================
// 5. M3存储系统
// ==========================================
// src/core/storage.js
// M3单键存储系统 - 与 vip-unlock-configs 兼容版本

const Storage = (() => {
  const KEY = 'vip_v22_data';

  const qx = {
    read: (k) => $prefs.valueForKey(k),
    write: (k, v) => $prefs.setValueForKey(v, k),
    remove: (k) => $prefs.removeValueForKey(k)
  };

  return {
    readConfig: (configId) => {
      const raw = qx.read(KEY);
      if (!raw) return null;
      try {
        const all = JSON.parse(raw);
        const item = all[configId];
        const ttl = typeof CONFIG !== 'undefined' ? CONFIG.CONFIG_CACHE_TTL : 24 * 60 * 60 * 1000;
        if (item && (Date.now() - item.t) < ttl) {
          // 修复：返回 JSON 字符串，与 vip-unlock-configs 兼容
          return JSON.stringify(item);
        }
      } catch (e) {}
      return null;
    },

    writeConfig: (configId, value) => {
      let all = {};
      const raw = qx.read(KEY);
      if (raw) {
        try { all = JSON.parse(raw); } catch (e) {}
      }

      // 兼容处理：value 可能是对象或 JSON 字符串
      let parsed;
      try {
        parsed = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        parsed = value;
      }

      // 确保存储结构包含 v, t, d
      all[configId] = {
        v: parsed.v || '1.0',
        t: Date.now(),
        d: parsed.d || parsed
      };

      let str = JSON.stringify(all);
      const maxSize = typeof Platform !== 'undefined' && Platform.isQX ? 500000 : Infinity;

      // M3: 超限保护，保留最近3个
      if (str.length > maxSize) {
        const sorted = Object.entries(all)
          .sort((a, b) => (b[1].t || 0) - (a[1].t || 0))
          .slice(0, 3);
        all = Object.fromEntries(sorted);
        str = JSON.stringify(all);
        Logger.info('Storage', 'QX存储超限，保留最近3个配置');
      }

      qx.write(KEY, str);
    },

    read: (key) => qx.read(key),
    write: (key, value) => qx.write(key, value),
    remove: (key) => qx.remove(key)
  };
})();

// ==========================================
// 6. HTTP客户端
// ==========================================
// src/core/http.js
// HTTP 客户端 - 增强版 (与 vip-unlock-configs 一致)

const HTTP = (() => {
  function normalizeTimeoutMs(value, fallback = 10000) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return n;
  }

  function toQxSeconds(ms) {
    return Math.max(1, Math.ceil(ms / 1000));
  }

  return {
    get: (url, timeout = 10000) => new Promise((resolve, reject) => {
      const safeTimeout = normalizeTimeoutMs(timeout, 10000);
      const timer = setTimeout(() => reject(new Error('Timeout')), safeTimeout);

      const callback = (error, response, body) => {
        clearTimeout(timer);
        if (error) {
          reject(new Error(String(error)));
        } else {
          resolve({
            body: body || '',
            statusCode: typeof response === 'object' ? (response.statusCode || response.status || 200) : 200,
            headers: typeof response === 'object' ? (response.headers || {}) : {}
          });
        }
      };

      try {
        if (typeof Platform !== 'undefined' && Platform.isQX) {
          $task.fetch({
            url,
            method: 'GET',
            timeout: toQxSeconds(safeTimeout)
          }).then(
            res => callback(null, { statusCode: res.statusCode, headers: res.headers }, res.body),
            err => callback(err, null, null)
          );
        } else if (typeof $httpClient !== 'undefined') {
          $httpClient.get({ url, timeout: safeTimeout / 1000 }, callback);
        } else {
          clearTimeout(timer);
          reject(new Error('No HTTP client'));
        }
      } catch (e) {
        clearTimeout(timer);
        reject(e);
      }
    }),

    post: (options, timeout = 10000) => new Promise((resolve, reject) => {
      const effectiveTimeout = normalizeTimeoutMs(
        options && options.timeout,
        normalizeTimeoutMs(timeout, 10000)
      );

      const timer = setTimeout(() => reject(new Error('Timeout')), effectiveTimeout);

      const callback = (error, response, body) => {
        clearTimeout(timer);
        if (error) {
          reject(new Error(String(error)));
        } else {
          resolve({
            body: body || '',
            statusCode: typeof response === 'object' ? (response.statusCode || response.status || 200) : 200,
            headers: typeof response === 'object' ? (response.headers || {}) : {}
          });
        }
      };

      try {
        if (typeof Platform !== 'undefined' && Platform.isQX) {
          $task.fetch({
            url: options.url,
            method: 'POST',
            headers: options.headers || {},
            body: options.body || '',
            timeout: toQxSeconds(effectiveTimeout)
          }).then(
            res => callback(null, { statusCode: res.statusCode, headers: res.headers }, res.body),
            err => callback(err, null, null)
          );
        } else if (typeof $httpClient !== 'undefined') {
          $httpClient.post({
            url: options.url,
            headers: options.headers || {},
            body: options.body || '',
            timeout: effectiveTimeout / 1000
          }, callback);
        } else {
          clearTimeout(timer);
          reject(new Error('No HTTP client'));
        }
      } catch (e) {
        clearTimeout(timer);
        reject(e);
      }
    })
  };
})();

// ==========================================
// 7. 工具函数
// ==========================================
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

// ==========================================
// 8. 正则缓存池
// ==========================================
const RegexPool = (() => {
  const cache = new Map();
  const MAX_SIZE = 50;

  return {
    get: (pattern, flags = '') => {
      const key = `${pattern}|||${flags}`;
      if (cache.has(key)) return cache.get(key);

      try {
        const regex = new RegExp(pattern, flags);
        if (cache.size >= MAX_SIZE) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.set(key, regex);
        return regex;
      } catch (e) {
        return /(?!)/;
      }
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RegexPool };
}

// ==========================================
// 9. 处理器工厂
// ==========================================
// src/engine/processor-factory.js
// 处理器工厂 - 创建各类处理器

function createProcessorFactory(requestId) {
  return {
    setFields: (params) => (obj, env) => {
      const fields = params.fields || {};
      for (const path in fields) {
        let value = fields[path];
        if (typeof value === 'string' && value.includes('{{')) {
          value = Utils.resolveTemplate(value, obj);
        }
        Utils.setPath(obj, path, value);
      }
      return obj;
    },

    mapArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (!Array.isArray(arr)) return obj;
      const fields = params.fields || {};
      for (const item of arr) {
        if (!item) continue;
        for (const path in fields) {
          let value = fields[path];
          if (typeof value === 'string' && value.includes('{{')) {
            value = Utils.resolveTemplate(value, item);
          }
          Utils.setPath(item, path, value);
        }
      }
      return obj;
    },

    filterArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (!Array.isArray(arr)) return obj;
      const excludeSet = new Set(params.excludeKeys || []);
      Utils.setPath(obj, params.path, arr.filter(item => !excludeSet.has(item && item[params.keyField])));
      return obj;
    },

    clearArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr)) arr.length = 0;
      return obj;
    },

    deleteFields: (params) => (obj, env) => {
      for (const path of params.paths || []) {
        if (!path || typeof path !== 'string') continue;

        const parts = path.split('.');
        if (parts.length === 0) continue;

        const parentPath = parts.slice(0, -1).join('.');
        const last = parts[parts.length - 1];
        const parent = parentPath ? Utils.getPath(obj, parentPath) : obj;

        if (!parent || typeof parent !== 'object') continue;

        const lastMatch = last.match(/^([^\[\]]+)\[(\d+)\]$/);
        if (lastMatch) {
          const arrName = lastMatch[1];
          const idx = parseInt(lastMatch[2], 10);
          if (Array.isArray(parent[arrName]) && idx >= 0 && idx < parent[arrName].length) {
            parent[arrName].splice(idx, 1);
          }
        } else if (Array.isArray(parent)) {
          for (const item of parent) {
            if (item && typeof item === 'object') {
              delete item[last];
            }
          }
        } else {
          delete parent[last];
        }
      }
      return obj;
    },

    sliceArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr) && arr.length > params.keepCount) {
        Utils.setPath(obj, params.path, arr.slice(0, params.keepCount));
      }
      return obj;
    },

    shiftArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr) && arr.length > 0) arr.shift();
      return obj;
    },

    processByKeyPrefix: (params) => (obj, env) => {
      const target = Utils.getPath(obj, params.objPath);
      if (!target || typeof target !== 'object') return obj;
      const rules = Object.entries(params.prefixRules || {});
      for (const key in target) {
        const value = target[key];
        if (!value || typeof value !== 'object') continue;
        for (const [prefix, handler] of rules) {
          if (prefix !== '*' && key.startsWith(prefix)) {
            Object.assign(value, handler);
            break;
          }
          if (prefix === '*') {
            Object.assign(value, handler);
            break;
          }
        }
      }
      return obj;
    },

    notify: (params) => (obj, env) => {
      const title = params.title || 'UnifiedVIP';
      let subtitle = params.subtitle || '';
      let message = params.message || '';

      if (params.subtitleField) {
        subtitle = Utils.getPath(obj, params.subtitleField) || subtitle;
      }

      // template 优先
      if (params.template) {
        message = params.template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return Utils.getPath(obj, key) || match;
        });
      } else if (params.messageField) {
        // 使用 formatObject 处理对象
        const fieldData = Utils.getPath(obj, params.messageField);
        if (fieldData) {
          if (typeof fieldData === 'object') {
            message = Utils.formatObject(fieldData, params.separator || '\n');
          } else {
            message = String(fieldData);
          }
        }
      }

      if (params.prefix) {
        message = params.prefix + message;
      }

      const maxLen = params.maxLength || 500;
      if (message.length > maxLen) {
        message = message.substring(0, maxLen) + '...';
      }

      // 平台适配通知
      if (typeof Platform !== 'undefined') {
        if (Platform.isQX && typeof $notify !== 'undefined') {
          $notify(title, subtitle, message, params.options || {});
        } else if (Platform.isLoon && typeof $notification !== 'undefined') {
          const url = params.options && params.options['open-url'];
          if (url) {
            $notification.post(title, subtitle, message, url);
          } else {
            $notification.post(title, subtitle, message);
          }
        } else if ((Platform.isSurge || Platform.isStash) && typeof $notification !== 'undefined') {
          $notification.post(title, subtitle, message, params.options || {});
        }
      }

      if (params.markField) {
        Utils.setPath(obj, params.markField, true);
      }

      return obj;
    },

    compose: (params, compile) => {
      const steps = params.steps || [];
      const maxSteps = typeof CONFIG !== 'undefined' ? CONFIG.MAX_PROCESSORS_PER_REQUEST : 30;
      if (steps.length > maxSteps) {
        throw new Error(`Too many processors: ${steps.length}`);
      }
      const processors = steps.map(step => compile(step));

      return (obj, env) => {
        let result = obj;
        for (const processor of processors) {
          if (!result) break;
          result = processor(result, env);
        }
        return result;
      };
    },

    when: (params, compile) => {
      const conditionFn = (obj, env) => {
        const url = env && env.getUrl ? env.getUrl() : '';
        switch (params.condition) {
          case "empty":
            const data = Utils.getPath(obj, params.check || 'data');
            return !data || Object.keys(data).length === 0;
          case "pathMatch":
            return params.path && url.includes(params.path);
          case "queryMatch":
            const match = url.match(RegexPool.get(`[?&]${params.param}=([^&]+)`));
            return match && decodeURIComponent(match[1]) === params.value;
          case "includes":
            const checkData = Utils.getPath(obj, params.check || 'data');
            return Array.isArray(checkData) ? checkData.includes(params.value) : String(checkData).includes(params.value);
          case "isObject":
            return typeof obj.data === 'object' && !Array.isArray(obj.data);
          case "isArray":
            return Array.isArray(obj.data);
          default:
            return false;
        }
      };

      const thenProcessor = params.then ? compile(params.then) : null;
      const elseProcessor = params.else ? compile(params.else) : null;

      return (obj, env) => {
        const conditionMet = conditionFn(obj, env);
        if (conditionMet && thenProcessor) {
          return thenProcessor(obj, env);
        } else if (!conditionMet && elseProcessor) {
          return elseProcessor(obj, env);
        }
        return obj;
      };
    },

    sceneDispatcher: (params, compile) => {
      const scenes = (params.scenes || []).map(s => ({
        matchFn: (obj, env) => {
          const url = env && env.getUrl ? env.getUrl() : '';
          switch (s.when) {
            case "pathMatch": return s.path && url.includes(s.path);
            case "queryMatch":
              const m = url.match(RegexPool.get(`[?&]${s.param}=([^&]+)`));
              return m && decodeURIComponent(m[1]) === s.value;
            case "includes":
              const d = Utils.getPath(obj, s.check || 'data');
              return Array.isArray(d) ? d.includes(s.value) : String(d).includes(s.value);
            case "empty":
              const ed = Utils.getPath(obj, s.check || 'data');
              return !ed || Object.keys(ed).length === 0;
            case "isObject": return typeof obj.data === 'object' && !Array.isArray(obj.data);
            case "isArray": return Array.isArray(obj.data);
            default: return false;
          }
        },
        then: compile(s.then)
      }));

      return (obj, env) => {
        for (const scene of scenes) {
          if (scene.matchFn(obj, env)) {
            return scene.then(obj, env);
          }
        }
        return obj;
      };
    }
  };
}

// ==========================================
// 10. 处理器编译器
// ==========================================
function createCompiler(factory) {
  const cache = new Map();

  return function compileProcessor(def) {
    if (!def || !def.processor) return null;

    const cacheKey = Utils.simpleHash(Utils.safeJsonStringify(def));
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const processorFactory = factory[def.processor];
    if (!processorFactory) return null;

    const processor = processorFactory(def.params, compileProcessor);
    if (processor) cache.set(cacheKey, processor);
    return processor;
  };
}

// ==========================================
// 11. Manifest加载器
// ==========================================
class SimpleManifestLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._urlCache = typeof Platform !== 'undefined' && Platform.isQX ? {} : null;
    this._memoizedMatches = new Map(); // QX轻量化：缓存本轮匹配结果
    this._maxMemoizedMatchesSize = 300;

    const runtimeCfg = (typeof CONFIG !== 'undefined' && CONFIG) ? CONFIG : {};

    this._urlCacheKey = runtimeCfg.URL_CACHE_KEY || 'url_match_v22_lazy';
    this._urlMetaKey = runtimeCfg.URL_CACHE_META_KEY || `${this._urlCacheKey}_meta`;
    this._urlCacheMigratedKey = runtimeCfg.URL_CACHE_MIGRATED_KEY || `${this._urlCacheKey}_migrated`;

    const legacyKeys = Array.isArray(runtimeCfg.URL_CACHE_LEGACY_KEYS)
      ? runtimeCfg.URL_CACHE_LEGACY_KEYS
      : ['url_match_v22', 'url_match_v21_lazy', 'url_match_cache_v22'];

    this._legacyUrlCacheKeys = [this._urlCacheKey, ...legacyKeys]
      .filter((k, i, arr) => typeof k === 'string' && k && arr.indexOf(k) === i);
    this._legacyMetaKeys = [this._urlMetaKey, ...this._legacyUrlCacheKeys.map(k => `${k}_meta`)]
      .filter((k, i, arr) => typeof k === 'string' && k && arr.indexOf(k) === i);

    this._cacheTtlMs = this._readPositiveNumber(runtimeCfg.URL_CACHE_TTL_MS, 3600000);
    this._persistIntervalMs = this._readPositiveNumber(runtimeCfg.URL_CACHE_PERSIST_INTERVAL_MS, 15000);
    this._persistLimit = Math.max(10, Math.min(200, Math.floor(this._readPositiveNumber(runtimeCfg.URL_CACHE_LIMIT, 50))));

    this._statsEnabled = runtimeCfg.ENABLE_MATCH_STATS === true;
    this._statsKey = runtimeCfg.MATCH_STATS_KEY || 'uvip_match_stats_v1';
    this._statsMetaKey = runtimeCfg.MATCH_STATS_META_KEY || `${this._statsKey}_meta`;
    this._statsFlushIntervalMs = this._readPositiveNumber(runtimeCfg.MATCH_STATS_FLUSH_INTERVAL_MS, 60000);
    this._statsFlushEveryN = Math.max(10, Math.floor(this._readPositiveNumber(runtimeCfg.MATCH_STATS_FLUSH_EVERY_N, 20)));
    this._statsMeta = this._statsEnabled ? this._loadStatsMeta() : { lastFlushAt: 0 };
    this._stats = this._statsEnabled ? this._loadStats() : null;
    this._statsPending = 0;

    this._regexCache = new Map();
    this._hostnameCache = new Map();
    this._maxHostnameCacheSize = 200;
    this._prefixIndex = typeof PREFIX_INDEX !== 'undefined' ? PREFIX_INDEX : {};
    this._lazyConfigs = typeof BUILTIN_MANIFEST !== 'undefined' ? BUILTIN_MANIFEST.configs : {};
    this._persistMeta = this._loadPersistMeta();
    this._hostTokenIndex = null;

    if (this._urlCache && typeof $prefs !== 'undefined') {
      const migrated = this._isLegacyMigrated();
      const lookupKeys = migrated ? [this._urlCacheKey] : this._legacyUrlCacheKeys;
      const { raw, keyUsed } = this._readFirstAvailable(lookupKeys);

      if (raw) {
        this._restoreUrlCache(raw);
      }

      if (!migrated) {
        if (raw && keyUsed && keyUsed !== this._urlCacheKey) {
          this._saveUrlCache(true);
        }
        this._cleanupLegacyKeys();
        this._markLegacyMigrated();
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

  _isLegacyMigrated() {
    if (typeof $prefs === 'undefined') return true;
    try {
      return $prefs.valueForKey(this._urlCacheMigratedKey) === '1';
    } catch (e) {
      return false;
    }
  }

  _markLegacyMigrated() {
    if (typeof $prefs === 'undefined') return;
    try {
      $prefs.setValueForKey(this._urlCacheMigratedKey, '1');
    } catch (e) {}
  }

  _cleanupLegacyKeys() {
    if (typeof $prefs === 'undefined') return;

    const keysToDelete = [
      ...this._legacyUrlCacheKeys.filter(k => k !== this._urlCacheKey),
      ...this._legacyMetaKeys.filter(k => k !== this._urlMetaKey)
    ];

    for (const key of keysToDelete) {
      try { $prefs.removeValueForKey(key); } catch (e) {}
    }
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
    if (typeof $prefs === 'undefined') return { lastPersistAt: 0 };

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
    if (typeof $prefs === 'undefined') return { lastFlushAt: 0 };

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
      tokenNarrow: 0,
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
    if (!this._statsEnabled) return;
    if (!this._stats || typeof this._stats !== 'object') return;
    this._stats[key] = (this._stats[key] || 0) + delta;
    this._stats.updatedAt = Date.now();
    this._statsPending += 1;
    this._flushStats(false);
  }

  _flushStats(force = false) {
    if (!this._statsEnabled) return;
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

  _buildHostTokenIndex() {
    const index = {};
    const ignored = new Set(['www', 'api', 'com', 'net', 'org', 'cn', 'co', 'io', 'app', 'vip', 'xyz']);

    for (const [id, cfg] of Object.entries(this._lazyConfigs || {})) {
      const pattern = cfg && cfg.urlPattern;
      if (!pattern || typeof pattern !== 'string') continue;

      const hosts = pattern.match(/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      for (const host of hosts) {
        const tokens = host.toLowerCase().split('.').filter(Boolean);
        for (const tk of tokens) {
          if (tk.length < 3 || ignored.has(tk)) continue;
          if (!index[tk]) index[tk] = new Set();
          index[tk].add(id);
        }
      }
    }

    const compact = {};
    for (const [tk, set] of Object.entries(index)) {
      compact[tk] = Array.from(set);
    }
    return compact;
  }

  _findByHostToken(hostname) {
    if (!this._hostTokenIndex) {
      this._hostTokenIndex = this._buildHostTokenIndex();
    }

    const ignored = new Set(['www', 'api', 'com', 'net', 'org', 'cn', 'co', 'io', 'app', 'vip', 'xyz']);
    const candidates = new Set();
    const tokens = String(hostname || '').toLowerCase().split('.').filter(Boolean);

    for (const tk of tokens) {
      if (tk.length < 3 || ignored.has(tk)) continue;
      const ids = this._hostTokenIndex[tk];
      if (Array.isArray(ids)) {
        ids.forEach(id => candidates.add(id));
      }
    }

    return Array.from(candidates);
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

  _extractHostnameFromCacheKey(cacheKey) {
    if (!cacheKey || typeof cacheKey !== 'string') return '';
    const first = cacheKey.indexOf('|');
    if (first < 0) return '';
    const second = cacheKey.indexOf('|', first + 1);
    if (second < 0) return '';
    return cacheKey.slice(first + 1, second);
  }

  _getHostname(url) {
    let hostname = this._hostnameCache.get(url);
    if (hostname === undefined) {
      try {
        hostname = new URL(url).hostname;
      } catch (e) {
        // 如果URL解析失败，返回空字符串
        hostname = '';
      }
      this._hostnameCache.set(url, hostname);
      
      // 限制缓存大小
      if (this._hostnameCache.size > this._maxHostnameCacheSize) {
        const firstKey = this._hostnameCache.keys().next().value;
        this._hostnameCache.delete(firstKey);
      }
    }
    return hostname;
  }

  _findByPrefix(hostname) {
    if (typeof findByPrefix === 'function') return findByPrefix(hostname);

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
    if (!force && (now - this._persistMeta.lastPersistAt) < this._persistIntervalMs) return;

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
    Logger.debug('ManifestLoader', `Lazy load v${BUILTIN_MANIFEST?.version || '22.0.0'}`);
    return this._createLazyProxy();
  }

  _createLazyProxy() {
    const self = this;

    return {
      findMatch: (url) => {
        const cacheKey = self._buildUrlCacheKey(url);

        // 本次运行内的热路径缓存（避免同URL重复匹配）
        if (self._memoizedMatches.has(cacheKey)) {
          return self._memoizedMatches.get(cacheKey);
        }

        if (self._urlCache) {
          const cached = self._urlCache[cacheKey];
          if (cached && (Date.now() - cached.ts) < self._cacheTtlMs) {
            Logger.debug('ManifestLoader', `Cache hit: ${cached.id}`);
            self._incrementStat('cacheHit');
            self._touchUrlCache(cacheKey, cached.id);
            self._memoizedMatches.set(cacheKey, cached.id);
            if (self._memoizedMatches.size > self._maxMemoizedMatchesSize) {
              const firstKey = self._memoizedMatches.keys().next().value;
              self._memoizedMatches.delete(firstKey);
            }
            return cached.id;
          }
        }
        self._incrementStat('cacheMiss');

        let candidates = [];
        let hostname = self._extractHostnameFromCacheKey(cacheKey);

        try {
          if (!hostname) hostname = self._getHostname(url);
          if (!hostname) throw new Error('Invalid URL');
          const matchInfo = self._findByPrefix(hostname);

          if (matchInfo) {
            candidates = matchInfo.ids;
            self._incrementStat(matchInfo.method);
            Logger.debug('ManifestLoader', `Prefix ${matchInfo.method}: ${matchInfo.matched}`);
          } else {
            self._incrementStat('missPrefix');
            const tokenCandidates = self._findByHostToken(hostname);
            if (tokenCandidates.length > 0) {
              candidates = tokenCandidates;
              self._incrementStat('tokenNarrow');
              Logger.debug('ManifestLoader', `Token narrow: ${hostname} -> ${tokenCandidates.length}`);
            } else {
              Logger.debug('ManifestLoader', 'MISS_PREFIX: no prefix/token match');
            }
          }
        } catch (e) {
          self._incrementStat('urlParseFail');
          Logger.debug('ManifestLoader', 'URL_PARSE_FAIL: parse url failed');
        }

        if (candidates.length === 0) {
          self._incrementStat('fallback');
          candidates = Object.keys(self._lazyConfigs);
          Logger.debug('ManifestLoader', `Fallback: scanning ${candidates.length} patterns`);
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
              self._incrementStat('invalidPattern');
              Logger.error('ManifestLoader', `INVALID_PATTERN: ${id}`);
              continue;
            }
          }

          if (regex && regex.test(url)) {
            Logger.debug('ManifestLoader', `Matched: ${id} (${self._regexCache.size}/${candidates.length})`);
            if (self._urlCache) self._touchUrlCache(cacheKey, id);
            self._memoizedMatches.set(cacheKey, id);
            if (self._memoizedMatches.size > self._maxMemoizedMatchesSize) {
              const firstKey = self._memoizedMatches.keys().next().value;
              self._memoizedMatches.delete(firstKey);
            }
            return id;
          }
        }

        self._incrementStat('missRegex');
        Logger.warn('ManifestLoader', `MISS_REGEX: No match for ${url.substring(0, 40)}...`);
        self._memoizedMatches.set(cacheKey, null);
        if (self._memoizedMatches.size > self._maxMemoizedMatchesSize) {
          const firstKey = self._memoizedMatches.keys().next().value;
          self._memoizedMatches.delete(firstKey);
        }
        return null;
      },

      getConfigVersion: (configId) => (self._lazyConfigs[configId] ? '1.0' : null),
      getStats: () => ({ ...self._stats }),
      flushStats: () => self._flushStats(true)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleManifestLoader };
}

// ==========================================
// 12. 配置加载器
// ==========================================
// src/engine/config-loader.js
// 配置加载器 - 修复版 (与 vip-unlock-configs 兼容)

class SimpleConfigLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._versionTag = (typeof BUILTIN_MANIFEST !== 'undefined' && BUILTIN_MANIFEST && BUILTIN_MANIFEST.version)
      ? String(BUILTIN_MANIFEST.version)
      : 'v1';

    const g = (typeof globalThis !== 'undefined') ? globalThis : {};
    this._memCache = g.__UVIP_CFG_MEM || (g.__UVIP_CFG_MEM = new Map());
    this._cacheTtl = (typeof CONFIG !== 'undefined' && CONFIG.CONFIG_CACHE_TTL)
      ? CONFIG.CONFIG_CACHE_TTL
      : 24 * 60 * 60 * 1000;

    this._factory = createProcessorFactory(this._requestId);
    this._compiler = createCompiler(this._factory);
  }

  _versionedId(configId) {
    return `${configId}@${this._versionTag}`;
  }

  async load(configId, remoteVersion) {
    const versionedId = this._versionedId(configId);

    // 运行时内存缓存 (同一脚本生命周期内多次命中极速返回)
    const memHit = this._memCache.get(versionedId);
    if (memHit && (Date.now() - memHit.t) < this._cacheTtl) {
      return memHit.d;
    }

    // 检查缓存
    const cached = Storage.readConfig(versionedId);

    if (cached) {
      try {
        // 解析缓存的 JSON 字符串
        const { v, t, d } = JSON.parse(cached);
        if (v === remoteVersion && (Date.now() - t) < this._cacheTtl) {
          Logger.info('ConfigLoader', `${configId} cache hit`);
          // 热缓存路径：直接返回预处理后的对象，避免二次解析
          const prepared = d;
          this._memCache.set(versionedId, { t: Date.now(), d: prepared });
          return prepared;
        }
      } catch (e) {}
    }

    // 远程加载
    const url = `${CONFIG.REMOTE_BASE}/configs/${configId}.json?t=${Date.now()}`;

    Logger.info('ConfigLoader', `${configId} fetching...`);

    try {
      const res = await HTTP.get(url);
      if (res.statusCode !== 200 || !res.body) {
        throw new Error(`HTTP ${res.statusCode}`);
      }

      const body = String(res.body);
      const firstChar = body.trimStart()[0];
      if (firstChar !== '{' && firstChar !== '[') {
        throw new Error('Non-JSON config response');
      }

      const fresh = Utils.safeJsonParse(body);
      if (!fresh || typeof fresh !== 'object') {
        throw new Error('Invalid config JSON');
      }

      // 写入缓存 - 使用兼容格式
      Storage.writeConfig(versionedId, {
        v: remoteVersion,
        t: Date.now(),
        d: fresh
      });

      // 预处理配置
      const prepared = this._prepareConfig(fresh);
      this._memCache.set(versionedId, { t: Date.now(), d: prepared });
      return prepared;

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);

      // 降级使用缓存（即使过期）
      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        const { d } = JSON.parse(cached);
        this._memCache.set(versionedId, { t: Date.now(), d });
        return d; // 热缓存路径
      }
      throw e;
    }
  }

  _prepareConfig(raw) {
    const config = Object.assign({}, raw);

    if (config.mode === 'forward' || config.mode === 'remote') {
      return config;
    }

    // 预编译处理器（减少每次请求的编译开销）
    if (config.processor) {
      try {
        config._processor = this._compiler(config.processor);
        config.processor = null;
      } catch (e) {
        // ignore compile error, fallback at runtime
      }
    }

    // 预编译正则替换规则
    if (raw.regexReplacements) {
      config._regexReplacements = raw.regexReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'g'),
        replacement: r.replacement
      }));
      config.regexReplacements = null;
    }

    // 预编译游戏资源规则
    if (raw.gameResources) {
      config._gameResources = raw.gameResources.map(r => ({
        field: r.field,
        value: r.value,
        pattern: RegexPool.get(`"${r.field}":\\d+`, 'g')
      }));
      config.gameResources = null;
    }

    // 预编译 HTML 替换规则
    if (raw.htmlReplacements) {
      config._htmlReplacements = raw.htmlReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'gi'),
        replacement: r.replacement
      }));
      config.htmlReplacements = null;
    }

    // 预编译 HTML markers（用于短路）
    if (Array.isArray(raw.htmlMarkers)) {
      config._htmlMarkers = raw.htmlMarkers
        .filter(Boolean)
        .map(m => String(m));
      config.htmlMarkers = null;
    }

    return config;
  }
}

// ==========================================
// 13. VIP引擎 (包含 Environment 类)
// ==========================================
// src/engine/vip-engine.js
// VIP引擎 - 增强版 (支持模板替换和 preserveHeaders)

// ==========================================
// Environment 类
// ==========================================
class Environment {
  constructor(name) {
    this.name = name;
    this.isQX = typeof Platform !== 'undefined' ? Platform.isQX : false;
    this.isSurge = typeof Platform !== 'undefined' ? Platform.isSurge : false;
    this.isLoon = typeof Platform !== 'undefined' ? Platform.isLoon : false;
    this.isStash = typeof Platform !== 'undefined' ? Platform.isStash : false;

    this.response = (typeof $response !== 'undefined') ? $response : {};
    this.request = (typeof $request !== 'undefined') ? $request : {};

    if (!this.request.url && this.response && this.response.request) {
      this.request = this.response.request;
    }
  }

  getUrl() {
    let url = (this.response && this.response.url) || (this.request && this.request.url) || '';
    if (this.isQX && typeof $request === 'string') {
      url = $request;
    }
    return url.toString();
  }

  getBody() {
    return (this.response && this.response.body) || '';
  }

  getRequestHeaders() {
    return (this.request && this.request.headers) || {};
  }

  getRequestBody() {
    return (this.request && this.request.body) || '';
  }

  done(result) {
    if (typeof $done === 'function') {
      $done(result);
    } else {
      console.log('[DONE]', result);
    }
  }
}

// ==========================================
// VipEngine 类
// ==========================================
class VipEngine {
  constructor(env, requestId) {
    this.env = env;
    this._requestId = requestId;
  }

  async process(body, config) {
    if (!config || !config.mode) {
      return { body: typeof body === 'string' ? body : Utils.safeJsonStringify(body || {}) };
    }

    // forward/remote 模式不依赖响应 body，必须优先分流，避免空 body 被提前短路
    if (config.mode === 'forward') {
      return await this._processForward(config);
    }
    if (config.mode === 'remote') {
      return await this._processRemote(config);
    }

    const normalizedBody = typeof body === 'string' ? body : Utils.safeJsonStringify(body || {});
    if (!normalizedBody) return { body: '{}' };

    const maxSize = typeof CONFIG !== 'undefined' ? CONFIG.MAX_BODY_SIZE : 5 * 1024 * 1024;
    if (normalizedBody.length > maxSize) {
      return { body: normalizedBody };
    }

    switch (config.mode) {
      case 'json':
        return this._processJson(normalizedBody, config);
      case 'regex':
        return this._processRegex(normalizedBody, config);
      case 'game':
        return this._processGame(normalizedBody, config);
      case 'hybrid':
        return this._processHybrid(normalizedBody, config);
      case 'html':
        return this._processHtml(normalizedBody, config);
      default:
        return { body: normalizedBody };
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _shouldRetryError(error) {
    const msg = String((error && error.message) || '').toLowerCase();
    return msg.includes('timeout') || msg.includes('network') || msg.includes('timed out');
  }

  async _requestWithRetry(requestFn, retryConfig = {}) {
    const retries = Math.max(0, Number(retryConfig.retries || 0));
    const delayMs = Math.max(0, Number(retryConfig.delayMs || 300));

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (e) {
        lastError = e;
        if (attempt >= retries || !this._shouldRetryError(e)) {
          throw e;
        }
        Logger.warn('VipEngine', `Retry ${attempt + 1}/${retries} after error: ${e.message}`);
        await this._delay(delayMs);
      }
    }

    throw lastError || new Error('Unknown request error');
  }

  async _processForward(config) {
    const statusTexts = config.statusTexts || {
      '200': 'OK',
      '201': 'Created',
      '204': 'No Content',
      '400': 'Bad Request',
      '401': 'Unauthorized',
      '403': 'Forbidden',
      '404': 'Not Found',
      '500': 'Internal Server Error',
      '502': 'Bad Gateway',
      '503': 'Service Unavailable'
    };

    // 支持 {{header}} 模板替换
    const requestHeaders = this.env.getRequestHeaders();
    const requestHeadersLower = {};
    for (const [k, v] of Object.entries(requestHeaders || {})) {
      requestHeadersLower[String(k).toLowerCase()] = v;
    }

    const forwardHeaders = {};

    if (config.forwardHeaders && typeof config.forwardHeaders === 'object') {
      for (const [key, value] of Object.entries(config.forwardHeaders)) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
          const headerName = value.slice(2, -2).trim().toLowerCase();
          forwardHeaders[key] = requestHeadersLower[headerName] || requestHeaders[headerName] || '';
        } else {
          forwardHeaders[key] = value;
        }
      }
    }

    const options = {
      url: config.forwardUrl,
      method: config.method || 'POST',
      headers: forwardHeaders,
      body: this.env.getRequestBody(),
      timeout: config.timeout || 10000
    };

    const retryConfig = {
      retries: typeof config.retryTimes === 'number' ? config.retryTimes : 1,
      delayMs: typeof config.retryDelayMs === 'number' ? config.retryDelayMs : 300
    };

    Logger.info('Forward', `Forwarding to ${options.url}`);

    try {
      const response = await this._requestWithRetry(() => HTTP.post(options), retryConfig);
      const statusCode = response.statusCode || 200;
      const statusText = statusTexts[String(statusCode)] || 'Unknown';

      const responseHeaders = {};
      if (config.responseHeaders && typeof config.responseHeaders === 'object') {
        Object.assign(responseHeaders, config.responseHeaders);
      }

      return {
        status: `HTTP/1.1 ${statusCode} ${statusText}`,
        statusCode,
        headers: responseHeaders,
        body: response.body
      };
    } catch (e) {
      Logger.error('Forward', `Failed: ${e.message}`);
      const errorCode = 500;
      const errorText = statusTexts[String(errorCode)] || 'Internal Server Error';
      const errorHeaders = config.responseHeaders ? Object.assign({}, config.responseHeaders) : {};

      return {
        status: `HTTP/1.1 ${errorCode} ${errorText}`,
        statusCode: errorCode,
        headers: errorHeaders,
        body: Utils.safeJsonStringify({
          error: 'Request failed',
          message: e.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  _pickHeaderCaseInsensitive(headers, key) {
    if (!headers || !key) return undefined;
    if (headers[key] !== undefined) return headers[key];

    const target = String(key).toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (String(k).toLowerCase() === target) return v;
    }
    return undefined;
  }

  _applyRemoteHeaderPolicy(config, sourceHeaders = {}, responseHeaders = {}) {
    const policy = (config && config.headerPolicy && typeof config.headerPolicy === 'object')
      ? config.headerPolicy
      : {};

    const whitelist = Array.isArray(policy.whitelist)
      ? policy.whitelist
      : (Array.isArray(config.preserveHeaders) ? config.preserveHeaders : []);

    for (const key of whitelist) {
      const value = this._pickHeaderCaseInsensitive(sourceHeaders, key);
      if (value !== undefined) responseHeaders[key] = value;
    }

    if (policy.passContentType !== false) {
      const remoteContentType = this._pickHeaderCaseInsensitive(sourceHeaders, 'content-type');
      if (remoteContentType && !this._pickHeaderCaseInsensitive(responseHeaders, 'content-type')) {
        responseHeaders['Content-Type'] = remoteContentType;
      }
    }

    if (policy.passCacheHeaders === true) {
      ['cache-control', 'etag', 'last-modified', 'expires'].forEach(k => {
        const value = this._pickHeaderCaseInsensitive(sourceHeaders, k);
        if (value !== undefined && this._pickHeaderCaseInsensitive(responseHeaders, k) === undefined) {
          responseHeaders[k] = value;
        }
      });
    }

    if (config.forceHeaders && typeof config.forceHeaders === 'object') {
      Object.assign(responseHeaders, config.forceHeaders);
    }

    if (!this._pickHeaderCaseInsensitive(responseHeaders, 'content-type')) {
      responseHeaders['Content-Type'] = 'application/json; charset=utf-8';
    }

    return responseHeaders;
  }

  async _processRemote(config) {
    if (!config.remoteUrl) {
      Logger.error('Remote', 'Missing remoteUrl');
      return {};
    }

    try {
      const retryConfig = {
        retries: typeof config.retryTimes === 'number' ? config.retryTimes : 1,
        delayMs: typeof config.retryDelayMs === 'number' ? config.retryDelayMs : 300
      };

      const response = await this._requestWithRetry(
        () => HTTP.get(config.remoteUrl, config.timeout || 10000),
        retryConfig
      );

      if (response.statusCode !== 200 || !response.body) {
        return {};
      }

      if (config.validateJson !== false) {
        try {
          JSON.parse(response.body);
        } catch (e) {
          return {};
        }
      }

      const responseHeaders = this._applyRemoteHeaderPolicy(
        config,
        response.headers || {},
        {}
      );

      Logger.info('Remote', `Success: ${response.body.length} bytes`);
      return { headers: responseHeaders, body: response.body };

    } catch (e) {
      Logger.error('Remote', `Error: ${e.message}`);
      return {};
    }
  }

  _processJson(body, config) {
    if (!body) return { body };

    const firstChar = body[0];
    if (firstChar !== '{' && firstChar !== '[') {
      return { body };
    }

    let obj = Utils.safeJsonParse(body);
    if (!obj) return { body };

    const processor = config._processor || (config.processor ? (() => {
      const factory = createProcessorFactory(this._requestId);
      const compile = createCompiler(factory);
      return compile(config.processor);
    })() : null);

    if (typeof processor === 'function') {
      try {
        obj = processor(obj, this.env);
        Logger.info('VipEngine', `${config.name || 'VIP'} unlocked`);
      } catch (e) {
        Logger.error('VipEngine', `Processor error: ${e.message}`);
      }
    }

    return { body: Utils.safeJsonStringify(obj) };
  }

  _processRegex(body, config) {
    let modified = body;
    const replacements = config._regexReplacements || config.regexReplacements || [];

    for (const rule of replacements) {
      try {
        const regex = rule.pattern instanceof RegExp ? rule.pattern : RegexPool.get(rule.pattern, rule.flags || 'g');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {}
    }

    return { body: modified };
  }

  _processGame(body, config) {
    let modified = body;
    const resources = config._gameResources || config.gameResources || [];

    for (const res of resources) {
      try {
        const regex = res.pattern instanceof RegExp ? res.pattern : RegexPool.get(`"${res.field}":\\d+`, 'g');
        modified = modified.replace(regex, `"${res.field}":${res.value}`);
      } catch (e) {}
    }

    return { body: modified };
  }

  _processHybrid(body, config) {
    let result = this._processJson(body, config);

    if (config._regexReplacements || config.regexReplacements) {
      result = this._processRegex(result.body, config);
    }

    return result;
  }

  _processHtml(body, config) {
    const replacements = config._htmlReplacements || config.htmlReplacements || [];
    if (!replacements.length) return { body };

    let modified = body;

    // 快速短路：规则都无关键字时直接返回，减少 replace 循环
    const markers = config._htmlMarkers || config.htmlMarkers || null;
    if (Array.isArray(markers) && markers.length > 0) {
      const hit = markers.some(m => m && modified.indexOf(m) >= 0);
      if (!hit) return { body: modified };
    }

    for (const rule of replacements) {
      try {
        const regex = rule.pattern instanceof RegExp ? rule.pattern : RegexPool.get(rule.pattern, rule.flags || 'gi');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {}
    }

    return { body: modified };
  }
}

// ==========================================
// 14. 诊断函数
// ==========================================

// ==========================================
// 诊断函数 - 在 QX 控制台运行 diagnose()
// ==========================================
function diagnose(urlToTest){const testUrls=urlToTest?[urlToTest]:["https://yz1018.6vh3qyu9x.com/v2/api/basic/init","https://www.v2ex.com/t/1201518","https://api.gotokeep.com/nuocha/plans"];console.log("\nUnifiedVIP 诊断工具 v22.0.0");for(const url of testUrls){try{const hostname=new URL(url).hostname;console.log("URL:",url,"HOST:",hostname);const result=typeof findByPrefix==='function'?findByPrefix(hostname):null;console.log("prefix:",result||'null')}catch(e){console.log("error:",e.message)}}return {success:true}}

// ==========================================
// 15. 主入口
// ==========================================
async function main(){
  const rid=Math.random().toString(36).substr(2,6).toUpperCase();
  try{
    let u='';
    if(typeof $request!=='undefined')u=typeof $request==='string'?$request:$request.url||'';
    else if(typeof $response!=='undefined'&&$response)u=$response.url||'';
    if(!u)return $done(typeof $response!=='undefined'&&$response?{body:$response.body}:{});

    Logger.debug('Main',rid+'|'+u.split('?')[0].substring(0,60));

    const g = (typeof globalThis !== 'undefined') ? globalThis : {};
    const ml = g.__UVIP_ML || (g.__UVIP_ML = new SimpleManifestLoader('GLOBAL'));
    const mf = g.__UVIP_MF || (g.__UVIP_MF = await ml.load());
    const cid = mf.findMatch(u);

    if(!cid){
      Logger.debug('Main','No match');
      return $done(typeof $response!=='undefined'&&$response?{body:$response.body}:{})
    }

    const cl = g.__UVIP_CL || (g.__UVIP_CL = new SimpleConfigLoader('GLOBAL'));
    const cfg = await cl.load(cid,mf.getConfigVersion(cid));
    const env=new Environment(META.name);
    const eng=new VipEngine(env,rid);
    const res=await eng.process(typeof $response!=='undefined'&&$response?$response.body:'',cfg);

    Logger.debug('Main',rid+' done ['+cfg.mode+']');
    $done(res)
  }catch(e){
    Logger.error('Main',rid+' fail:'+e.message);
    $done(typeof $response!=='undefined'&&$response?{body:$response.body}:{})
  }
}
main();
