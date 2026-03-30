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
  const configs = {};
  for (const [id, baseCfg] of Object.entries(APP_REGISTRY)) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        // 包含基础字段
        configs[id] = { 
          name: config.name || id, 
          urlPattern: config.urlPattern 
        };
        // html 模式：包含 mode, htmlMarkers, htmlReplacements
        if (config.mode === 'html') {
          configs[id].mode = 'html';
          if (config.htmlMarkers) configs[id].htmlMarkers = config.htmlMarkers;
          if (config.htmlReplacements) configs[id].htmlReplacements = config.htmlReplacements;
          if (config.blockHosts) configs[id].blockHosts = config.blockHosts;
        }
        // forward/remote 模式：包含 mode 和相应字段
        if (config.mode === 'forward' || config.mode === 'remote') {
          configs[id].mode = config.mode;
          if (config.forwardUrl) configs[id].forwardUrl = config.forwardUrl;
          if (config.forwardHeaders) configs[id].forwardHeaders = config.forwardHeaders;
          if (config.forwardMethod) configs[id].forwardMethod = config.forwardMethod;
          if (config.forwardBody) configs[id].forwardBody = config.forwardBody;
          if (config.statusTexts) configs[id].statusTexts = config.statusTexts;
        }
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

  lines.push('};');
  lines.push(`function findByPrefix(hostname){const h=hostname.toLowerCase();if(PREFIX_INDEX.exact[h])return{ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};for(const[suffix,ids]of Object.entries(PREFIX_INDEX.suffix))if(h.endsWith('.'+suffix)||h===suffix)return{ids,method:'suffix',matched:suffix};if(PREFIX_INDEX.keyword)for(const[kw,ids]of Object.entries(PREFIX_INDEX.keyword))if(h.includes(kw))return{ids,method:'keyword',matched:kw};return null}`);
  return lines.join('\n');
}

function generateDiagnoseFunction(BUILD_CONFIG) {
  if (!BUILD_CONFIG.ENABLE_DIAGNOSE) return '';
  return `\n// ==========================================\n// 诊断函数 - 在 QX 控制台运行 diagnose()\n// ==========================================\nfunction diagnose(urlToTest){const testUrls=urlToTest?[urlToTest]:["https://yz1018.6vh3qyu9x.com/v2/api/basic/init","https://www.v2ex.com/t/1201518","https://api.gotokeep.com/nuocha/plans"];console.log("\\nUnifiedVIP 诊断工具 v${BUILD_CONFIG.VERSION}");for(const url of testUrls){try{const hostname=new URL(url).hostname;console.log("URL:",url,"HOST:",hostname);const result=typeof findByPrefix==='function'?findByPrefix(hostname):null;console.log("prefix:",result||'null')}catch(e){console.log("error:",e.message)}}return {success:true}}`;
}

function generateRewriteConf({ BUILD_CONFIG, APP_REGISTRY, getAllConfigs, RULES_DIR }) {
  const autoHostSet = new Set();
  for (const cfg of Object.values(APP_REGISTRY)) {
    if (!cfg || !cfg.urlPattern || typeof cfg.urlPattern !== 'string') continue;
    // 提取 hostname 部分：// 之后到 / 之前的部分
    const normalizedPattern = cfg.urlPattern.replace(/\\./g, '.');
    // 匹配 //hostname/ 或 //hostname$ 格式
    const hostMatch = normalizedPattern.match(/\/\/([^\/]+)/);
    if (!hostMatch) continue;
    const hostPart = hostMatch[1];
    // 去除可选的 www. 前缀和 (?:www.)? 等分组
    const cleanHost = hostPart.replace(/^\(\?:www\.\)\?/, '').replace(/^www\./, '');
    if (!cleanHost) continue;
    // 验证是合法域名格式
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanHost)) {
      autoHostSet.add(cleanHost.toLowerCase());
    }
  }

  const manualHosts = [
    '59.82.99.78','*.ipalfish.com','service.hhdd.com','apis.lifeweek.com.cn','fluxapi.vvebo.vip','res5.haotgame.com',
    'jsq.mingcalc.cn','theater-api.sylangyue.xyz','api.iappdaily.com','api2.tophub.today','api2.tophub.app','api3.tophub.xyz',
    'api3.tophub.today','api3.tophub.app','tophub.tophubdata.com','tophub2.tophubdata.com','tophub.idaily.today','tophub2.idaily.today',
    'tophub.remai.today','tophub.iappdaiy.com','tophub.ipadown.com','service.gpstool.com','mapi.kouyuxingqiu.com','ss.landintheair.com',
    '*.v2ex.com','v2ex.com','apis.folidaymall.com','gateway-api.yizhilive.com','pagead*.googlesyndication.com','api.gotokeep.com','kit.gotokeep.com',
    '*.gotokeep.*','120.53.74.*','162.14.5.*','42.187.199.*','101.42.124.*','javelin.mandrillvr.com','api.banxueketang.com',
    'yzy0916.*.com','yz1018.*.com','yz250907.*.com','yz0320.*.com','cfvip.*.com','yr-game-api.feigo.fun','star.jvplay.cn','iotpservice.smartont.net'
  ];

  const hostnames = Array.from(new Set([...manualHosts, ...Array.from(autoHostSet)])).sort();
  let conf = `# Unified VIP Unlock Manager v${BUILD_CONFIG.VERSION}\n# 构建时间: ${new Date().toISOString()}\n# APP数量: ${Object.keys(APP_REGISTRY).length}\n\n[rewrite_local]\n\n`;

  let allConfigs = {};
  try { allConfigs = getAllConfigs(); } catch (e) {
    for (const [id, cfg] of Object.entries(APP_REGISTRY)) allConfigs[id] = { name: id, ...cfg };
  }

  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    const name = allConfigs[id]?.name || id;
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
