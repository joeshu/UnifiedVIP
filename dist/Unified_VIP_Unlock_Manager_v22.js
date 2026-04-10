/*
 * ==========================================
 * Unified VIP Unlock Manager v22.0.0
 * 构建时间: 2026-04-10T15:06:15.335Z
 * APP数量: 25
 * ==========================================
 *
 * 订阅规则: https://joeshu.github.io/UnifiedVIP/rewrite.conf

 */

'use strict';

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

const BUILTIN_MANIFEST = {"version":"22.0.0-10df293b","updated":"2026-04-10","total":25,"configs":{"555dy":{"name":"555电影去广告","urlPattern":"^https?:\\/\\/(?:www\\.)?55[a-z0-9]+\\.shop\\/.*","mode":"html"},"bohe":{"name":"薄荷","urlPattern":"^https?:\\/\\/du\\.baicizhan\\.com.*","mode":"json"},"bqwz":{"name":"标枪王者","urlPattern":"^https?:\\/\\/javelin\\.mandrillvr\\.com\\/api\\/data\\/get_game_data","mode":"game"},"bxkt":{"name":"伴学课堂","urlPattern":"^https?:\\/\\/api\\.banxueketang\\.com\\/api\\/classpal\\/app\\/v1","mode":"hybrid"},"cyljy":{"name":"成语来解压","urlPattern":"^https?:\\/\\/yr-game-api\\.feigo\\.fun\\/api\\/user\\/get-game-user-value","mode":"game"},"foday":{"name":"复游会","urlPattern":"^https?:\\/\\/apis\\.folidaymall\\.com\\/online\\/capi\\/component\\/getPageComponents","mode":"json"},"gps":{"name":"GPS工具箱","urlPattern":"^https:\\/\\/service\\.gpstool\\.com\\/app\\/index\\/getUserInfo","mode":"json"},"iappdaily":{"name":"iAppDaily","urlPattern":"^https:\\/\\/api\\.iappdaily\\.com\\/my\\/balance","mode":"json"},"juyeye":{"name":"剧爷爷去广告","urlPattern":"^https?:\\/\\/(?:www\\.)?juyeye\\.cc\\/.*","mode":"html"},"kada":{"name":"KaDa 阅读 VIP Unlock","urlPattern":"^https://service\\.hhdd\\.com/book2","mode":"json"},"keep":{"name":"Keep","urlPattern":"^https?:\\/\\/(?:api|kit)\\.gotokeep\\.com\\/(?:nuocha|gerudo|athena|nuocha\\/plans|suit\\/v5\\/smart|kprime\\/v4\\/suit\\/sales)\\/","mode":"regex"},"kyxq":{"name":"口语星球","urlPattern":"^https?:\\/\\/mapi\\.kouyuxingqiu\\.com\\/api\\/v2","mode":"json"},"mhlz":{"name":"魔幻粒子","urlPattern":"^https?:\\/\\/ss\\.landintheair\\.com\\/storage\\/","mode":"json"},"mingcalc":{"name":"明计算","urlPattern":"^https?://jsq\\.mingcalc\\.cn/XMGetMeCount\\.ashx","mode":"json"},"qiujingapp":{"name":"球竞APP","urlPattern":"^https?:\\/\\/gateway-api\\.yizhilive\\.com\\/api\\/(?:v2\\/index\\/carouses\\/(?:3|6|8|11)|v3\\/index\\/all)","mode":"json"},"qmjyzc":{"name":"全民解压找茬","urlPattern":"^https?://res5\\.haotgame\\.com/cu03/static/OpenDoors/Res/data/levels/\\d+\\.json","mode":"json"},"sylangyue":{"name":"思朗月影视","urlPattern":"^https?:\\/\\/theater-api\\.sylangyue\\.xyz\\/api\\/user\\/info","mode":"json"},"tophub":{"name":"TopHub","urlPattern":"^https:\\/\\/(?:api[23]\\.tophub\\.(?:xyz|today|app)|tophub(?:2)?\\.(?:tophubdata\\.com|idaily\\.today|remai\\.today|iappdaiy\\.com|ipadown\\.com))\\/account\\/sync","mode":"json"},"tv":{"name":"影视去广告","urlPattern":"^https?:\\/\\/(?:yzy0916|yz1018|yz250907|yz0320|cfvip)\\..+\\.com\\/(?:v2|v1)\\/api\\/(?:basic\\/init|home\\/firstScreen|adInfo\\/getPageAd|home\\/body)","mode":"json"},"v2ex":{"name":"V2EX去广告","urlPattern":"^https?:\\/\\/.*v2ex\\.com\\/(?!(?:.*(?:api|login|cdn-cgi|verify|auth|captch|\\.(js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf)))).*$","mode":"html"},"vvebo":{"name":"Vvebo Subscription Forward","urlPattern":"^https:\\/\\/fluxapi\\.vvebo\\.vip\\/v1\\/purchase\\/iap\\/subscription","mode":"forward"},"wohome":{"name":"联通智家","urlPattern":"^https:\\/\\/iotpservice\\.smartont\\.net\\/wohome\\/dispatcher","mode":"json"},"xjsm":{"name":"星际使命","urlPattern":"^https?:\\/\\/star\\.jvplay\\.cn\\/v2\\/storage","mode":"json"},"xmbd":{"name":"消灭病毒","urlPattern":"^https?:\\/\\/wx-bingdu\\.lanfeitech\\.com\\/api\\/archive\\/get","mode":"regex"},"zhenti":{"name":"真题伴侣","urlPattern":"^https?://newtest\\.zoooy111\\.com/mobilev4\\.php/User/index","mode":"json"}}};

