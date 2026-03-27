// src/apps/_prefix-index.js
// 前缀索引生成器 - 智能自动提取版（支持强制关键字 + 自动提取 + 冲突检测）

const { getAllConfigs } = require('./_index');

// ==========================================
// 排除列表（通用词，不会作为关键字）
// ==========================================
const EXCLUDE_LIST = [
  'api', 'www', 'm', 'mobile', 'app', 'ios', 'android',
  'v1', 'v2', 'v3', 'service', 'rest', 'gateway', 'public',
  'com', 'cn', 'net', 'org', 'io', 'cc', 'xyz', 'co',
  'http', 'https', 'html', 'php', 'asp', 'jsp', 'json', 'xml',
  'admin', 'test', 'demo', 'dev', 'prod', 'staging'
];

// ==========================================
// 强制包含的关键字（不受长度限制，高优先级）
// ==========================================
const FORCED_KEYWORDS = {
  'yz': ['tv'],           // yz1018, yzy0916 等域名
  'tv': ['tv'],           // 备用
  'v2ex': ['v2ex'],       // v2ex 域名
  'vvebo': ['vvebo'],     // vvebo 域名
  'slzd': ['slzd'],       // 三联中读
  'kyxq': ['kyxq'],       // 口语星球
  'mhlz': ['mhlz'],       // 梦幻量子
  'xjsm': ['xjsm'],       // 小精灵去水印
  'bqwz': ['bqwz'],       // 比趣王者
  'qmj': ['qmjyzc'],      // 趣谜局
  'bxkt': ['bxkt'],       // 伴学课堂
  'cyljy': ['cyljy'],     // 次元领域
  'wohome': ['wohome'],   // 我家智能
  'kada': ['kada'],       // Kada故事
  'ipalfish': ['ipalfish'], // 伴鱼绘本
  'gps': ['gps'],         // GPS工具箱
  'iapp': ['iappdaily'],  // iAppDaily
  'sylangyue': ['sylangyue'], // 三联中读剧场
  'mingcalc': ['mingcalc'], // 明计算
  'qiujing': ['qiujingapp'], // 趣鲸App
  'foday': ['foday'],     // Foday
  'zhenti': ['zhenti']    // 真题伴侣
};

// ==========================================
// 手动修正表（用于解决自动提取的冲突）
// ==========================================
const MANUAL_OVERRIDES = {
  // 示例：如果自动提取将 'keep' 映射到了错误的APP，这里修正
  // 'keep': ['gotokeep'],
  // 'bili': ['bilibili']
};

