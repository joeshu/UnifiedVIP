// src/apps/_index.js
// APP注册表 - 自动从 configs/*.json 扫描生成

const fs = require('fs');
const path = require('path');

const CONFIGS_DIR = path.join(__dirname, '../../configs');

// ==========================================
// 自动扫描 configs 目录生成注册表
// ==========================================
function scanConfigs() {
  const registry = {};
  
  if (!fs.existsSync(CONFIGS_DIR)) {
    console.warn('⚠️ configs/ 目录不存在');
    return registry;
  }

  const files = fs.readdirSync(CONFIGS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  for (const file of files) {
    const id = file.replace('.json', '');
    const filePath = path.join(CONFIGS_DIR, file);
    
    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // 必须有 urlPattern 才能注册
      if (config.urlPattern) {
        registry[id] = {
          urlPattern: config.urlPattern
        };
      } else {
        console.warn(`⚠️ ${file} 缺少 urlPattern 字段，跳过注册`);
      }
    } catch (e) {
      console.error(`❌ 读取 ${file} 失败: ${e.message}`);
    }
  }

  return registry;
}

// 动态生成 APP_REGISTRY
const APP_REGISTRY = scanConfigs();

// ==========================================
// 获取所有配置（合并 urlPattern + 完整配置）
// ==========================================
function getAllConfigs() {
  const configs = {};

  for (const [id, baseCfg] of Object.entries(APP_REGISTRY)) {
    try {
      const configPath = path.join(CONFIGS_DIR, `${id}.json`);
      const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // 合并：urlPattern 从 registry 获取，其他从 JSON 读取
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

// CommonJS导出
module.exports = {
  APP_REGISTRY,
  getAllConfigs,
  generateManifest,
  generateRewriteComments,
  generatePrefixIndex,
  scanConfigs  // 导出以便调试
};
