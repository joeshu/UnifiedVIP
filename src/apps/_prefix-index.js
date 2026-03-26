// src/apps/_prefix-index.js
// 智能前缀索引 - 从APP_REGISTRY自动生成

const { APP_REGISTRY } = require('./_index');

/**
 * 从urlPattern提取域名特征
 */
function extractDomainFeatures(urlPattern) {
  const features = {
    exact: [],
    suffix: [],
    keyword: []
  };

  // 清理正则语法，提取域名
  const cleanPattern = urlPattern
    .replace(/\\\./g, '.')
    .replace(/\\\/\//g, '//')
    .replace(/\(\?:/g, '(')
    .replace(/\[.*?\]/g, '')
    .replace(/\{.*?\}/g, '')
    .replace(/[\\^$+?()|]/g, ' ')
    .replace(/\s+/g, ' ');

  const domainMatches = cleanPattern.match(/[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/gi) || [];
  
  for (const domain of domainMatches) {
    const parts = domain.toLowerCase().split('.').filter(p => p && !p.match(/^\d+$/));
    if (parts.length < 2) continue;

    if (parts.length >= 3) {
      const fullDomain = parts.slice(-3).join('.');
      if (!features.exact.includes(fullDomain)) {
        features.exact.push(fullDomain);
      }
      const suffix = parts.slice(-2).join('.');
      if (!features.suffix.includes(suffix)) {
        features.suffix.push(suffix);
      }
    } else {
      const suffix = parts.slice(-2).join('.');
      if (!features.suffix.includes(suffix)) {
        features.suffix.push(suffix);
      }
    }
    
    const keywords = parts.filter(p => 
      !['api', 'www', 'm', 'mobile', 'app', 'v1', 'v2', 'v3', 'service', 'gateway'].includes(p) &&
      p.length >= 3
    );
    features.keyword.push(...keywords);
  }

  features.exact = [...new Set(features.exact)];
  features.suffix = [...new Set(features.suffix)];
  features.keyword = [...new Set(features.keyword)].slice(0, 2);

  return features;
}

/**
 * 手动覆盖规则
 */
const MANUAL_OVERRIDES = {
  tophub: {
    suffix: [
      'tophub.xyz',
      'tophub.today',
      'tophub.app',
      'tophubdata.com',
      'idaily.today',
      'remai.today',
      'iappdaiy.com',
      'ipadown.com'
    ],
    keyword: ['tophub']
  },
  tv: {
    keyword: ['yz', 'cfvip']
  }
};

/**
 * 生成前缀索引
 */
function generatePrefixIndex() {
  const index = {
    exact: {},
    suffix: {},
    keyword: {}
  };

  for (const [appId, config] of Object.entries(APP_REGISTRY)) {
    // 应用手动覆盖
    if (MANUAL_OVERRIDES[appId]) {
      const override = MANUAL_OVERRIDES[appId];
      if (override.exact) {
        override.exact.forEach(d => { if (!index.exact[d]) index.exact[d] = [appId]; });
      }
      if (override.suffix) {
        override.suffix.forEach(d => { if (!index.suffix[d]) index.suffix[d] = [appId]; });
      }
      if (override.keyword) {
        override.keyword.forEach(k => { if (!index.keyword[k]) index.keyword[k] = [appId]; });
      }
      continue;
    }

    // 自动提取
    const features = extractDomainFeatures(config.urlPattern);
    
    features.exact.forEach(domain => {
      if (!index.exact[domain]) index.exact[domain] = [appId];
      else if (!index.exact[domain].includes(appId)) index.exact[domain].push(appId);
    });

    features.suffix.forEach(domain => {
      if (!index.suffix[domain]) index.suffix[domain] = [appId];
      else if (!index.suffix[domain].includes(appId)) index.suffix[domain].push(appId);
    });

    const bestKw = features.keyword.sort((a, b) => a.length - b.length)[0];
    if (bestKw && !index.keyword[bestKw]) {
      index.keyword[bestKw] = [appId];
    }
  }

  return index;
}

/**
 * 生成构建时代码
 */
function generatePrefixIndexCode() {
  const index = generatePrefixIndex();
  
  return `// ==========================================
// 2. 智能前缀索引（构建时自动生成）
// ==========================================
const PREFIX_INDEX = ${JSON.stringify(index, null, 2)};

/**
 * 三级前缀匹配：exact > suffix > keyword
 */
function findByPrefix(hostname) {
  const h = hostname.toLowerCase();
  
  // L1: 精确匹配
  if (PREFIX_INDEX.exact[h]) {
    return { ids: PREFIX_INDEX.exact[h], method: 'exact', matched: h };
  }
  
  // L2: 后缀匹配
  for (const [suffix, ids] of Object.entries(PREFIX_INDEX.suffix)) {
    if (h.endsWith('.' + suffix) || h === suffix) {
      return { ids, method: 'suffix', matched: suffix };
    }
  }
  
  // L3: 关键字匹配
  for (const [kw, ids] of Object.entries(PREFIX_INDEX.keyword)) {
    if (h.includes(kw)) {
      return { ids, method: 'keyword', matched: kw };
    }
  }
  
  return null;
}`;
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    generatePrefixIndex, 
    generatePrefixIndexCode,
    extractDomainFeatures,
    MANUAL_OVERRIDES
  };
}
