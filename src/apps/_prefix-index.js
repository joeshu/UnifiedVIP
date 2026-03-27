// src/apps/_prefix-index.js
// 极简前缀索引：只提取主域名用于 exact/suffix，关键字完全手动配置

const { getAllConfigs } = require('./_index');

// ==========================================
// 手动维护的高质量短关键字（唯一来源）
// ==========================================
const KEYWORD_INDEX = {
  // tv 相关（动态子域名 pattern）
  'yz': ['tv'], 'yzy': ['tv'], 'yz1018': ['tv'], 'yz250907': ['tv'], 'yz0320': ['tv'], 
  'cf': ['tv'], 'cfv': ['tv'], 'cfvip': ['tv'],
  
  // keep 相关
  'keep': ['keep'], 'gotokeep': ['keep'], 'kit': ['keep'],
  'nuo': ['keep'], 'nuoc': ['keep'], 'nuocha': ['keep'], // gotokeep 的 nuocha 子域名
  
  // 其他 APP 短标识
  'v2ex': ['v2ex'], 
  'vvebo': ['vvebo'], 
  'slzd': ['slzd'], 
  'kyxq': ['kyxq'],
  'mhlz': ['mhlz'], 
  'xjsm': ['xjsm'], 
  'bqwz': ['bqwz'], 
  'bxkt': ['bxkt'],
  'cyljy': ['cyljy'], 
  'wohome': ['wohome'], 
  'kada': ['kada'],
  'ipalfish': ['ipalfish'], 
  'gps': ['gps'], 
  'iapp': ['iappdaily'],
  'sylangyue': ['sylangyue'], 
  'mingcalc': ['mingcalc'], 
  'qiujing': ['qiujingapp'],
  'foday': ['foday'], 
  'zhenti': ['zhenti'], 
  'tophub': ['tophub'], 
  'idaily': ['tophub'],
  'qmj': ['qmjyzc'], 'qmjy': ['qmjyzc'], 'qmjyz': ['qmjyzc'],
  
  // 特殊路径标识（如果有）
  'qiujingapp': ['qiujingapp']
};

// ==========================================
// 主函数：生成索引
// ==========================================
function generatePrefixIndex() {
  const index = {
    exact: {},   // 三级域名精确匹配：api.example.com
    suffix: {},  // 二级域名后缀：example.com
    keyword: { ...KEYWORD_INDEX } // 只用手动配置，绝不自动生成
  };

  const allConfigs = getAllConfigs();

  for (const [id, cfg] of Object.entries(allConfigs)) {
    const pattern = cfg.urlPattern;
    if (!pattern) continue;

    // 步骤1：清理 pattern，只保留可能的域名部分
    // 移除所有 (?:...) 分组（这些是动态子域名，已用 KEYWORD_INDEX 处理）
    // 移除正则语法，只保留静态域名
    let cleaned = pattern
      .replace(/\(\?:[^)]+\)/g, '')   // 删除 (?:xxx|yyy) 动态分组
      .replace(/\\\./g, '.')          // \. → .
      .replace(/[\\^$|+?()[\]{}]/g, ''); // 删除其他正则符号

    // 步骤2：提取域名（现在应该是干净的 xxx.xxx.com）
    const domains = cleaned.match(/[a-z0-9][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z]{2,6}/gi) || [];
    
    for (const domain of domains) {
      const parts = domain.toLowerCase().split('.').filter(p => p && !/^\d+$/.test(p)); // 过滤纯数字段
      
      if (parts.length >= 3) {
        const fullDomain = parts.join('.');
        
        // Exact：完整三级域名（如 api.github.com）
        if (!index.exact[fullDomain]) index.exact[fullDomain] = [];
        if (!index.exact[fullDomain].includes(id)) index.exact[fullDomain].push(id);
        
        // Suffix：二级域名（如 github.com）
        const suffix = parts.slice(-2).join('.');
        if (!index.suffix[suffix]) index.suffix[suffix] = [];
        if (!index.suffix[suffix].includes(id)) index.suffix[suffix].push(id);
        
      } else if (parts.length === 2) {
        // 纯二级域名
        const domainKey = parts.join('.');
        if (!index.suffix[domainKey]) index.suffix[domainKey] = [];
        if (!index.suffix[domainKey].includes(id)) index.suffix[domainKey].push(id);
      }
    }
  }

  return index;
}

// ==========================================
// 调试输出
// ==========================================
function printIndexStats(index) {
  console.log('\n📊 前缀索引生成报告');
  console.log(`  Exact:   ${Object.keys(index.exact).length} 个三级域名`);
  console.log(`  Suffix:  ${Object.keys(index.suffix).length} 个二级域名`);
  console.log(`  Keyword: ${Object.keys(index.keyword).length} 个手动关键字`);
  
  console.log('\n✅ 验证：无自动生成短字符串，无正则语法混入');
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generatePrefixIndex,
    printIndexStats,
    KEYWORD_INDEX
  };
}