// ==========================================
// 从 urlPattern 智能提取关键字
// ==========================================
function extractKeywordsFromPattern(pattern, appId) {
  const keywords = new Set();
  if (!pattern) return keywords;

  // 1. 提取 (?:xxx|yyy|zzz) 格式的选项组
  // 例如：(?:yz1018|yzy0916|yz250907) → 提取 yz, yzy, yz1018, yzy0916...
  const groupMatches = pattern.match(/\(\?:([^)]+)\)/g) || [];
  for (const group of groupMatches) {
    const content = group.replace(/^\(\?:/, '').replace(/\)$/, '');
    const options = content.split('|');
    
    for (const opt of options) {
      const cleanOpt = opt.toLowerCase().trim().replace(/^[\*\.]+/, ''); // 清理 *. 前缀
      
      if (!cleanOpt || EXCLUDE_LIST.includes(cleanOpt)) continue;
      
      // 提取整个选项（2-10字符）
      if (cleanOpt.length >= 2 && cleanOpt.length <= 10) {
        keywords.add(cleanOpt);
      }
      
      // 提取短前缀（前2-3字符）用于快速匹配
      if (cleanOpt.length >= 4) {
        const short2 = cleanOpt.substring(0, 2);
        const short3 = cleanOpt.substring(0, 3);
        
        if (!EXCLUDE_LIST.includes(short2)) keywords.add(short2);
        if (!EXCLUDE_LIST.includes(short3)) keywords.add(short3);
        
        // 如果长度>=6，再提取前4个字符
        if (cleanOpt.length >= 6) {
          const short4 = cleanOpt.substring(0, 4);
          if (!EXCLUDE_LIST.includes(short4)) keywords.add(short4);
        }
      }
    }
  }

  // 2. 提取普通域名（如 api.example.com, *.example.com）
  const domainMatches = pattern.match(/[a-z0-9][a-z0-9-]*\.[a-z][a-z0-9.-]*/gi) || [];
  for (const domain of domainMatches) {
    const parts = domain.toLowerCase().split('.').filter(p => p && !EXCLUDE_LIST.includes(p));
    
    for (const part of parts) {
      // 跳过纯数字
      if (/^\d+$/.test(part)) continue;
      
      // 域名部分（2-12字符）
      if (part.length >= 2 && part.length <= 12) {
        keywords.add(part);
      }
      
      // 长域名提取前缀
      if (part.length >= 5) {
        keywords.add(part.substring(0, 2));
        keywords.add(part.substring(0, 3));
        if (part.length >= 8) {
          keywords.add(part.substring(0, 4));
        }
      }
    }
  }

  // 3. 提取路径中的特征关键字（如 /api/vip/ → vip）
  const pathMatches = pattern.match(/\/([a-z]{3,})\//gi) || [];
  for (const match of pathMatches) {
    const clean = match.replace(/\//g, '');
    if (clean.length >= 3 && clean.length <= 8 && !EXCLUDE_LIST.includes(clean)) {
      keywords.add(clean);
    }
  }

  return keywords;
}

// ==========================================
// 生成前缀索引（主函数）
// ==========================================
function generatePrefixIndex() {
  const index = {
    exact: {},    // 精确三级域名：api.example.com → [apps]
    suffix: {},  // 二级域名后缀：example.com → [apps]
    keyword: {}  // 关键字索引：yz → [apps]
  };

  const allConfigs = getAllConfigs();
  
  // 阶段1：收集关键字映射（keyword -> Set(appIds)）
  const keywordMap = {};
  
  for (const [id, cfg] of Object.entries(allConfigs)) {
    const pattern = cfg.urlPattern;
    if (!pattern) continue;

    // 自动提取关键字
    const keywords = extractKeywordsFromPattern(pattern, id);
    for (const kw of keywords) {
      if (!keywordMap[kw]) keywordMap[kw] = new Set();
      keywordMap[kw].add(id);
    }

    // 阶段2：处理域名（exact/suffix）
    const domainMatches = pattern.match(/[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/gi);
    if (!domainMatches) continue;

    for (const domain of domainMatches) {
      const parts = domain.toLowerCase().split('.');

      if (parts.length >= 3) {
        // 三级域名 → exact（如 api.example.com）
        if (!index.exact[domain]) index.exact[domain] = [];
        if (!index.exact[domain].includes(id)) index.exact[domain].push(id);

        // 二级域名 → suffix（如 example.com）
        const suffix = parts.slice(-2).join('.');
        if (!index.suffix[suffix]) index.suffix[suffix] = [];
        if (!index.suffix[suffix].includes(id)) index.suffix[suffix].push(id);
      } else {
        // 纯二级域名 → suffix
        if (!index.suffix[domain]) index.suffix[domain] = [];
        if (!index.suffix[domain].includes(id)) index.suffix[domain].push(id);
      }
    }
  }

  // 阶段3：应用强制关键字（高优先级，覆盖自动提取）
  for (const [kw, ids] of Object.entries(FORCED_KEYWORDS)) {
    keywordMap[kw] = new Set(ids);
  }

  // 阶段4：应用手动修正（最高优先级）
  for (const [kw, ids] of Object.entries(MANUAL_OVERRIDES)) {
    keywordMap[kw] = new Set(ids);
  }

  // 阶段5：过滤并生成最终 keyword 索引
  const conflicts = [];        // 记录冲突
  const filtered = [];         // 记录被过滤的
  const MAX_APPS_PER_KEYWORD = 3;  // 关键字关联APP上限
  
  for (const [kw, appSet] of Object.entries(keywordMap)) {
    const apps = Array.from(appSet);
    
    // 过滤1：排除单字符
    if (kw.length < 2) {
      filtered.push({ keyword: kw, reason: '单字符' });
      continue;
    }
    
    // 过滤2：排除过度通用（关联太多APP）
    if (apps.length > MAX_APPS_PER_KEYWORD) {
      filtered.push({ keyword: kw, apps: apps.length, reason: '关联APP过多(>' + MAX_APPS_PER_KEYWORD + ')' });
      continue;
    }
    
    // 过滤3：2字符关键字关联多个APP时记录冲突（仍保留，但警告）
    if (kw.length === 2 && apps.length > 1) {
      conflicts.push({ keyword: kw, apps, type: '短关键字冲突' });
    }
    
    index.keyword[kw] = apps;
  }

  // 构建时输出报告
  console.log(`\n📊 前缀索引生成报告`);
  console.log(`   精确匹配(exact): ${Object.keys(index.exact).length} 个`);
  console.log(`   后缀匹配(suffix): ${Object.keys(index.suffix).length} 个`);
  console.log(`   关键字匹配(keyword): ${Object.keys(index.keyword).length} 个`);
  
  if (conflicts.length > 0) {
    console.log(`\n⚠️ 关键字冲突警告 (${conflicts.length} 个):`);
    conflicts.forEach(c => {
      console.log(`   "${c.keyword}" → [${c.apps.join(', ')}] ${c.type}`);
    });
  }
  
  if (filtered.length > 0) {
    console.log(`\nℹ️ 已过滤关键字 (${filtered.length} 个):`);
    filtered.slice(0, 5).forEach(f => {
      console.log(`   "${f.keyword}" (${f.reason})${f.apps ? ' - 关联' + f.apps + '个APP' : ''}`);
    });
    if (filtered.length > 5) console.log(`   ... 还有 ${filtered.length - 5} 个`);
  }

  return index;
}

// ==========================================
// 调试函数：打印索引统计
// ==========================================
function printIndexStats(index) {
  console.log('\n📋 前缀索引详细统计');
  console.log('='.repeat(50));
  console.log(`exact:   ${Object.keys(index.exact).length} 个域名`);
  console.log(`suffix:  ${Object.keys(index.suffix).length} 个后缀`);
  console.log(`keyword: ${Object.keys(index.keyword).length} 个关键字`);
  
  // 显示关键字示例
  const samples = ['yz', 'tv', 'v2ex', 'keep', 'api', 'com'];
  console.log('\n🔍 关键字检查示例:');
  samples.forEach(kw => {
    if (index.keyword[kw]) {
      console.log(`  "${kw}" → [${index.keyword[kw].join(', ')}]`);
    } else {
      console.log(`  "${kw}" → (未索引)`);
    }
  });

  // 显示长尾分布
  const multiAppKeywords = Object.entries(index.keyword).filter(([k, v]) => v.length > 1);
  if (multiAppKeywords.length > 0) {
    console.log(`\n🔀 多APP关键字 (${multiAppKeywords.length} 个):`);
    multiAppKeywords.slice(0, 5).forEach(([kw, apps]) => {
      console.log(`  "${kw}" → [${apps.join(', ')}]`);
    });
  }
  
  console.log('='.repeat(50));
}

// ==========================================
// CommonJS导出
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generatePrefixIndex,
    printIndexStats,
    FORCED_KEYWORDS,
    EXCLUDE_LIST,
    // 导出内部函数供测试
    _extractKeywords: extractKeywordsFromPattern
  };
}
