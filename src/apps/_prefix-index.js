// src/apps/_prefix-index.js
// 参考 vip-unlock-configs 高质量前缀索引生成器
// 核心原则：只提取完整域名(exact/suffix)，短关键字完全手动维护，绝不自动生成

const { getAllConfigs } = require('./_index');

// ==========================================
// 手动维护的高质量短关键字（唯一可信来源）
// 用于匹配动态子域名（如 yz1018.xxx.com）
// ==========================================
const FORCED_KEYWORDS = {
  // TV相关（动态子域名）
  'yz': ['tv'], 'yzy': ['tv'], 'yz1018': ['tv'], 'yz250907': ['tv'], 'yz0320': ['tv'], 
  'cfvip': ['tv'], 'cf': ['tv'],
  
  // Keep相关（子域名）
  'keep': ['keep'], 'gotokeep': ['keep'],
  'nuocha': ['keep'], 'gerudo': ['keep'], 'athena': ['keep'], // keep的子域名
  
  // TopHub相关
  'tophub': ['tophub'], 'tophubdata': ['tophub'], 'idaily': ['tophub'], 'remai': ['tophub'],
  
  // 其他APP主标识（严格筛选，只保留高质量标识）
  'v2ex': ['v2ex'],
  'vvebo': ['vvebo'], 'fluxapi': ['vvebo'],
  'slzd': ['slzd'], 'lifeweek': ['slzd'],
  'kyxq': ['kyxq'], 'kouyuxingqiu': ['kyxq'],
  'mhlz': ['mhlz'],
  'xjsm': ['xjsm'], 'jvplay': ['xjsm'],
  'bqwz': ['bqwz'], 'mandrillvr': ['bqwz'], 'javelin': ['bqwz'],
  'qmj': ['qmjyzc'], 'qmjyzc': ['qmjyzc'], 'haotgame': ['qmjyzc'],
  'bxkt': ['bxkt'], 'banxueketang': ['bxkt'],
  'cyljy': ['cyljy'], 'feigo': ['cyljy'],
  'wohome': ['wohome'], 'smartont': ['wohome'], 'iotpservice': ['wohome'],
  'kada': ['kada'], 'hhdd': ['kada'],
  'ipalfish': ['ipalfish'], 'picturebook': ['ipalfish'],
  'gps': ['gps'], 'gpstool': ['gps'],
  'iapp': ['iappdaily'], 'iappdaily': ['iappdaily'],
  'sylangyue': ['sylangyue'], 'theater-api': ['sylangyue'],
  'mingcalc': ['mingcalc'], 'jsq': ['mingcalc'],
  'qiujing': ['qiujingapp'], 'qiujingapp': ['qiujingapp'], 'yizhilive': ['qiujingapp'],
  'foday': ['foday'], 'folidaymall': ['foday'],
  'zhenti': ['zhenti']
};

