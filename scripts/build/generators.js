const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateHeaderMinified({ BUILD_CONFIG, APP_REGISTRY }) {
  const debugFlag = BUILD_CONFIG.DEBUG_MODE ? 'true' : 'false';
  const verboseFlag = BUILD_CONFIG.DEBUG_MODE ? 'true' : 'false';

  return `/*
 * ==========================================
 * Unified VIP Unlock Manager v${BUILD_CONFIG.VERSION}
 * 构建时间: ${new Date().toISOString()}
 * APP数量: ${Object.keys(APP_REGISTRY).length}
 * ==========================================
 *
 * 订阅规则: https://joeshu.github.io/UnifiedVIP/rewrite.conf
${BUILD_CONFIG.ENABLE_DIAGNOSE ? ' * 诊断功能: 在 QX 控制台运行 diagnose() 查看详细匹配信息' : ''}
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
  DEBUG: ${debugFlag},
  VERBOSE_PATTERN_LOG: ${verboseFlag},

  URL_CACHE_KEY: 'url_match_v22_lazy',
  URL_CACHE_META_KEY: 'url_match_v22_lazy_meta',
  URL_CACHE_MIGRATED_KEY: 'url_match_v22_lazy_migrated',
  URL_CACHE_LEGACY_KEYS: ['url_match_v22', 'url_match_v21_lazy', 'url_match_cache_v22'],
  URL_CACHE_TTL_MS: 60 * 60 * 1000,
  URL_CACHE_PERSIST_INTERVAL_MS: 15 * 1000,
  URL_CACHE_LIMIT: 50
};

const META = { name: 'UnifiedVIP', version: '${BUILD_CONFIG.VERSION}' };`;
}

function generateManifestOneLine({ APP_REGISTRY, CONFIGS_DIR, BUILD_CONFIG }) {
  // 轻量 Manifest：只保留 URL 匹配所需的最小字段
  // 完整配置从远程 configs/{id}.json 按需加载
  const configs = {};
  for (const [id, baseCfg] of Object.entries(APP_REGISTRY)) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        configs[id] = {
          name: config.name || id,
          urlPattern: config.urlPattern
        };
        if (config.mode) configs[id].mode = config.mode;
      } catch (e) {
        configs[id] = { name: id, urlPattern: baseCfg.urlPattern };
      }
    } else {
      configs[id] = { name: id, urlPattern: baseCfg.urlPattern };
    }
  }

  const manifestSourceHash = crypto
    .createHash('md5')
    .update(JSON.stringify(configs))
    .digest('hex')
    .slice(0, 8);

  return JSON.stringify({
    version: `${BUILD_CONFIG.VERSION}-${manifestSourceHash}`,
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(configs).length,
    configs
  });
}

