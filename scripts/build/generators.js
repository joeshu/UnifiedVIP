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

  const keywordEntries = Object.entries(index.keyword || {})
    .sort((a, b) => b[0].length - a[0].length);

  lines.push('};');
  lines.push(`const PREFIX_KEYWORDS=${JSON.stringify(keywordEntries)};`);
  lines.push(`function findByPrefix(hostname){const h=hostname.toLowerCase();if(PREFIX_INDEX.exact[h])return{ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};for(const[suffix,ids]of Object.entries(PREFIX_INDEX.suffix))if(h.endsWith('.'+suffix)||h===suffix)return{ids,method:'suffix',matched:suffix};for(const[kw,ids]of PREFIX_KEYWORDS)if(h.includes(kw))return{ids,method:'keyword',matched:kw};return null}`);
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

function generateRewriteConf({ BUILD_CONFIG, APP_REGISTRY, getAllConfigs, RULES_DIR }) {
  const autoHostSet = new Set();
  
  // 从 APP_REGISTRY 提取 hostname
  for (const cfg of Object.values(APP_REGISTRY)) {
    const host = extractHostname(cfg?.urlPattern);
    if (host) autoHostSet.add(host);
  }
  
  // 从所有配置（包括纯 JSON 配置）提取 hostname + 显式 mitmHosts
  let allConfigs = {};
  try { allConfigs = getAllConfigs(); } catch (e) {}
  for (const cfg of Object.values(allConfigs)) {
    const host = extractHostname(cfg?.urlPattern);
    if (host) autoHostSet.add(host);

    if (Array.isArray(cfg?.mitmHosts)) {
      for (const h of cfg.mitmHosts) {
        if (typeof h === 'string' && h.trim()) autoHostSet.add(h.trim());
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

  const hostnames = Array.from(new Set([...manualHosts, ...Array.from(autoHostSet)])).sort();
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