// ==========================================
// 生成严格前缀索引（参考vip-unlock-configs标准）
// ==========================================
function generatePrefixIndex() {
  const index = {
    exact: {},   // 三级域名：api.example.com → [apps]
    suffix: {},  // 二级域名：example.com → [apps]
    keyword: {}  // 短关键字：完全来自 FORCED_KEYWORDS，绝不自动生成
  };

  const allConfigs = getAllConfigs();
  const registeredIds = new Set(Object.keys(allConfigs));

  // 步骤1：复制手动维护的短关键字（仅保留已注册 app）
  for (const [kw, ids] of Object.entries(FORCED_KEYWORDS)) {
    const filtered = (ids || []).filter(id => registeredIds.has(id));
    if (filtered.length > 0) index.keyword[kw] = filtered;
  }

  // 步骤2：自动提取完整域名（仅用于 exact/suffix，绝不生成短关键字）
  for (const [id, cfg] of Object.entries(allConfigs)) {
    const pattern = cfg.urlPattern;
    if (!pattern) continue;

    // 严格清理：移除所有正则语法，只保留域名可识别部分
    let cleaned = pattern
      // 移除 (?:xxx|yyy) 分组标记，但保留内容用于域名提取
      .replace(/\(\?:/g, ' ')
      .replace(/\)/g, ' ')
      // 移除所有转义符
      .replace(/\\/g, '')
      // 将正则符号替换为空格，防止粘连误识别
      .replace(/[\^$|+?()[\]{}]/g, ' ')
      // 移除行首行尾锚点和通配符
      .replace(/^\^?https?\?:?\/\//g, ' ')
      .replace(/\.\*/g, ' ')
      .replace(/\*/g, ' ')
      // 统一空格便于分割
      .replace(/\s+/g, ' ');

    // 提取域名候选：必须包含至少一个点，且符合域名规范
    const candidates = cleaned.match(/[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z][a-zA-Z0-9.-]*/g) || [];

    for (const candidate of candidates) {
      const domain = candidate.toLowerCase().trim();

      if (domain.length < 7) continue;
      if (domain.includes('http') || domain.includes('//')) continue;

      const parts = domain.split('.').filter(p => {
        if (!p) return false;
        if (/^\d+$/.test(p)) return false;
        if (p.length < 2) return false;
        return true;
      });

      if (parts.length < 2) continue;

      const tld = parts[parts.length - 1];
      if (!/^[a-z]{2,6}$/.test(tld)) continue;

      // 过滤常见路径后缀误识别
      if (['do', 'json', 'php', 'asp', 'jsp', 'html', 'xml', 'ashx'].includes(tld)) continue;

      if (parts.length >= 3) {
        const fullDomain = parts.join('.');
        if (!index.exact[fullDomain]) index.exact[fullDomain] = [];
        if (!index.exact[fullDomain].includes(id)) index.exact[fullDomain].push(id);

        const suffix = parts.slice(-2).join('.');
        if (!index.suffix[suffix]) index.suffix[suffix] = [];
        if (!index.suffix[suffix].includes(id)) index.suffix[suffix].push(id);
      }
      else if (parts.length === 2) {
        const suffixKey = parts.join('.');
        if (!index.suffix[suffixKey]) index.suffix[suffixKey] = [];
        if (!index.suffix[suffixKey].includes(id)) index.suffix[suffixKey].push(id);
      }
    }
  }

  return index;
}

// ==========================================
// 调试统计（对比vip-unlock-configs标准）
// ==========================================
function printIndexStats(index) {
  console.log('\n📊 前缀索引质量报告（参考vip-unlock-configs标准）');
  console.log('='.repeat(50));
  console.log(`✅ Exact:   ${Object.keys(index.exact).length} 个三级域名`);
  console.log(`✅ Suffix:  ${Object.keys(index.suffix).length} 个二级域名`);
  console.log(`✅ Keyword: ${Object.keys(index.keyword).length} 个手动短关键字`);
  
  // 验证关键短关键字
  console.log('\n🔍 核心短关键字验证:');
  const keyChecks = ['yz', 'keep', 'tophub', 'v2ex', 'qiujing'];
  for (const kw of keyChecks) {
    const found = index.keyword[kw];
    console.log(`  ${found ? '✅' : '❌'} "${kw}" → ${found ? '['+found.join(', ')+']' : '未定义'}`);
  }
  
  // 验证域名索引
  console.log('\n🔍 域名索引验证（抽样）:');
  const domainChecks = ['gotokeep.com', 'v2ex.com', 'lifeweek.com.cn'];
  for (const d of domainChecks) {
    const inSuffix = index.suffix[d];
    const inExact = index.exact[d];
    if (inSuffix) console.log(`  [S] "${d}" → [${inSuffix.join(', ')}]`);
    else if (inExact) console.log(`  [E] "${d}" → [${inExact.join(', ')}]`);
    else console.log(`  [?] "${d}" → (未索引)`);
  }
  
  // 垃圾数据检测
  const suspiciousKeywords = Object.keys(index.keyword).filter(k => 
    k.length < 2 || /^\d+$/.test(k) || /[\\^$|+?()[\]{}]/.test(k)
  );
  const suspiciousExact = Object.keys(index.exact).filter(k => k.length < 7);
  
  console.log('\n🛡️ 质量检查:');
  if (suspiciousKeywords.length === 0 && suspiciousExact.length === 0) {
    console.log('  ✅ 无垃圾数据（符合vip-unlock-configs标准）');
  } else {
    if (suspiciousKeywords.length > 0) console.log(`  ⚠️ 发现可疑关键字: ${suspiciousKeywords.slice(0,5).join(', ')}`);
    if (suspiciousExact.length > 0) console.log(`  ⚠️ 发现可疑短域名: ${suspiciousExact.slice(0,5).join(', ')}`);
  }
  
  console.log('='.repeat(50));
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generatePrefixIndex,
    printIndexStats,
    FORCED_KEYWORDS
  };
}
