/*
 * ==========================================
 * Unified VIP Unlock Manager v22.0.0
 * 构建时间: 2026-04-13T18:07:56.714Z
 * APP数量: 25
 * ==========================================
 *
 * 订阅规则: https://joeshu.github.io/UnifiedVIP/rewrite.conf
 * 诊断功能: 在 QX 控制台运行 diagnose() 查看详细匹配信息
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

const BUILTIN_MANIFEST = {"version":"22.0.0-b8a4e6a8","updated":"2026-04-13","total":25,"configs":{"555dy":{"name":"555电影去广告","urlPattern":"^https?:\\/\\/(?:www\\.)?55[a-z0-9]+\\.shop\\/.*","meta":{"id":"555dy","mode":"html","hasProcessor":false,"hasRegex":false,"hasGame":false,"hasHtml":true,"hasHtmlMarkers":true},"mode":"html"},"bohe":{"name":"薄荷","urlPattern":"^https?:\\/\\/du\\.baicizhan\\.com.*","meta":{"id":"bohe","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"bqwz":{"name":"标枪王者","urlPattern":"^https?:\\/\\/javelin\\.mandrillvr\\.com\\/api\\/data\\/get_game_data","meta":{"id":"bqwz","mode":"game","hasProcessor":false,"hasRegex":false,"hasGame":true,"hasHtml":false,"hasHtmlMarkers":false},"mode":"game"},"bxkt":{"name":"伴学课堂","urlPattern":"^https?:\\/\\/api\\.banxueketang\\.com\\/api\\/classpal\\/app\\/v1","meta":{"id":"bxkt","mode":"hybrid","hasProcessor":true,"hasRegex":true,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"hybrid"},"cyljy":{"name":"成语来解压","urlPattern":"^https?:\\/\\/yr-game-api\\.feigo\\.fun\\/api\\/user\\/get-game-user-value","meta":{"id":"cyljy","mode":"game","hasProcessor":false,"hasRegex":false,"hasGame":true,"hasHtml":false,"hasHtmlMarkers":false},"mode":"game"},"foday":{"name":"复游会","urlPattern":"^https?:\\/\\/apis\\.folidaymall\\.com\\/online\\/capi\\/component\\/getPageComponents","meta":{"id":"foday","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"gps":{"name":"GPS工具箱","urlPattern":"^https:\\/\\/service\\.gpstool\\.com\\/app\\/index\\/getUserInfo","meta":{"id":"gps","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"iappdaily":{"name":"iAppDaily","urlPattern":"^https:\\/\\/api\\.iappdaily\\.com\\/my\\/balance","meta":{"id":"iappdaily","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"juyeye":{"name":"剧爷爷去广告","urlPattern":"^https?:\\/\\/(?:www\\.)?juyeye\\.cc\\/.*","meta":{"id":"juyeye","mode":"html","hasProcessor":false,"hasRegex":false,"hasGame":false,"hasHtml":true,"hasHtmlMarkers":true},"mode":"html"},"kada":{"name":"KaDa 阅读 VIP Unlock","urlPattern":"^https://service\\.hhdd\\.com/book2","meta":{"id":"kada","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"keep":{"name":"Keep","urlPattern":"^https?:\\/\\/(?:api|kit)\\.gotokeep\\.com\\/(?:nuocha|gerudo|athena|nuocha\\/plans|suit\\/v5\\/smart|kprime\\/v4\\/suit\\/sales)\\/","meta":{"id":"keep","mode":"regex","hasProcessor":false,"hasRegex":true,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"regex"},"kyxq":{"name":"口语星球","urlPattern":"^https?:\\/\\/mapi\\.kouyuxingqiu\\.com\\/api\\/v2","meta":{"id":"kyxq","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"mhlz":{"name":"魔幻粒子","urlPattern":"^https?:\\/\\/ss\\.landintheair\\.com\\/storage\\/","meta":{"id":"mhlz","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"mingcalc":{"name":"明计算","urlPattern":"^https?://jsq\\.mingcalc\\.cn/XMGetMeCount\\.ashx","meta":{"id":"mingcalc","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"qiujingapp":{"name":"球竞APP","urlPattern":"^https?:\\/\\/gateway-api\\.yizhilive\\.com\\/api\\/(?:v2\\/index\\/carouses\\/(?:3|6|8|11)|v3\\/index\\/all)","meta":{"id":"qiujingapp","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"qmjyzc":{"name":"全民解压找茬","urlPattern":"^https?://res5\\.haotgame\\.com/cu03/static/OpenDoors/Res/data/levels/\\d+\\.json","meta":{"id":"qmjyzc","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"sylangyue":{"name":"思朗月影视","urlPattern":"^https?:\\/\\/theater-api\\.sylangyue\\.xyz\\/api\\/user\\/info","meta":{"id":"sylangyue","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"tophub":{"name":"TopHub","urlPattern":"^https:\\/\\/(?:api[23]\\.tophub\\.(?:xyz|today|app)|tophub(?:2)?\\.(?:tophubdata\\.com|idaily\\.today|remai\\.today|iappdaiy\\.com|ipadown\\.com))\\/account\\/sync","meta":{"id":"tophub","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"tv":{"name":"影视去广告","urlPattern":"^https?:\\/\\/(?:yzy0916|yz1018|yz250907|yz0320|cfvip)\\..+\\.com\\/(?:v2|v1)\\/api\\/(?:basic\\/init|home\\/firstScreen|adInfo\\/getPageAd|home\\/body)","meta":{"id":"tv","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"v2ex":{"name":"V2EX去广告","urlPattern":"^https?:\\/\\/.*v2ex\\.com\\/(?!(?:.*(?:api|login|cdn-cgi|verify|auth|captch|\\.(js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf)))).*$","meta":{"id":"v2ex","mode":"html","hasProcessor":false,"hasRegex":false,"hasGame":false,"hasHtml":true,"hasHtmlMarkers":true},"mode":"html"},"vvebo":{"name":"Vvebo Subscription Forward","urlPattern":"^https:\\/\\/fluxapi\\.vvebo\\.vip\\/v1\\/purchase\\/iap\\/subscription","meta":{"id":"vvebo","mode":"forward","hasProcessor":false,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"forward"},"wohome":{"name":"联通智家","urlPattern":"^https:\\/\\/iotpservice\\.smartont\\.net\\/wohome\\/dispatcher","meta":{"id":"wohome","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"xjsm":{"name":"星际使命","urlPattern":"^https?:\\/\\/star\\.jvplay\\.cn\\/v2\\/storage","meta":{"id":"xjsm","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"},"xmbd":{"name":"消灭病毒","urlPattern":"^https?:\\/\\/wx-bingdu\\.lanfeitech\\.com\\/api\\/archive\\/get","meta":{"id":"xmbd","mode":"regex","hasProcessor":false,"hasRegex":true,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"regex"},"zhenti":{"name":"真题伴侣","urlPattern":"^https?://newtest\\.zoooy111\\.com/mobilev4\\.php/User/index","meta":{"id":"zhenti","mode":"json","hasProcessor":true,"hasRegex":false,"hasGame":false,"hasHtml":false,"hasHtmlMarkers":false},"mode":"json"}}};

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
const PREFIX_KEYWORDS_BY_HEAD2={"ko":{"12":[["kouyuxingqiu",["kyxq"]]]},"ba":{"12":[["banxueketang",["bxkt"]]]},"io":{"11":[["iotpservice",["wohome"]]]},"th":{"11":[["theater-api",["sylangyue"]]]},"fo":{"5":[["foday",["foday"]]],"11":[["folidaymall",["foday"]]]},"to":{"6":[["tophub",["tophub"]]],"10":[["tophubdata",["tophub"]]]},"ma":{"10":[["mandrillvr",["bqwz"]]]},"qi":{"7":[["qiujing",["qiujingapp"]]],"10":[["qiujingapp",["qiujingapp"]]]},"ia":{"4":[["iapp",["iappdaily"]]],"9":[["iappdaily",["iappdaily"]]]},"sy":{"9":[["sylangyue",["sylangyue"]]]},"yi":{"9":[["yizhilive",["qiujingapp"]]]},"yz":{"2":[["yz",["tv"]]],"3":[["yzy",["tv"]]],"6":[["yz1018",["tv"]],["yz0320",["tv"]]],"8":[["yz250907",["tv"]]]},"go":{"8":[["gotokeep",["keep"]]]},"ha":{"8":[["haotgame",["qmjyzc"]]]},"sm":{"8":[["smartont",["wohome"]]]},"mi":{"8":[["mingcalc",["mingcalc"]]]},"fl":{"7":[["fluxapi",["vvebo"]]]},"ja":{"7":[["javelin",["bqwz"]]]},"gp":{"3":[["gps",["gps"]]],"7":[["gpstool",["gps"]]]},"nu":{"6":[["nuocha",["keep"]]]},"ge":{"6":[["gerudo",["keep"]]]},"at":{"6":[["athena",["keep"]]]},"id":{"6":[["idaily",["tophub"]]]},"jv":{"6":[["jvplay",["xjsm"]]]},"qm":{"3":[["qmj",["qmjyzc"]]],"6":[["qmjyzc",["qmjyzc"]]]},"wo":{"6":[["wohome",["wohome"]]]},"zh":{"6":[["zhenti",["zhenti"]]]},"cf":{"2":[["cf",["tv"]]],"5":[["cfvip",["tv"]]]},"re":{"5":[["remai",["tophub"]]]},"vv":{"5":[["vvebo",["vvebo"]]]},"cy":{"5":[["cyljy",["cyljy"]]]},"fe":{"5":[["feigo",["cyljy"]]]},"ke":{"4":[["keep",["keep"]]]},"v2":{"4":[["v2ex",["v2ex"]]]},"ky":{"4":[["kyxq",["kyxq"]]]},"mh":{"4":[["mhlz",["mhlz"]]]},"xj":{"4":[["xjsm",["xjsm"]]]},"bq":{"4":[["bqwz",["bqwz"]]]},"bx":{"4":[["bxkt",["bxkt"]]]},"ka":{"4":[["kada",["kada"]]]},"hh":{"4":[["hhdd",["kada"]]]},"js":{"3":[["jsq",["mingcalc"]]]}};
const HOST_MATCH_CACHE=new Map();
const HOST_MATCH_CACHE_LIMIT=200;
function hostCacheGet(h){if(!HOST_MATCH_CACHE.has(h))return undefined;const v=HOST_MATCH_CACHE.get(h);HOST_MATCH_CACHE.delete(h);HOST_MATCH_CACHE.set(h,v);return v}
function hostCacheSet(h,v){if(HOST_MATCH_CACHE.has(h))HOST_MATCH_CACHE.delete(h);else if(HOST_MATCH_CACHE.size>=HOST_MATCH_CACHE_LIMIT){const k=HOST_MATCH_CACHE.keys().next().value;HOST_MATCH_CACHE.delete(k)}HOST_MATCH_CACHE.set(h,v)}
function findBySuffixFast(h){const lastDot=h.lastIndexOf(".");if(lastDot<=0||lastDot>=h.length-1)return null;const prevDot=h.lastIndexOf(".",lastDot-1);const suffix=prevDot>=0?h.slice(prevDot+1):h;const ids=PREFIX_INDEX.suffix[suffix];return ids?{ids,method:"suffix",matched:suffix}:null}
function findByPrefix(hostname){const h=hostname.toLowerCase();const c=hostCacheGet(h);if(c!==undefined)return c;let out=null;if(PREFIX_INDEX.exact[h])out={ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};else{out=findBySuffixFast(h);if(!out){const seen2=Object.create(null);for(let i=0;i<h.length-1;i++){const a=h[i],b=h[i+1];if(a==='.'||a==='-'||a==='_')continue;if(b==='.'||b==='-'||b==='_')continue;const k2=a+b;if(seen2[k2])continue;seen2[k2]=1;const grouped=PREFIX_KEYWORDS_BY_HEAD2[k2];if(!grouped)continue;const lens=Object.keys(grouped).sort((x,y)=>Number(y)-Number(x));for(const lenKey of lens){if(Number(lenKey)>h.length)continue;for(const[kw,ids]of grouped[lenKey]){if(h.includes(kw)){out={ids,method:'keyword',matched:kw};break}}if(out)break}if(out)break}}}hostCacheSet(h,out);return out}

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

function markProcessor(processor, meta = {}) {
  if (typeof processor === 'function') {
    processor.__uvipMeta = Object.assign({}, processor.__uvipMeta || {}, meta);
  }
  return processor;
}

function sendNotify(title, subtitle, message, options) {
  if (typeof $notify !== 'undefined') {
    $notify(title, subtitle, message, options || {});
  }
}

function compileValueSetterMap(fields) {
  return Object.entries(fields || {}).map(([path, value]) => ({
    tokens: Utils.compilePath(path),
    value,
    isTemplate: typeof value === 'string' && value.includes('{{'),
    isDirectKey: typeof path === 'string' && path.length > 0 && path.indexOf('.') < 0 && path.indexOf('[') < 0,
    directKey: typeof path === 'string' && path.length > 0 && path.indexOf('.') < 0 && path.indexOf('[') < 0 ? path : null
  }));
}

function applyCompiledValueSetters(target, compiled, sourceObj) {
  for (const item of compiled) {
    const value = item.isTemplate ? Utils.resolveTemplate(item.value, sourceObj) : item.value;
    if (item.isDirectKey && item.directKey) {
      target[item.directKey] = value;
      continue;
    }

    const tokens = item.tokens || [];
    if (tokens.length === 1 && !tokens[0].isArray) {
      target[tokens[0].key] = value;
      continue;
    }
    if (tokens.length === 2 && !tokens[0].isArray && !tokens[1].isArray) {
      const p0 = tokens[0].key;
      const p1 = tokens[1].key;
      let node = target[p0];
      if (node == null || typeof node !== 'object') node = target[p0] = {};
      node[p1] = value;
      continue;
    }

    Utils.setPath(target, tokens, value);
  }
}

function buildNotifyMessageResolver(params) {
  const subtitleFieldTokens = params.subtitleField ? Utils.compilePath(params.subtitleField) : null;
  const messageFieldTokens = params.messageField ? Utils.compilePath(params.messageField) : null;
  const markFieldTokens = params.markField ? Utils.compilePath(params.markField) : null;
  const prefixText = params.prefix || '';
  const maxLen = params.maxLength || 500;
  const separator = params.separator || '\n';
  const title = params.title || 'UnifiedVIP';
  const template = typeof params.template === 'string' ? params.template : '';
  const hasTemplate = !!template;

  return {
    title,
    markFieldTokens,
    resolve(obj) {
      let subtitle = params.subtitle || '';
      let message = params.message || '';

      if (subtitleFieldTokens) {
        subtitle = Utils.getPath(obj, subtitleFieldTokens) || subtitle;
      }

      if (hasTemplate) {
        message = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return Utils.getPath(obj, key) || match;
        });
      } else if (messageFieldTokens) {
        const fieldData = Utils.getPath(obj, messageFieldTokens);
        if (fieldData) {
          message = typeof fieldData === 'object'
            ? Utils.formatObject(fieldData, separator)
            : String(fieldData);
        }
      }

      if (prefixText) {
        message = prefixText + message;
      }

      if (message.length > maxLen) {
        message = message.substring(0, maxLen) + '...';
      }

      return { subtitle, message };
    }
  };
}

function makeConditionMatcher(def) {
  const checkPath = def.check || 'data';
  const checkTokens = Utils.compilePath(checkPath);
  const pathNeedle = def.path ? String(def.path) : '';
  const queryRegex = def.param ? RegexPool.get(`[?&]${def.param}=([^&]+)`) : null;
  const expectedValue = def.value;

  return (obj, env) => {
    switch (def.condition || def.when) {
      case 'empty': {
        const data = Utils.getPath(obj, checkTokens);
        return !data || Object.keys(data).length === 0;
      }
      case 'pathMatch': {
        if (!pathNeedle) return false;
        if (env && env.getPathname) {
          const pathname = env.getPathname();
          if (pathname && pathname.includes(pathNeedle)) return true;
        }
        const url = env && env.getUrl ? env.getUrl() : '';
        return !!(url && url.includes(pathNeedle));
      }
      case 'queryMatch': {
        if (!queryRegex) return false;
        const search = env && env.getSearch ? env.getSearch() : '';
        const source = search || (env && env.getUrl ? env.getUrl() : '');
        const match = source.match(queryRegex);
        return !!(match && decodeURIComponent(match[1]) === expectedValue);
      }
      case 'includes': {
        const checkData = Utils.getPath(obj, checkTokens);
        return Array.isArray(checkData) ? checkData.includes(expectedValue) : String(checkData).includes(expectedValue);
      }
      case 'isObject':
        return typeof obj.data === 'object' && !Array.isArray(obj.data);
      case 'isArray':
        return Array.isArray(obj.data);
      default:
        return false;
    }
  };
}

function createProcessorFactory(requestId) {
  return {
    setFields: (params) => {
      const compiled = compileValueSetterMap(params.fields || {});
      const directStatic = compiled.filter(item => item.isDirectKey && item.directKey && !item.isTemplate);
      const directTemplate = compiled.filter(item => item.isDirectKey && item.directKey && item.isTemplate);
      const complex = compiled.filter(item => !item.isDirectKey || !item.directKey);

      return markProcessor((obj, env) => {
        for (const item of directStatic) {
          obj[item.directKey] = item.value;
        }

        for (const item of directTemplate) {
          obj[item.directKey] = Utils.resolveTemplate(item.value, obj);
        }

        if (complex.length > 0) {
          applyCompiledValueSetters(obj, complex, obj);
        }
        return obj;
      }, { mutates: true, kind: 'setFields' });
    },

    mapArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      const compiled = compileValueSetterMap(params.fields || {});
      const directStatic = compiled.filter(item => item.isDirectKey && item.directKey && !item.isTemplate);
      const directTemplate = compiled.filter(item => item.isDirectKey && item.directKey && item.isTemplate);
      const complex = compiled.filter(item => !item.isDirectKey || !item.directKey);
      const complexLen = complex.length;
      const staticLen = directStatic.length;
      const templateLen = directTemplate.length;

      return markProcessor((obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (!Array.isArray(arr)) return obj;

        if (complexLen === 0 && templateLen === 0) {
          for (let i = 0; i < arr.length; i++) {
            const itemObj = arr[i];
            if (!itemObj || typeof itemObj !== 'object') continue;
            for (let j = 0; j < staticLen; j++) {
              const item = directStatic[j];
              itemObj[item.directKey] = item.value;
            }
          }
          return obj;
        }

        for (let i = 0; i < arr.length; i++) {
          const itemObj = arr[i];
          if (!itemObj || typeof itemObj !== 'object') continue;

          for (let j = 0; j < staticLen; j++) {
            const item = directStatic[j];
            itemObj[item.directKey] = item.value;
          }

          for (let j = 0; j < templateLen; j++) {
            const item = directTemplate[j];
            itemObj[item.directKey] = Utils.resolveTemplate(item.value, itemObj);
          }

          if (complexLen > 0) {
            applyCompiledValueSetters(itemObj, complex, itemObj);
          }
        }
        return obj;
      }, { mutates: true, kind: 'mapArray' });
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

    deleteFields: (params) => {
      const compiledPaths = (params.paths || []).map(path => {
        if (!path || typeof path !== 'string') return null;
        const parts = path.split('.');
        if (!parts.length) return null;
        const last = parts[parts.length - 1];
        const parentTokens = parts.length > 1 ? Utils.compilePath(parts.slice(0, -1).join('.')) : null;
        const lastMatch = last.match(/^([^\[\]]+)\[(\d+)\]$/);
        return {
          parentTokens,
          last,
          arrayDelete: lastMatch ? { key: lastMatch[1], index: parseInt(lastMatch[2], 10) } : null
        };
      }).filter(Boolean);

      return markProcessor((obj, env) => {
        for (const item of compiledPaths) {
          const parent = item.parentTokens ? Utils.getPath(obj, item.parentTokens) : obj;
          if (!parent || typeof parent !== 'object') continue;

          if (item.arrayDelete) {
            const arr = parent[item.arrayDelete.key];
            const idx = item.arrayDelete.index;
            if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
              arr.splice(idx, 1);
            }
          } else if (Array.isArray(parent)) {
            for (const row of parent) {
              if (row && typeof row === 'object') {
                delete row[item.last];
              }
            }
          } else {
            delete parent[item.last];
          }
        }
        return obj;
      }, { mutates: true, kind: 'deleteFields' });
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
      const entries = Object.entries(params.prefixRules || {});
      const wildcardEntry = entries.find(([prefix]) => prefix === '*') || null;
      const specificRules = entries.filter(([prefix]) => prefix !== '*');

      return (obj, env) => {
        const target = Utils.getPath(obj, objPathTokens);
        if (!target || typeof target !== 'object') return obj;

        for (const key in target) {
          const value = target[key];
          if (!value || typeof value !== 'object') continue;

          let matchedHandler = null;
          for (const [prefix, handler] of specificRules) {
            if (key.startsWith(prefix)) {
              matchedHandler = handler;
              break;
            }
          }
          if (!matchedHandler && wildcardEntry) {
            matchedHandler = wildcardEntry[1];
          }
          if (matchedHandler) {
            Object.assign(value, matchedHandler);
          }
        }
        return obj;
      };
    },

    notify: (params) => {
      const resolver = buildNotifyMessageResolver(params || {});

      return (obj, env) => {
        const { subtitle, message } = resolver.resolve(obj);
        sendNotify(resolver.title, subtitle, message, params.options);

        if (resolver.markFieldTokens) {
          Utils.setPath(obj, resolver.markFieldTokens, true);
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
      const processors = steps.map(step => compile(step)).filter(Boolean);
      const allMutates = processors.length > 0 && processors.every(p => p && p.__uvipMeta && p.__uvipMeta.mutates === true);

      return markProcessor((obj, env) => {
        let result = obj;
        for (let i = 0; i < processors.length; i++) {
          const processor = processors[i];
          if (!result) break;
          result = processor(result, env);
        }
        return result;
      }, { mutates: allMutates, kind: 'compose', stepCount: processors.length });
    },

    when: (params, compile) => {
      const conditionFn = makeConditionMatcher(params || {});

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
        matchFn: makeConditionMatcher(s || {}),
        then: compile(s.then)
      })).filter(scene => typeof scene.then === 'function');

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

function stableStringify(value) {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function createCompiler(factory) {
  const cache = new Map();

  return function compileProcessor(def) {
    if (!def || !def.processor) return null;

    const cacheKey = Utils.simpleHash(stableStringify(def));
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const processorFactory = factory[def.processor];
    if (!processorFactory) return null;

    const processor = processorFactory(def.params || {}, compileProcessor);
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

        const cacheKey = requestMeta.hostname || requestMeta.url;

        if (self._memoizedMatches.has(cacheKey)) {
          return self._memoizedMatches.get(cacheKey);
        }

        let ids = null;

        if (self._findByPrefix && requestMeta.hostname) {
          try {
            const result = self._findByPrefix(requestMeta.hostname);
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

function prepareRegexReplacements(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.map(r => ({
    pattern: RegexPool.get(r.pattern, r.flags || 'g'),
    replacement: r.replacement
  }));
}

function prepareGameResources(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.map(r => ({
    field: r.field,
    value: r.value,
    pattern: RegexPool.get(`"${r.field}":\\d+`, 'g')
  }));
}

function prepareHtmlReplacements(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.map(r => ({
    pattern: RegexPool.get(r.pattern, r.flags || 'gi'),
    replacement: r.replacement
  }));
}

function prepareHtmlMarkers(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.filter(Boolean).map(m => String(m));
}

function buildPreparedMeta(config) {
  return {
    mode: config && config.mode ? String(config.mode) : '',
    hasProcessor: typeof config._processor === 'function' || !!config.processor,
    hasRegex: Array.isArray(config._regexReplacements) ? config._regexReplacements.length > 0 : Array.isArray(config.regexReplacements) && config.regexReplacements.length > 0,
    hasGame: Array.isArray(config._gameResources) ? config._gameResources.length > 0 : Array.isArray(config.gameResources) && config.gameResources.length > 0,
    hasHtml: Array.isArray(config._htmlReplacements) ? config._htmlReplacements.length > 0 : Array.isArray(config.htmlReplacements) && config.htmlReplacements.length > 0,
    hasHtmlMarkers: Array.isArray(config._htmlMarkers) ? config._htmlMarkers.length > 0 : Array.isArray(config.htmlMarkers) && config.htmlMarkers.length > 0
  };
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

  _rememberPrepared(versionedId, prepared) {
    this._memCache.set(versionedId, { t: Date.now(), d: prepared });
    return prepared;
  }

  _ensurePrepared(configLike) {
    if (!configLike || typeof configLike !== 'object') return configLike;
    if (configLike._prepared === true) return configLike;
    return this._prepareConfig(configLike);
  }

  async load(configId, remoteVersion) {
    const versionedId = this._versionedId(configId);

    const memHit = this._memCache.get(versionedId);
    if (memHit) {
      return this._ensurePrepared(memHit.d);
    }

    const cached = Storage.readConfig(versionedId);
    if (cached) {
      try {
        const { d } = JSON.parse(cached);
        return this._rememberPrepared(versionedId, this._ensurePrepared(d));
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

      return this._rememberPrepared(versionedId, this._prepareConfig(fresh));

    } catch (e) {
      Logger.error('ConfigLoader', `${configId} failed: ${e.message}`);

      if (cached) {
        Logger.warn('ConfigLoader', `${configId} using stale cache`);
        const { d } = JSON.parse(cached);
        return this._rememberPrepared(versionedId, this._ensurePrepared(d));
      }
      throw e;
    }
  }

  _prepareConfig(raw) {
    const config = Object.assign({}, raw);

    if (config._prepared === true) {
      if (!config._meta) config._meta = buildPreparedMeta(config);
      return config;
    }

    if (config.mode === 'forward' || config.mode === 'remote') {
      config._meta = buildPreparedMeta(config);
      config._prepared = true;
      return config;
    }

    if (config.processor && !config._processor) {
      try {
        config._processor = this._compiler(config.processor);
        config.processor = null;
      } catch (e) {}
    }

    if (!config._regexReplacements && raw.regexReplacements) {
      config._regexReplacements = prepareRegexReplacements(raw.regexReplacements);
      config.regexReplacements = null;
    }

    if (!config._gameResources && raw.gameResources) {
      config._gameResources = prepareGameResources(raw.gameResources);
      config.gameResources = null;
    }

    if (!config._htmlReplacements && raw.htmlReplacements) {
      config._htmlReplacements = prepareHtmlReplacements(raw.htmlReplacements);
      config.htmlReplacements = null;
    }

    if (!config._htmlMarkers && Array.isArray(raw.htmlMarkers)) {
      config._htmlMarkers = prepareHtmlMarkers(raw.htmlMarkers);
      config.htmlMarkers = null;
    }

    config._meta = buildPreparedMeta(config);
    config._prepared = true;
    return config;
  }
}

class Environment {
  constructor(name, presetMeta) {
    this.name = name;
    this.isQX = true;

    this.response = (typeof $response !== 'undefined') ? $response : {};
    this.request = (typeof $request !== 'undefined') ? $request : {};

    if (!this.request.url && this.response && this.response.request) {
      this.request = this.response.request;
    }

    this._meta = presetMeta || null;
    this._url = presetMeta && presetMeta.url ? String(presetMeta.url) : null;
  }

  _ensureMeta() {
    if (this._meta) return this._meta;

    let url = (this.response && this.response.url) || (this.request && this.request.url) || '';
    if (typeof $request === 'string') {
      url = $request;
    }
    url = url ? url.toString() : '';

    let hostname = '';
    let pathname = '';
    let search = '';
    try {
      const parsed = new URL(url);
      hostname = (parsed.hostname || '').toLowerCase();
      pathname = parsed.pathname || '';
      search = parsed.search || '';
    } catch (e) {}

    const headers = (this.response && this.response.headers) || (this.request && this.request.headers) || {};
    let contentType = '';
    for (const [k, v] of Object.entries(headers || {})) {
      if (String(k).toLowerCase() === 'content-type') {
        contentType = String(v || '');
        break;
      }
    }

    this._url = url;
    this._meta = {
      url,
      hostname,
      pathname,
      search,
      method: (this.request && this.request.method) ? String(this.request.method).toUpperCase() : '',
      hasResponse: !!(this.response && Object.keys(this.response).length),
      contentType
    };
    return this._meta;
  }

  getUrl() {
    if (this._url != null) return this._url;
    return this._ensureMeta().url || '';
  }

  getHostname() {
    return this._ensureMeta().hostname || '';
  }

  getPathname() {
    return this._ensureMeta().pathname || '';
  }

  getSearch() {
    return this._ensureMeta().search || '';
  }

  getContentType() {
    return this._ensureMeta().contentType || '';
  }

  isResponsePhase() {
    return !!this._ensureMeta().hasResponse;
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

  _resolveRuntimeMeta(config) {
    const meta = (config && config._meta && typeof config._meta === 'object') ? config._meta : {};
    return {
      mode: meta.mode || config.mode || '',
      hasRegex: meta.hasRegex !== undefined ? !!meta.hasRegex : !!((config._regexReplacements || config.regexReplacements || []).length),
      hasGame: meta.hasGame !== undefined ? !!meta.hasGame : !!((config._gameResources || config.gameResources || []).length),
      hasHtml: meta.hasHtml !== undefined ? !!meta.hasHtml : !!((config._htmlReplacements || config.htmlReplacements || []).length),
      hasHtmlMarkers: meta.hasHtmlMarkers !== undefined ? !!meta.hasHtmlMarkers : !!((config._htmlMarkers || config.htmlMarkers || []).length)
    };
  }

  async process(body, config) {
    const normalizedBody = typeof body === 'string' ? body : Utils.safeJsonStringify(body || {});
    const runtimeMeta = this._resolveRuntimeMeta(config || {});

    if (!config || !runtimeMeta.mode) {
      return { body: normalizedBody };
    }

    if (runtimeMeta.mode === 'forward') {
      return await this._processForward(config);
    }
    if (runtimeMeta.mode === 'remote') {
      return await this._processRemote(config);
    }

    if (!normalizedBody) return { body: '{}' };

    const contentType = this.env && this.env.getContentType ? String(this.env.getContentType() || '').toLowerCase() : '';

    switch (runtimeMeta.mode) {
      case 'json':
        if (!this._looksLikeJsonBody(normalizedBody, contentType)) return { body: normalizedBody };
        return this._processJson(normalizedBody, config);
      case 'regex':
        if (!runtimeMeta.hasRegex) return { body: normalizedBody };
        return this._processRegex(normalizedBody, config);
      case 'game':
        if (!runtimeMeta.hasGame) return { body: normalizedBody };
        return this._processGame(normalizedBody, config);
      case 'hybrid':
        return this._processHybrid(normalizedBody, config, contentType);
      case 'html':
        if (!runtimeMeta.hasHtml) return { body: normalizedBody };
        if (!this._looksLikeHtmlBody(normalizedBody, contentType) && !runtimeMeta.hasHtmlMarkers) return { body: normalizedBody };
        return this._processHtml(normalizedBody, config);
      default:
        return { body: normalizedBody };
    }
  }

  _looksLikeJsonBody(body, contentType) {
    if (!body) return false;
    const firstChar = body[0];
    if (firstChar === '{' || firstChar === '[') return true;
    return contentType.includes('json') || contentType.includes('+json');
  }

  _looksLikeHtmlBody(body, contentType) {
    if (!body) return false;
    if (body.indexOf('<') >= 0) return true;
    return contentType.includes('html') || contentType.includes('xml') || contentType.includes('text/');
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

  _processHybrid(body, config, contentType) {
    let result = this._looksLikeJsonBody(body, contentType || '')
      ? this._processJson(body, config)
      : { body };

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

function diagnose(urlToTest){const testUrls=urlToTest?[urlToTest]:["https://yz1018.6vh3qyu9x.com/v2/api/basic/init","https://www.v2ex.com/t/1201518","https://api.gotokeep.com/nuocha/plans"];console.log("\nUnifiedVIP 诊断工具 v22.0.0");for(const url of testUrls){try{const hostname=new URL(url).hostname;console.log("URL:",url,"HOST:",hostname);const result=typeof findByPrefix==='function'?findByPrefix(hostname):null;console.log("prefix:",result||'null')}catch(e){console.log("error:",e.message)}}return {success:true}}

async function main(){
  const rid=Math.random().toString(36).substr(2,6).toUpperCase();
  try{
    const resp=(typeof $response!=='undefined'&&$response)?$response:null;
    const doneFallback=()=>$done(resp?{body:resp.body}:{});
    let u='';
    const req=(typeof $request!=='undefined')?$request:null;
    if(req)u=typeof req==='string'?req:req.url||'';
    else if(resp)u=resp.url||'';
    if(!u)return doneFallback();

    let meta={url:u,hostname:'',pathname:'',search:'',method:req&&typeof req==='object'&&req.method?String(req.method).toUpperCase():'',hasResponse:!!resp,contentType:''};
    try{
      const p=new URL(u);
      meta.hostname=(p.hostname||'').toLowerCase();
      meta.pathname=p.pathname||'';
      meta.search=p.search||'';
    }catch(e){}
    const headers=(resp&&resp.headers)||(req&&typeof req==='object'&&req.headers)||{};
    for(const k in headers){if(String(k).toLowerCase()==='content-type'){meta.contentType=String(headers[k]||'');break}}

    Logger.debug('Main',rid+'|'+(meta.pathname||u.split('?')[0]).substring(0,60));

    const g = (typeof globalThis !== 'undefined') ? globalThis : {};
    const ml = g.__UVIP_ML || (g.__UVIP_ML = new SimpleManifestLoader('GLOBAL'));
    const mf = g.__UVIP_MF || (g.__UVIP_MF = await ml.load());
    const cid = mf.findMatch(meta.url, meta);

    if(!cid){
      Logger.debug('Main','No match');
      return doneFallback();
    }

    const cl = g.__UVIP_CL || (g.__UVIP_CL = new SimpleConfigLoader('GLOBAL'));
    const cfg = await cl.load(cid,mf.getConfigVersion(cid));
    const env=new Environment(META.name,meta);

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