function generatePrefixIndexCode(index) {
  const lines = ['const PREFIX_INDEX = {'];
  const emitGroup = (name, data, withComma = true) => {
    lines.push(` ${name}: {`);
    const entries = Object.entries(data || {});
    entries.forEach(([k, v], i) => {
      const comma = i < entries.length - 1 ? ',' : '';
      lines.push(`  '${k}': ${JSON.stringify(v)}${comma}`);
    });
    lines.push(withComma ? ' },' : ' }');
  };

  emitGroup('exact', index.exact || {});
  emitGroup('suffix', index.suffix || !(index.keyword && Object.keys(index.keyword).length));

  if (index.keyword && Object.keys(index.keyword).length > 0) {
    if (lines[lines.length - 1] === ' }') lines[lines.length - 1] = ' },';
    emitGroup('keyword', index.keyword || {}, false);
  }

  const suffixEntries = Object.entries(index.suffix || {})
    .sort((a, b) => b[0].length - a[0].length);

  // 反向后缀 Trie：com -> example -> api
  // 运行时从 hostname 右侧开始逐段匹配，替代线性 endsWith 扫描
  const suffixTrie = {};
  suffixEntries.forEach(([suffix, ids]) => {
    const parts = suffix.split('.').reverse();
    let node = suffixTrie;
    for (const p of parts) {
      if (!node[p]) node[p] = {};
      node = node[p];
    }
    node.$ = ids;
    node.$m = suffix;
  });

  const keywordEntries = Object.entries(index.keyword || {})
    .sort((a, b) => b[0].length - a[0].length);

  const keywordBuckets2 = {};
  keywordEntries.forEach(([kw, ids]) => {
    const k2 = (kw || '').slice(0, 2);
    if (k2.length < 2) return;
    if (!keywordBuckets2[k2]) keywordBuckets2[k2] = {};
    const lenKey = String(kw.length);
    if (!keywordBuckets2[k2][lenKey]) keywordBuckets2[k2][lenKey] = [];
    keywordBuckets2[k2][lenKey].push([kw, ids]);
  });

  lines.push('};');
  lines.push(`const PREFIX_KEYWORDS_BY_HEAD2=${JSON.stringify(keywordBuckets2)};`);
  lines.push('const HOST_MATCH_CACHE=new Map();');
  lines.push('const HOST_MATCH_CACHE_LIMIT=200;');
  lines.push('function hostCacheGet(h){if(!HOST_MATCH_CACHE.has(h))return undefined;const v=HOST_MATCH_CACHE.get(h);HOST_MATCH_CACHE.delete(h);HOST_MATCH_CACHE.set(h,v);return v}');
  lines.push('function hostCacheSet(h,v){if(HOST_MATCH_CACHE.has(h))HOST_MATCH_CACHE.delete(h);else if(HOST_MATCH_CACHE.size>=HOST_MATCH_CACHE_LIMIT){const k=HOST_MATCH_CACHE.keys().next().value;HOST_MATCH_CACHE.delete(k)}HOST_MATCH_CACHE.set(h,v)}');
  lines.push('function findBySuffixFast(h){const lastDot=h.lastIndexOf(".");if(lastDot<=0||lastDot>=h.length-1)return null;const prevDot=h.lastIndexOf(".",lastDot-1);const suffix=prevDot>=0?h.slice(prevDot+1):h;const ids=PREFIX_INDEX.suffix[suffix];return ids?{ids,method:"suffix",matched:suffix}:null}');
  lines.push(`function findByPrefix(hostname){const h=hostname.toLowerCase();const c=hostCacheGet(h);if(c!==undefined)return c;let out=null;if(PREFIX_INDEX.exact[h])out={ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};else{out=findBySuffixFast(h);if(!out){const seen2=Object.create(null);for(let i=0;i<h.length-1;i++){const a=h[i],b=h[i+1];if(a==='.'||a==='-'||a==='_')continue;if(b==='.'||b==='-'||b==='_')continue;const k2=a+b;if(seen2[k2])continue;seen2[k2]=1;const grouped=PREFIX_KEYWORDS_BY_HEAD2[k2];if(!grouped)continue;const lens=Object.keys(grouped).sort((x,y)=>Number(y)-Number(x));for(const lenKey of lens){if(Number(lenKey)>h.length)continue;for(const[kw,ids]of grouped[lenKey]){if(h.includes(kw)){out={ids,method:'keyword',matched:kw};break}}if(out)break}if(out)break}}}hostCacheSet(h,out);return out}`);
  return lines.join('\n');
}

function generateDiagnoseFunction(BUILD_CONFIG) {
  if (!BUILD_CONFIG.ENABLE_DIAGNOSE) return '';
  return `\n// ==========================================\n// 诊断函数 - 在 QX 控制台运行 diagnose()\n// ==========================================\nfunction diagnose(urlToTest){const testUrls=urlToTest?[urlToTest]:["https://yz1018.6vh3qyu9x.com/v2/api/basic/init","https://www.v2ex.com/t/1201518","https://api.gotokeep.com/nuocha/plans"];console.log("\\nUnifiedVIP 诊断工具 v${BUILD_CONFIG.VERSION}");for(const url of testUrls){try{const hostname=new URL(url).hostname;console.log("URL:",url,"HOST:",hostname);const result=typeof findByPrefix==='function'?findByPrefix(hostname):null;console.log("prefix:",result||'null')}catch(e){console.log("error:",e.message)}}return {success:true}}`;
}

