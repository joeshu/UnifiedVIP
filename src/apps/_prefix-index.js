// src/apps/_prefix-index.js
// 前缀索引生成器 - 修复版（支持短关键字如 yz, tv 等）

const { getAllConfigs } = require('./_index');

// ==========================================
// 强制包含的关键字（不受长度限制）
// ==========================================
const FORCED_KEYWORDS = {
  'yz': ['tv'],              // yz1018, yzy0916 等域名
  'tv': ['tv'],              // 备用
  'v2ex': ['v2ex'],          // v2ex 域名
  'vvebo': ['vvebo'],        // vvebo 域名
  'slzd': ['slzd'],          // 三联中读
  'kyxq': ['kyxq'],          // 口语星球
  'mhlz': ['mhlz'],          // 梦幻量子
  'xjsm': ['xjsm'],          // 小精灵去水印
  'bqwz': ['bqwz'],          // 比趣王者
  'qmj': ['qmjyzc'],         // 趣谜局
  'bxkt': ['bxkt'],          // 伴学课堂
  'cyljy': ['cyljy'],        // 次元领域
  'wohome': ['wohome'],      // 我家智能
  'kada': ['kada'],          // Kada故事
  'ipalfish': ['ipalfish'],  // 伴鱼绘本
  'gps': ['gps'],            // GPS工具箱
  'iapp': ['iappdaily'],     // iAppDaily
  'sylangyue': ['sylangyue'], // 三联中读剧场
  'mingcalc': ['mingcalc'],  // 明计算
  'qiujing': ['qiujingapp'], // 趣鲸App
  'foday': ['foday'],        // Foday
  'zhenti': ['zhenti']       // 真题伴侣
};

// ==========================================
// 排除列表（这些不会作为关键字）
// ==========================================
const EXCLUDE_LIST = [
  'api', 'www', 'm', 'mobile', 'app', 
  'v1', 'v2', 'v3', 'service', 
  'com', 'cn', 'net', 'org', 
  'http', 'https', 'www'
];

// ==========================================
// 生成前缀索引
// ==========================================
function generatePrefixIndex() {
  const index = {
    exact: {},
    suffix: {},
    keyword: {}
  };

  // 1. 先添加强制关键字
  for (const [kw, ids] of Object.entries(FORCED_KEYWORDS)) {
    index.keyword[kw] = [...ids]; // 复制数组
  }

  // 2. 从 configs 自动提取
  const allConfigs = getAllConfigs();

  for (const [id, cfg] of Object.entries(allConfigs)) {
    const pattern = cfg.urlPattern;
    if (!pattern) continue;

    // 提取域名
    const domainMatches = pattern.match(/[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/gi);
    if (!domainMatches) continue;

    for (const domain of domainMatches) {
      const parts = domain.toLowerCase().split('.');

      if (parts.length >= 3) {
        // 三级域名 → exact
        if (!index.exact[domain]) {
          index.exact[domain] = [];
        }
        if (!index.exact[domain].includes(id)) {
          index.exact[domain].push(id);
        }

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

      // 提取关键字（修复：降低长度限制到 2）
      const keywords = parts.filter(p => {
        // 强制包含的关键字（不受限制）
        if (FORCED_KEYWORDS[p]) return true;
        
        // 其他关键字：长度 >= 2（原来是 4），且不在排除列表中
        return p.length >= 2 && !EXCLUDE_LIST.includes(p);
      });

      for (const kw of keywords) {
        if (!index.keyword[kw]) {
          index.keyword[kw] = [id];
        } else if (!index.keyword[kw].includes(id)) {
          index.keyword[kw].push(id);
        }
      }
    }
  }

  return index;
}

// ==========================================
// 调试函数：打印索引统计
// ==========================================
function printIndexStats(index) {
  console.log('前缀索引统计:');
  console.log(`  exact: ${Object.keys(index.exact).length} 个`);
  console.log(`  suffix: ${Object.keys(index.suffix).length} 个`);
  console.log(`  keyword: ${Object.keys(index.keyword).length} 个`);
  
  console.log('\n关键字示例:');
  const samples = ['yz', 'v2ex', 'tv', 'keep', 'com'];
  for (const kw of samples) {
    if (index.keyword[kw]) {
      console.log(`  ${kw}: ${JSON.stringify(index.keyword[kw])}`);
    } else {
      console.log(`  ${kw}: (不存在)`);
    }
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    generatePrefixIndex,
    printIndexStats,
    FORCED_KEYWORDS
  };
}