const PREFIX_INDEX = {
 exact: {
  'du.baicizhan.com': ["bohe"],
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
  'wx-bingdu.lanfeitech.com': ["xmbd"],
  'newtest.zoooy111.com': ["zhenti"]
 },
 suffix: {
  'baicizhan.com': ["bohe"],
  'mandrillvr.com': ["bqwz"],
  'banxueketang.com': ["bxkt"],
  'feigo.fun': ["cyljy"],
  'folidaymall.com': ["foday"],
  'gpstool.com': ["gps"],
  'iappdaily.com': ["iappdaily"],
  'juyeye.cc': ["juyeye"],
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
  'lanfeitech.com': ["xmbd"],
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
const PREFIX_SUFFIXES=[["xmgetmecount.ashx",["mingcalc"]],["banxueketang.com",["bxkt"]],["kouyuxingqiu.com",["kyxq"]],["landintheair.com",["mhlz"]],["folidaymall.com",["foday"]],["mandrillvr.com",["bqwz"]],["tophubdata.com",["tophub"]],["lanfeitech.com",["xmbd"]],["baicizhan.com",["bohe"]],["iappdaily.com",["iappdaily"]],["yizhilive.com",["qiujingapp"]],["sylangyue.xyz",["sylangyue"]],["gotokeep.com",["keep"]],["haotgame.com",["qmjyzc"]],["idaily.today",["tophub"]],["iappdaiy.com",["tophub"]],["smartont.net",["wohome"]],["zoooy111.com",["zhenti"]],["gpstool.com",["gps"]],["mingcalc.cn",["mingcalc"]],["remai.today",["tophub"]],["ipadown.com",["tophub"]],["feigo.fun",["cyljy"]],["juyeye.cc",["juyeye"]],["vvebo.vip",["vvebo"]],["jvplay.cn",["xjsm"]],["hhdd.com",["kada"]],["v2ex.com",["v2ex"]]];
const PREFIX_SUFFIX_TRIE={"ashx":{"xmgetmecount":{"$":["mingcalc"]}},"com":{"banxueketang":{"$":["bxkt"]},"kouyuxingqiu":{"$":["kyxq"]},"landintheair":{"$":["mhlz"]},"folidaymall":{"$":["foday"]},"mandrillvr":{"$":["bqwz"]},"tophubdata":{"$":["tophub"]},"lanfeitech":{"$":["xmbd"]},"baicizhan":{"$":["bohe"]},"iappdaily":{"$":["iappdaily"]},"yizhilive":{"$":["qiujingapp"]},"gotokeep":{"$":["keep"]},"haotgame":{"$":["qmjyzc"]},"iappdaiy":{"$":["tophub"]},"zoooy111":{"$":["zhenti"]},"gpstool":{"$":["gps"]},"ipadown":{"$":["tophub"]},"hhdd":{"$":["kada"]},"v2ex":{"$":["v2ex"]}},"xyz":{"sylangyue":{"$":["sylangyue"]}},"today":{"idaily":{"$":["tophub"]},"remai":{"$":["tophub"]}},"net":{"smartont":{"$":["wohome"]}},"cn":{"mingcalc":{"$":["mingcalc"]},"jvplay":{"$":["xjsm"]}},"fun":{"feigo":{"$":["cyljy"]}},"cc":{"juyeye":{"$":["juyeye"]}},"vip":{"vvebo":{"$":["vvebo"]}}};
const PREFIX_KEYWORDS=[["kouyuxingqiu",["kyxq"]],["banxueketang",["bxkt"]],["iotpservice",["wohome"]],["picturebook",["ipalfish"]],["theater-api",["sylangyue"]],["folidaymall",["foday"]],["tophubdata",["tophub"]],["mandrillvr",["bqwz"]],["qiujingapp",["qiujingapp"]],["iappdaily",["iappdaily"]],["sylangyue",["sylangyue"]],["yizhilive",["qiujingapp"]],["yz250907",["tv"]],["gotokeep",["keep"]],["lifeweek",["slzd"]],["haotgame",["qmjyzc"]],["smartont",["wohome"]],["ipalfish",["ipalfish"]],["mingcalc",["mingcalc"]],["fluxapi",["vvebo"]],["javelin",["bqwz"]],["gpstool",["gps"]],["qiujing",["qiujingapp"]],["yz1018",["tv"]],["yz0320",["tv"]],["nuocha",["keep"]],["gerudo",["keep"]],["athena",["keep"]],["tophub",["tophub"]],["idaily",["tophub"]],["jvplay",["xjsm"]],["qmjyzc",["qmjyzc"]],["wohome",["wohome"]],["zhenti",["zhenti"]],["cfvip",["tv"]],["remai",["tophub"]],["vvebo",["vvebo"]],["cyljy",["cyljy"]],["feigo",["cyljy"]],["foday",["foday"]],["keep",["keep"]],["v2ex",["v2ex"]],["slzd",["slzd"]],["kyxq",["kyxq"]],["mhlz",["mhlz"]],["xjsm",["xjsm"]],["bqwz",["bqwz"]],["bxkt",["bxkt"]],["kada",["kada"]],["hhdd",["kada"]],["iapp",["iappdaily"]],["yzy",["tv"]],["qmj",["qmjyzc"]],["gps",["gps"]],["jsq",["mingcalc"]],["yz",["tv"]],["cf",["tv"]]];
const PREFIX_KEYWORDS_BY_HEAD2={"ko":[["kouyuxingqiu",["kyxq"]]],"ba":[["banxueketang",["bxkt"]]],"io":[["iotpservice",["wohome"]]],"pi":[["picturebook",["ipalfish"]]],"th":[["theater-api",["sylangyue"]]],"fo":[["folidaymall",["foday"]],["foday",["foday"]]],"to":[["tophubdata",["tophub"]],["tophub",["tophub"]]],"ma":[["mandrillvr",["bqwz"]]],"qi":[["qiujingapp",["qiujingapp"]],["qiujing",["qiujingapp"]]],"ia":[["iappdaily",["iappdaily"]],["iapp",["iappdaily"]]],"sy":[["sylangyue",["sylangyue"]]],"yi":[["yizhilive",["qiujingapp"]]],"yz":[["yz250907",["tv"]],["yz1018",["tv"]],["yz0320",["tv"]],["yzy",["tv"]],["yz",["tv"]]],"go":[["gotokeep",["keep"]]],"li":[["lifeweek",["slzd"]]],"ha":[["haotgame",["qmjyzc"]]],"sm":[["smartont",["wohome"]]],"ip":[["ipalfish",["ipalfish"]]],"mi":[["mingcalc",["mingcalc"]]],"fl":[["fluxapi",["vvebo"]]],"ja":[["javelin",["bqwz"]]],"gp":[["gpstool",["gps"]],["gps",["gps"]]],"nu":[["nuocha",["keep"]]],"ge":[["gerudo",["keep"]]],"at":[["athena",["keep"]]],"id":[["idaily",["tophub"]]],"jv":[["jvplay",["xjsm"]]],"qm":[["qmjyzc",["qmjyzc"]],["qmj",["qmjyzc"]]],"wo":[["wohome",["wohome"]]],"zh":[["zhenti",["zhenti"]]],"cf":[["cfvip",["tv"]],["cf",["tv"]]],"re":[["remai",["tophub"]]],"vv":[["vvebo",["vvebo"]]],"cy":[["cyljy",["cyljy"]]],"fe":[["feigo",["cyljy"]]],"ke":[["keep",["keep"]]],"v2":[["v2ex",["v2ex"]]],"sl":[["slzd",["slzd"]]],"ky":[["kyxq",["kyxq"]]],"mh":[["mhlz",["mhlz"]]],"xj":[["xjsm",["xjsm"]]],"bq":[["bqwz",["bqwz"]]],"bx":[["bxkt",["bxkt"]]],"ka":[["kada",["kada"]]],"hh":[["hhdd",["kada"]]],"js":[["jsq",["mingcalc"]]]};
const PREFIX_KEYWORDS_BY_HEAD1={};
const HOST_MATCH_CACHE=new Map();
const HOST_MATCH_CACHE_LIMIT=200;
function hostCacheGet(h){if(!HOST_MATCH_CACHE.has(h))return undefined;const v=HOST_MATCH_CACHE.get(h);HOST_MATCH_CACHE.delete(h);HOST_MATCH_CACHE.set(h,v);return v}
function hostCacheSet(h,v){if(HOST_MATCH_CACHE.has(h))HOST_MATCH_CACHE.delete(h);else if(HOST_MATCH_CACHE.size>=HOST_MATCH_CACHE_LIMIT){const k=HOST_MATCH_CACHE.keys().next().value;HOST_MATCH_CACHE.delete(k)}HOST_MATCH_CACHE.set(h,v)}
function findBySuffixTrie(h){const parts=h.split(".").reverse();let node=PREFIX_SUFFIX_TRIE;let found=null;for(let i=0;i<parts.length;i++){const p=parts[i];if(!node[p])break;node=node[p];if(node.$)found={ids:node.$,method:"suffix",matched:parts.slice(0,i+1).reverse().join(".")}}return found}
function findByPrefix(hostname){const h=hostname.toLowerCase();const c=hostCacheGet(h);if(c!==undefined)return c;let out=null;if(PREFIX_INDEX.exact[h])out={ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};else{out=findBySuffixTrie(h);if(!out){const seen2=new Set();for(let i=0;i<h.length-1;i++){const a=h[i],b=h[i+1];if(a==='.'||a==='-'||a==='_')continue;if(b==='.'||b==='-'||b==='_')continue;const k2=a+b;if(seen2.has(k2))continue;seen2.add(k2);const bucket=PREFIX_KEYWORDS_BY_HEAD2[k2];if(!bucket)continue;for(const[kw,ids]of bucket){if(h.includes(kw)){out={ids,method:'keyword',matched:kw};break}}if(out)break}if(!out){const seen1=new Set();for(let i=0;i<h.length;i++){const ch=h[i];if(ch==='.'||ch==='-'||ch==='_')continue;if(seen1.has(ch))continue;seen1.add(ch);const bucket=PREFIX_KEYWORDS_BY_HEAD1[ch];if(!bucket)continue;for(const[kw,ids]of bucket){if(h.includes(kw)){out={ids,method:'keyword',matched:kw};break}}if(out)break}}}}hostCacheSet(h,out);return out}

function _log(level, tag, msg) {
  if (typeof CONFIG === 'undefined' || !CONFIG.DEBUG) return;
  if (level === 'debug' && !CONFIG.VERBOSE_PATTERN_LOG) return;
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${ts}][${tag}]`;
  try { console.log(`${prefix} ${msg}`); } catch (e) {}
}

const Logger = {
  info:  (tag, msg) => _log('info', tag, msg),
  error: (tag, msg) => _log('error', tag, msg),
  debug: (tag, msg) => _log('debug', tag, msg),
  warn:  (tag, msg) => _log('warn', tag, msg)
};

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

      let parsed;
      try {
        parsed = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        parsed = value;
      }

      all[configId] = {
        v: parsed.v || '1.0',
        t: Date.now(),
        d: parsed.d || parsed
      };

      let str = JSON.stringify(all);
      const maxSize = 500000;

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

      $task.fetch({
        url,
        method: 'GET',
        timeout: toQxSeconds(safeTimeout)
      }).then(
        res => {
          clearTimeout(timer);
          resolve({
            body: res.body || '',
            statusCode: res.statusCode || 200,
            headers: res.headers || {}
          });
        },
        err => {
          clearTimeout(timer);
          reject(new Error(String(err)));
        }
      );
    }),

    post: (options, timeout = 10000) => new Promise((resolve, reject) => {
      const effectiveTimeout = normalizeTimeoutMs(
        options && options.timeout,
        normalizeTimeoutMs(timeout, 10000)
      );

      const timer = setTimeout(() => reject(new Error('Timeout')), effectiveTimeout);

      $task.fetch({
        url: options.url,
        method: 'POST',
        headers: options.headers || {},
        body: options.body || '',
        timeout: toQxSeconds(effectiveTimeout)
      }).then(
        res => {
          clearTimeout(timer);
          resolve({
            body: res.body || '',
            statusCode: res.statusCode || 200,
            headers: res.headers || {}
          });
        },
        err => {
          clearTimeout(timer);
          reject(new Error(String(err)));
        }
      );
    })
  };
})();

const __pathTokenCache = new Map();
const __maxPathTokenCacheSize = 300;

function _tokenizePath(path) {
  if (!path || typeof path !== 'string') return [];
  const hit = __pathTokenCache.get(path);
  if (hit) return hit;

  const tokens = path.split('.').map(part => {
    const m = part.match(/^([^\[\]]+)\[(\d+)\]$/);
    if (m) {
      return { key: m[1], isArray: true, index: parseInt(m[2], 10) };
    }
    return { key: part, isArray: false, index: -1 };
  });

  if (__pathTokenCache.size >= __maxPathTokenCacheSize) {
    const firstKey = __pathTokenCache.keys().next().value;
    __pathTokenCache.delete(firstKey);
  }
  __pathTokenCache.set(path, tokens);
  return tokens;
}

const Utils = {
  safeJsonParse: (str, defaultVal = null) => {
    try { return JSON.parse(str); } catch (e) { return defaultVal; }
  },

  safeJsonStringify: (obj) => {
    try { return JSON.stringify(obj); } catch (e) { return '{}'; }
  },

  compilePath: (path) => _tokenizePath(path),

  getPath: (obj, pathOrTokens) => {
    if (!obj || !pathOrTokens) return undefined;
    const tokens = Array.isArray(pathOrTokens) ? pathOrTokens : _tokenizePath(pathOrTokens);
    let current = obj;

    for (const token of tokens) {
      if (current == null) return undefined;
      if (token.isArray) {
        const arr = current[token.key];
        current = arr && arr[token.index];
      } else {
        current = current[token.key];
      }
    }
    return current;
  },

  setPath: (obj, pathOrTokens, value) => {
    if (!obj || !pathOrTokens) return obj;
    const tokens = Array.isArray(pathOrTokens) ? pathOrTokens : _tokenizePath(pathOrTokens);
    if (!tokens.length) return obj;

    let current = obj;

    for (let i = 0; i < tokens.length - 1; i++) {
      const token = tokens[i];
      const next = tokens[i + 1];

      if (token.isArray) {
        const arr = current[token.key] || (current[token.key] = []);
        if (arr[token.index] == null) {
          arr[token.index] = next && next.isArray ? [] : {};
        }
        current = arr[token.index];
      } else {
        if (current[token.key] == null) {
          current[token.key] = next && next.isArray ? [] : {};
        }
        current = current[token.key];
      }
    }

    const last = tokens[tokens.length - 1];
    if (last.isArray) {
      const arr = current[last.key] || (current[last.key] = []);
      arr[last.index] = value;
    } else {
      current[last.key] = value;
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

function sendNotify(title, subtitle, message, options) {
  if (typeof $notify !== 'undefined') {
    $notify(title, subtitle, message, options || {});
  }
}

function createProcessorFactory(requestId) {
  return {
    setFields: (params) => {
      const fields = params.fields || {};
      const compiled = Object.entries(fields).map(([path, value]) => ({
        tokens: Utils.compilePath(path),
        value
      }));

      return (obj, env) => {
        for (const item of compiled) {
          let value = item.value;
          if (typeof value === 'string' && value.includes('{{')) {
            value = Utils.resolveTemplate(value, obj);
          }
          Utils.setPath(obj, item.tokens, value);
        }
        return obj;
      };
    },

    mapArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      const fields = params.fields || {};
      const compiled = Object.entries(fields).map(([path, value]) => ({
        tokens: Utils.compilePath(path),
        value
      }));

      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (!Array.isArray(arr)) return obj;

        for (const itemObj of arr) {
          if (!itemObj) continue;
          for (const item of compiled) {
            let value = item.value;
            if (typeof value === 'string' && value.includes('{{')) {
              value = Utils.resolveTemplate(value, itemObj);
            }
            Utils.setPath(itemObj, item.tokens, value);
          }
        }
        return obj;
      };
    },

    filterArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      const excludeSet = new Set(params.excludeKeys || []);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (!Array.isArray(arr)) return obj;
        Utils.setPath(obj, arrPathTokens, arr.filter(item => !excludeSet.has(item && item[params.keyField])));
        return obj;
      };
    },

    clearArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (Array.isArray(arr)) arr.length = 0;
        return obj;
      };
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

    sliceArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (Array.isArray(arr) && arr.length > params.keepCount) {
          Utils.setPath(obj, arrPathTokens, arr.slice(0, params.keepCount));
        }
        return obj;
      };
    },

    shiftArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (Array.isArray(arr) && arr.length > 0) arr.shift();
        return obj;
      };
    },

    processByKeyPrefix: (params) => {
      const objPathTokens = Utils.compilePath(params.objPath);
      const rules = Object.entries(params.prefixRules || {});

      return (obj, env) => {
        const target = Utils.getPath(obj, objPathTokens);
        if (!target || typeof target !== 'object') return obj;

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
      };
    },

    notify: (params) => {
      const title = params.title || 'UnifiedVIP';
      const subtitleFieldTokens = params.subtitleField ? Utils.compilePath(params.subtitleField) : null;
      const messageFieldTokens = params.messageField ? Utils.compilePath(params.messageField) : null;
      const markFieldTokens = params.markField ? Utils.compilePath(params.markField) : null;

      return (obj, env) => {
        let subtitle = params.subtitle || '';
        let message = params.message || '';

        if (subtitleFieldTokens) {
          subtitle = Utils.getPath(obj, subtitleFieldTokens) || subtitle;
        }

        if (params.template) {
          message = params.template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return Utils.getPath(obj, key) || match;
          });
        } else if (messageFieldTokens) {
          const fieldData = Utils.getPath(obj, messageFieldTokens);
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

        sendNotify(title, subtitle, message, params.options);

        if (markFieldTokens) {
          Utils.setPath(obj, markFieldTokens, true);
        }

        return obj;
      };
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

class SimpleManifestLoader {
  constructor(requestId) {
    this._requestId = requestId;
    this._lazyConfigs = (typeof BUILTIN_MANIFEST !== 'undefined' && BUILTIN_MANIFEST)
      ? (BUILTIN_MANIFEST.configs || {})
      : {};
    this._regexCache = new Map();
    this._memoizedMatches = new Map();
    this._maxMemoizedMatchesSize = 300;
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

        const cacheKey = self._extractHostname(url);

        if (self._memoizedMatches.has(cacheKey)) {
          return self._memoizedMatches.get(cacheKey);
        }

        let ids = null;

        if (self._findByPrefix) {
          try {
            const hostname = self._extractHostname(url);
            const result = self._findByPrefix(hostname);
            if (result && result.ids) ids = result.ids;
          } catch (e) {}
        }

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

    const memHit = this._memCache.get(versionedId);
    if (memHit) {
      return memHit.d;
    }

    const cached = Storage.readConfig(versionedId);
    if (cached) {
      try {
        const { d } = JSON.parse(cached);
        this._memCache.set(versionedId, { t: Date.now(), d });
        return d;
      } catch (e) {}
    }

    const url = `${CONFIG.REMOTE_BASE}/configs/${configId}.json`;

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

      Storage.writeConfig(versionedId, {
        v: remoteVersion,
        t: Date.now(),
        d: fresh
      });

      const prepared = this._prepareConfig(fresh);
      this._memCache.set(versionedId, { t: Date.now(), d: prepared });
      return prepared;

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);

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

    if (config.processor) {
      try {
        config._processor = this._compiler(config.processor);
        config.processor = null;
      } catch (e) {
      }
    }

    if (raw.regexReplacements) {
      config._regexReplacements = raw.regexReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'g'),
        replacement: r.replacement
      }));
      config.regexReplacements = null;
    }

    if (raw.gameResources) {
      config._gameResources = raw.gameResources.map(r => ({
        field: r.field,
        value: r.value,
        pattern: RegexPool.get(`"${r.field}":\\d+`, 'g')
      }));
      config.gameResources = null;
    }

    if (raw.htmlReplacements) {
      config._htmlReplacements = raw.htmlReplacements.map(r => ({
        pattern: RegexPool.get(r.pattern, r.flags || 'gi'),
        replacement: r.replacement
      }));
      config.htmlReplacements = null;
    }

    if (Array.isArray(raw.htmlMarkers)) {
      config._htmlMarkers = raw.htmlMarkers
        .filter(Boolean)
        .map(m => String(m));
      config.htmlMarkers = null;
    }

    return config;
  }
}

class Environment {
  constructor(name) {
    this.name = name;
    this.isQX = true;

    this.response = (typeof $response !== 'undefined') ? $response : {};
    this.request = (typeof $request !== 'undefined') ? $request : {};

    if (!this.request.url && this.response && this.response.request) {
      this.request = this.response.request;
    }
  }

  getUrl() {
    let url = (this.response && this.response.url) || (this.request && this.request.url) || '';
    if (typeof $request === 'string') {
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
    $done(result);
  }
}

class VipEngine {
  constructor(env, requestId) {
    this.env = env;
    this._requestId = requestId;
  }

  async process(body, config) {
    if (!config || !config.mode) {
      return { body: typeof body === 'string' ? body : Utils.safeJsonStringify(body || {}) };
    }

    if (config.mode === 'forward') {
      return await this._processForward(config);
    }
    if (config.mode === 'remote') {
      return await this._processRemote(config);
    }

    const normalizedBody = typeof body === 'string' ? body : Utils.safeJsonStringify(body || {});
    if (!normalizedBody) return { body: '{}' };

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

    Logger.info('Forward', `Forwarding to ${options.url}`);

    try {
      const response = await HTTP.post(options);
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
      const response = await HTTP.get(config.remoteUrl, config.timeout || 10000);

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

async function main(){
  const rid=Math.random().toString(36).substr(2,6).toUpperCase();
  try{
    const resp=(typeof $response!=='undefined'&&$response)?$response:null;
    const doneFallback=()=>$done(resp?{body:resp.body}:{});
    let u='';
    if(typeof $request!=='undefined')u=typeof $request==='string'?$request:$request.url||'';
    else if(resp)u=resp.url||'';
    if(!u)return doneFallback();

    Logger.debug('Main',rid+'|'+u.split('?')[0].substring(0,60));

    const g = (typeof globalThis !== 'undefined') ? globalThis : {};
    const ml = g.__UVIP_ML || (g.__UVIP_ML = new SimpleManifestLoader('GLOBAL'));
    const mf = g.__UVIP_MF || (g.__UVIP_MF = await ml.load());
    const cid = mf.findMatch(u);

    if(!cid){
      Logger.debug('Main','No match');
      return doneFallback();
    }

    const cl = g.__UVIP_CL || (g.__UVIP_CL = new SimpleConfigLoader('GLOBAL'));
    const cfg = await cl.load(cid,mf.getConfigVersion(cid));
    const env=new Environment(META.name);

    let eng = g.__UVIP_ENG_IDLE || null;
    if (eng) {
      g.__UVIP_ENG_IDLE = null;
      eng.env = env;
      eng._requestId = rid;
    } else {
      eng = new VipEngine(env,rid);
    }

    const res=await eng.process(resp?resp.body:'',cfg);

    if (!g.__UVIP_ENG_IDLE) {
      eng.env = null;
      eng._requestId = '';
      g.__UVIP_ENG_IDLE = eng;
    }

    Logger.debug('Main',rid+' done ['+cfg.mode+']');
    $done(res)
  }catch(e){
    Logger.error('Main',rid+' fail:'+e.message);
    const resp=(typeof $response!=='undefined'&&$response)?$response:null;
    $done(resp?{body:resp.body}:{})
  }
}
main();