function extractHostname(pattern) {
  if (!pattern || typeof pattern !== 'string') return null;
  // 简化处理：直接从 pattern 中提取域名
  // 模式通常是: ^https?:\/\/hostname 或 ^https?://hostname
  
  // 移除非域名部分
  let cleaned = pattern
    .replace(/^\^/, '')           // 移除开头的 ^
    .replace(/\$$/, '')           // 移除结尾的 $
    .replace(/^https\?\:/, '')    // 移除 https?:
    .replace(/^https:\/\//, '')   // 或 https://
    .replace(/^http:\/\//, '');   // 或 http://
  
  // 移除转义符序列
  cleaned = cleaned.replace(/\\\//g, '/');  // \/ -> /
  
  // 现在应该是 //hostname/... 格式
  if (cleaned.startsWith('//')) {
    cleaned = cleaned.slice(2);
  }
  
  // 提取第一个 / 之前的部分
  const slashIdx = cleaned.indexOf('/');
  if (slashIdx > 0) {
    cleaned = cleaned.slice(0, slashIdx);
  }
  
  // 移除可选分组 (?:www.)?
  cleaned = cleaned.replace(/^\(\?:www\.\)\?/, '');
  cleaned = cleaned.replace(/^www\./, '');
  
  // 处理转义点号: juyeye\.cc -> juyeye.cc
  cleaned = cleaned.replace(/\\\./g, '.');
  
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  return null;
}

function isQxSafeMitmHost(host) {
  if (!host || typeof host !== 'string') return false;
  const h = host.trim().toLowerCase();

  // 1) 精确 IPv4
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h)) return true;

  // 2) 精确域名
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;

  // 3) 左侧子域通配：*.example.com
  if (/^\*\.(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;

  // 4) 中间单段通配：prefix.*.tld（QX 实测可用）
  if (/^(?:[a-z0-9-]+\.)+\*\.(?:[a-z0-9-]+\.)*[a-z]{2,}$/.test(h)) return true;

  return false;
}

function generateRewriteConf({ BUILD_CONFIG, APP_REGISTRY, getAllConfigs, RULES_DIR }) {
  const autoHostSet = new Set();
  const observedHostSet = new Set();
  const hostSourceMap = new Map();
  
  function addHostWithSource(host, source) {
    const h = String(host || '').trim();
    if (!h) return;
    const prev = hostSourceMap.get(h);
    if (!prev) hostSourceMap.set(h, source);
    else if (!prev.split(' + ').includes(source)) hostSourceMap.set(h, `${prev} + ${source}`);
  }
  
  // 从 APP_REGISTRY 提取 hostname
  for (const cfg of Object.values(APP_REGISTRY)) {
    const host = extractHostname(cfg?.urlPattern);
    if (host) {
      autoHostSet.add(host);
      addHostWithSource(host, 'auto:urlPattern');
    }
  }
  
  // 从所有配置（包括纯 JSON 配置）提取 hostname + 显式 mitmHosts
  let allConfigs = {};
  try { allConfigs = getAllConfigs(); } catch (e) {}
  for (const cfg of Object.values(allConfigs)) {
    const host = extractHostname(cfg?.urlPattern);
    if (host) {
      autoHostSet.add(host);
      addHostWithSource(host, 'auto:urlPattern');
    }

    if (Array.isArray(cfg?.mitmHosts)) {
      for (const h of cfg.mitmHosts) {
        if (typeof h === 'string' && h.trim()) {
          const normalized = h.trim();
          autoHostSet.add(normalized);
          addHostWithSource(normalized, 'config:mitmHosts');
        }
      }
    }
  }

  const manualHosts = [
    'juyeye.cc','*.juyeye.cc','55d6b4o1m2.shop','www.55d6b4o1m2.shop','59.82.99.78','*.ipalfish.com','service.hhdd.com','apis.lifeweek.com.cn','fluxapi.vvebo.vip','res5.haotgame.com',
    'jsq.mingcalc.cn','theater-api.sylangyue.xyz','api.iappdaily.com','api2.tophub.today','api2.tophub.app','api3.tophub.xyz','du.baicizhan.com',
    'api3.tophub.today','api3.tophub.app','tophub.tophubdata.com','tophub2.tophubdata.com','tophub.idaily.today','tophub2.idaily.today',
    'tophub.remai.today','tophub.iappdaiy.com','tophub.ipadown.com','service.gpstool.com','mapi.kouyuxingqiu.com','ss.landintheair.com',
    '*.v2ex.com','v2ex.com','apis.folidaymall.com','gateway-api.yizhilive.com','pagead*.googlesyndication.com','api.gotokeep.com','kit.gotokeep.com',
    '*.gotokeep.*','120.53.74.*','162.14.5.*','42.187.199.*','101.42.124.*','javelin.mandrillvr.com','api.banxueketang.com',
    'yzy0916.*.com','yz1018.*.com','yz250907.*.com','yz0320.*.com','cfvip.*.com','yr-game-api.feigo.fun','star.jvplay.cn','iotpservice.smartont.net'
  ];
  manualHosts.forEach(h => addHostWithSource(h, 'manual:list'));

  // 从规则文件读取观测到的动态域名（仅 QX-safe 会生效）
  const observedHostsPath = path.join(RULES_DIR, 'mitm-observed.txt');
  if (fs.existsSync(observedHostsPath)) {
    const observedHosts = fs.readFileSync(observedHostsPath, 'utf8')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('#'));
    for (const h of observedHosts) {
      observedHostSet.add(h);
      addHostWithSource(h, 'observed:file');
    }
  }

  const allCandidateHosts = Array.from(new Set([
    ...manualHosts,
    ...Array.from(autoHostSet),
    ...Array.from(observedHostSet)
  ])).map(h => String(h || '').trim()).filter(Boolean);

  const hostnames = allCandidateHosts
    .filter(h => h && isQxSafeMitmHost(h))
    .sort();

  const filteredOutHosts = allCandidateHosts
    .filter(h => h && !isQxSafeMitmHost(h))
    .sort();

  const reportPath = path.join(RULES_DIR, '../dist/mitm-filter-report.md');
  const report = [
    '# MITM 过滤报告',
    '',
    `- 总候选: ${allCandidateHosts.length}`,
    `- QX-safe 保留: ${hostnames.length}`,
    `- 过滤掉: ${filteredOutHosts.length}`,
    ''
  ];
  if (observedHostSet.size > 0) {
    report.push(`- 观测文件命中: ${observedHostSet.size}`);
    report.push('');
  }
  report.push('## Host 来源摘要');
  report.push('');
  report.push('| Host | Source |');
  report.push('| --- | --- |');
  hostnames.forEach(h => report.push(`| ${h} | ${hostSourceMap.get(h) || 'unknown'} |`));
  report.push('');
  if (filteredOutHosts.length > 0) {
    report.push('## 被过滤的 hosts');
    report.push('');
    filteredOutHosts.forEach(h => report.push(`- ${h}${hostSourceMap.get(h) ? ` ← ${hostSourceMap.get(h)}` : ''}`));
  } else {
    report.push('## 被过滤的 hosts');
    report.push('');
    report.push('- (无)');
  }
  fs.writeFileSync(reportPath, report.join('\n'));
  let conf = `# Unified VIP Unlock Manager v${BUILD_CONFIG.VERSION}\n# 构建时间: ${new Date().toISOString()}\n# APP数量: ${Object.keys(APP_REGISTRY).length}\n\n[rewrite_local]\n\n`;

  // 获取完整配置（用于显示名称）
  let nameLookup = {};
  try { nameLookup = getAllConfigs(); } catch (e) {
    for (const [id, cfg] of Object.entries(APP_REGISTRY)) nameLookup[id] = { name: id, ...cfg };
  }

  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    const name = nameLookup[id]?.name || id;
    conf += `# ${name}\n${cfg.urlPattern} url script-response-body https://joeshu.github.io/UnifiedVIP/Unified_VIP_Unlock_Manager_v22.js\n\n`;
  }

  const customRejectPath = path.join(RULES_DIR, 'custom-reject.txt');
  if (fs.existsSync(customRejectPath)) {
    const customRules = fs.readFileSync(customRejectPath, 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#')).map(s => s.includes(' url ') ? s : `${s} url reject-dict`);
    if (customRules.length > 0) conf += `# custom reject\n${customRules.join('\n')}\n\n`;
  }

  conf += `[mitm]\nhostname = ${hostnames.join(', ')}\n`;
  return conf;
}

module.exports = {
  generateHeaderMinified,
  generateManifestOneLine,
  generatePrefixIndexCode,
  generateDiagnoseFunction,
  generateRewriteConf
};
