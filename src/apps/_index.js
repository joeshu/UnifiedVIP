// src/apps/_index.js
// APP注册表 - 支持 configs/*.json + 内联 urlPattern 双模式

const fs = require('fs');
const path = require('path');

const CONFIGS_DIR = path.join(__dirname, '../../configs');

// ==========================================
// 内联注册表 - 应急使用（当 configs/*.json 不存在或缺少 urlPattern 时）
// ==========================================
const INLINE_REGISTRY = {
  // 应急/备用 urlPattern 定义
  // 格式: appId: { urlPattern: "..." }
  
  // 示例：如果 configs/zhenti.json 不存在，使用这里的配置
  // zhenti: { 
  //   urlPattern: "^https?://newtest\\.zoooy111\\.com/mobilev4\\.php/User/index" 
  // }
};

// ==========================================
// 自动扫描 configs 目录 + 合并内联注册表
// ==========================================
function scanConfigs() {
  const registry = {};
  
  // 1. 首先加载内联注册表（作为默认值）
  for (const [id, cfg] of Object.entries(INLINE_REGISTRY)) {
    registry[id] = { urlPattern: cfg.urlPattern };
  }

  // 2. 扫描 configs 目录（覆盖内联配置）
  if (fs.existsSync(CONFIGS_DIR)) {
    const files = fs.readdirSync(CONFIGS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort();

    for (const file of files) {
      const id = file.replace('.json', '');
      const filePath = path.join(CONFIGS_DIR, file);
      
      try {
        const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // 优先使用 JSON 中的 urlPattern，如果没有则保留内联的
        if (config.urlPattern) {
          registry[id] = { urlPattern: config.urlPattern };
        } else if (!registry[id]) {
          // JSON 中没有 urlPattern，且内联也没有，则跳过
          console.warn(`⚠️ ${file} 缺少 urlPattern 字段，且内联注册表未定义，跳过注册`);
        }
        // 如果 JSON 中没有但内联有，保留内联的（已在第一步添加）
      } catch (e) {
        console.error(`❌ 读取 ${file} 失败: ${e.message}`);
      }
    }
  } else {
    console.warn('⚠️ configs/ 目录不存在，使用纯内联注册表');
  }

  return registry;
}

// 动态生成 APP_REGISTRY（configs 优先，内联备用）
const APP_REGISTRY = scanConfigs();

// ==========================================
// 获取所有配置（合并 urlPattern + 完整配置）
// ==========================================
function getAllConfigs() {
  const configs = {};

  for (const [id, baseCfg] of Object.entries(APP_REGISTRY)) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    
    // 检查 JSON 文件是否存在
    if (fs.existsSync(configPath)) {
      try {
        const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // 合并：urlPattern 从 registry 获取（可能来自内联或 JSON），其他从 JSON 读取
        configs[id] = {
          urlPattern: baseCfg.urlPattern,
          ...fullConfig
        };
      } catch (e) {
        console.warn(`⚠️ 读取 configs/${id}.json 失败，使用最小配置`);
        configs[id] = {
          urlPattern: baseCfg.urlPattern,
          name: id,
          mode: 'json',
          priority: 10,
          description: `${id} VIP解锁`
        };
      }
    } else {
      // JSON 文件不存在，使用内联配置 + 默认值
      console.info(`ℹ️ ${id} 使用内联配置（configs/${id}.json 不存在）`);
      configs[id] = {
        urlPattern: baseCfg.urlPattern,
        name: id,
        mode: 'json',
        priority: 10,
        description: `${id} VIP解锁（应急配置）`
      };
    }
  }

  return configs;
}

// ==========================================
// 生成 Manifest（用于脚本内嵌）
// ==========================================
function generateManifest() {
  const configs = {};
  
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    configs[id] = {
      urlPattern: cfg.urlPattern,
      configFile: `${id}.json`
    };
  }

  return {
    version: "22.0.0",
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(APP_REGISTRY).length,
    configs: configs
  };
}

// ==========================================
// 生成 rewrite.conf 注释
// ==========================================
function generateRewriteComments() {
  const allConfigs = getAllConfigs();

  return Object.entries(APP_REGISTRY).map(([id, cfg]) => {
    const fullCfg = allConfigs[id] || {};
    const name = fullCfg.name || id;
    return ` * # ${name}\\n * ${cfg.urlPattern} url script-response-body https://joeshu.github.io/UnifiedVIP/Unified_VIP_Unlock_Manager_v22.js`;
  }).join('\\n');
}

// ==========================================
// 生成前缀索引
// ==========================================
function generatePrefixIndex() {
  const index = {
    exact: {},
    suffix: {},
    keyword: {}
  };

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

      // 提取关键字
      const keywords = parts.filter(p => 
        p.length >= 4 &&
        !['api', 'www', 'm', 'mobile', 'app', 'v1', 'v2', 'v3', 'service', 'com', 'cn', 'net', 'org'].includes(p)
      );

      for (const kw of keywords) {
        if (!index.keyword[kw] && kw.length >= 4) {
          index.keyword[kw] = [id];
        } else if (index.keyword[kw] && !index.keyword[kw].includes(id)) {
          index.keyword[kw].push(id);
        }
      }
    }
  }

  return index;
}

// ==========================================
// 添加应急 APP 的快捷函数
// ==========================================
function addEmergencyApp(id, urlPattern, defaultConfig = {}) {
  if (!id || !urlPattern) {
    console.error('❌ addEmergencyApp: 需要提供 id 和 urlPattern');
    return false;
  }

  // 添加到内联注册表
  INLINE_REGISTRY[id] = { urlPattern };
  
  // 如果提供了默认配置，创建临时 JSON
  if (Object.keys(defaultConfig).length > 0) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    const fullConfig = {
      name: id,
      description: `${id} VIP解锁（应急添加）`,
      mode: 'json',
      priority: 10,
      urlPattern: urlPattern,
      ...defaultConfig
    };
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
      console.log(`✅ 已创建应急配置文件: configs/${id}.json`);
    } catch (e) {
      console.error(`❌ 创建配置文件失败: ${e.message}`);
    }
  }

  // 重新扫描
  console.log(`✅ 已添加应急 APP: ${id}`);
  return true;
}

// CommonJS导出
module.exports = {
  APP_REGISTRY,
  INLINE_REGISTRY,      // 导出内联注册表以便查看
  getAllConfigs,
  generateManifest,
  generateRewriteComments,
  generatePrefixIndex,
  scanConfigs,
  addEmergencyApp     // 导出应急添加函数
};
