// src/apps/_index.js
// APP注册表 - 支持 configs/*.json + 内联 urlPattern 双模式（带可控日志）

const fs = require('fs');
const path = require('path');

const CONFIGS_DIR = path.join(__dirname, '../../configs');
const DEFAULT_SCAN_SILENT = true;

// ==========================================
// 内联注册表 - 应急使用
// ==========================================
const INLINE_REGISTRY = {};

// ==========================================
// 扫描 configs 目录（可静默）
// ==========================================
function scanConfigs(options = {}) {
  const silent = options.silent !== undefined ? !!options.silent : DEFAULT_SCAN_SILENT;
  const log = silent ? () => {} : (...args) => console.log(...args);
  const errorLog = silent ? () => {} : (...args) => console.error(...args);

  const registry = {};
  const skipped = [];
  const errors = [];
  const processed = [];

  for (const [id, cfg] of Object.entries(INLINE_REGISTRY)) {
    registry[id] = { urlPattern: cfg.urlPattern };
  }

  if (!fs.existsSync(CONFIGS_DIR)) {
    errorLog('❌ configs/ 目录不存在!');
    return { registry, skipped, errors, processed };
  }

  const allFiles = fs.readdirSync(CONFIGS_DIR).sort();
  const jsonFiles = allFiles.filter(f => f.endsWith('.json'));
  const nonJsonFiles = allFiles.filter(f => !f.endsWith('.json'));

  log('\n📁 configs/ 目录内容:');
  log(`   总文件数: ${allFiles.length}`);
  log(`   JSON文件: ${jsonFiles.length}`);
  if (nonJsonFiles.length > 0) {
    log(`   非JSON文件: ${nonJsonFiles.join(', ')} (将被忽略)`);
  }

  log(`\n🔍 开始扫描 ${jsonFiles.length} 个 JSON 文件...\n`);

  for (const file of jsonFiles) {
    const id = file.replace('.json', '');
    const filePath = path.join(CONFIGS_DIR, file);

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      if (!content || content.trim() === '') {
        skipped.push({ file, id, reason: '文件为空' });
        log(`   ⚠️  ${file} - 跳过: 文件为空`);
        continue;
      }

      let config;
      try {
        config = JSON.parse(content);
      } catch (parseErr) {
        skipped.push({ file, id, reason: `JSON解析错误: ${parseErr.message}` });
        log(`   ❌ ${file} - 跳过: JSON解析失败`);
        continue;
      }

      if (config.urlPattern && typeof config.urlPattern === 'string' && config.urlPattern.trim() !== '') {
        registry[id] = { urlPattern: config.urlPattern };
        processed.push({ file, id, urlPattern: config.urlPattern.substring(0, 40) + '...' });
        log(`   ✅ ${file.padEnd(20)} - 已注册`);
      } else if (registry[id]) {
        processed.push({ file, id, urlPattern: '(来自内联)' });
        log(`   ℹ️  ${file.padEnd(20)} - 使用内联 urlPattern`);
      } else {
        skipped.push({
          file,
          id,
          reason: '缺少 urlPattern 字段',
          hasFields: Object.keys(config).join(', ') || '(空对象)'
        });
        log(`   ⚠️  ${file.padEnd(20)} - 跳过: 缺少 urlPattern (字段: ${Object.keys(config).join(', ')})`);
      }
    } catch (e) {
      errors.push({ file, error: e.message });
      log(`   ❌ ${file.padEnd(20)} - 错误: ${e.message}`);
    }
  }

  log(`\n${'='.repeat(60)}`);
  log('📊 构建统计报告');
  log(`${'='.repeat(60)}`);
  log(`   总 JSON 文件: ${jsonFiles.length}`);
  log(`   ✅ 成功注册:  ${processed.length}`);
  log(`   ⚠️  被跳过:   ${skipped.length}`);
  log(`   ❌ 错误:      ${errors.length}`);
  log(`   📦 最终注册:  ${Object.keys(registry).length} 个 APP`);

  if (skipped.length > 0) {
    log(`\n⚠️  被跳过的文件详情 (${skipped.length} 个):`);
    skipped.forEach((s, i) => {
      log(`   ${i + 1}. ${s.file}`);
      log(`      原因: ${s.reason}`);
      if (s.hasFields) log(`      已有字段: ${s.hasFields}`);
    });
  }

  if (errors.length > 0) {
    log(`\n❌ 出错的文件 (${errors.length} 个):`);
    errors.forEach((e, i) => {
      log(`   ${i + 1}. ${e.file}: ${e.error}`);
    });
  }

  log(`\n📋 已注册的 APP 列表 (${processed.length} 个):`);
  processed.forEach((p, i) => {
    log(`   ${String(i + 1).padStart(2)}. ${p.id.padEnd(15)} ${p.urlPattern.substring(0, 50)}`);
  });
  log('');

  return { registry, skipped, errors, processed };
}

// 默认静默初始化，避免每个脚本重复打印扫描日志
const scanResult = scanConfigs({ silent: true });
const APP_REGISTRY = scanResult.registry;

// ==========================================
// 获取所有配置
// ==========================================
function getAllConfigs(options = {}) {
  const silent = options.silent !== undefined ? !!options.silent : true;
  const warn = silent ? () => {} : (...args) => console.warn(...args);

  const configs = {};

  for (const [id, baseCfg] of Object.entries(APP_REGISTRY)) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);

    if (fs.existsSync(configPath)) {
      try {
        const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        configs[id] = {
          urlPattern: baseCfg.urlPattern,
          ...fullConfig
        };
      } catch (e) {
        warn(`⚠️ 读取 configs/${id}.json 失败，使用最小配置`);
        configs[id] = {
          urlPattern: baseCfg.urlPattern,
          name: id,
          mode: 'json',
          priority: 10,
          description: `${id} VIP解锁`
        };
      }
    } else {
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

function generateManifest() {
  const configs = {};
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    configs[id] = {
      urlPattern: cfg.urlPattern,
      configFile: `${id}.json`
    };
  }

  return {
    version: '22.0.0',
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(APP_REGISTRY).length,
    configs
  };
}

function generateRewriteComments() {
  const allConfigs = getAllConfigs({ silent: true });

  return Object.entries(APP_REGISTRY).map(([id, cfg]) => {
    const fullCfg = allConfigs[id] || {};
    const name = fullCfg.name || id;
    return ` * # ${name}\\n * ${cfg.urlPattern} url script-response-body https://joeshu.github.io/UnifiedVIP/Unified_VIP_Unlock_Manager_v22.js`;
  }).join('\\n');
}

function generatePrefixIndex() {
  const index = {
    exact: {},
    suffix: {},
    keyword: {}
  };

  const allConfigs = getAllConfigs({ silent: true });

  for (const [id, cfg] of Object.entries(allConfigs)) {
    const pattern = cfg.urlPattern;
    if (!pattern) continue;

    const domainMatches = pattern.match(/[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/gi);
    if (!domainMatches) continue;

    for (const domain of domainMatches) {
      const parts = domain.toLowerCase().split('.');

      if (parts.length >= 3) {
        if (!index.exact[domain]) index.exact[domain] = [];
        if (!index.exact[domain].includes(id)) index.exact[domain].push(id);

        const suffix = parts.slice(-2).join('.');
        if (!index.suffix[suffix]) index.suffix[suffix] = [];
        if (!index.suffix[suffix].includes(id)) index.suffix[suffix].push(id);
      } else {
        if (!index.suffix[domain]) index.suffix[domain] = [];
        if (!index.suffix[domain].includes(id)) index.suffix[domain].push(id);
      }

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

function addEmergencyApp(id, urlPattern, defaultConfig = {}) {
  if (!id || !urlPattern) {
    console.error('❌ addEmergencyApp: 需要提供 id 和 urlPattern');
    return false;
  }

  INLINE_REGISTRY[id] = { urlPattern };

  if (Object.keys(defaultConfig).length > 0) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    const fullConfig = {
      name: id,
      description: `${id} VIP解锁（应急添加）`,
      mode: 'json',
      priority: 10,
      urlPattern,
      ...defaultConfig
    };

    try {
      fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
      console.log(`✅ 已创建应急配置文件: configs/${id}.json`);
    } catch (e) {
      console.error(`❌ 创建配置文件失败: ${e.message}`);
    }
  }

  console.log(`✅ 已添加应急 APP: ${id}`);
  return true;
}

module.exports = {
  APP_REGISTRY,
  INLINE_REGISTRY,
  getAllConfigs,
  generateManifest,
  generateRewriteComments,
  generatePrefixIndex,
  scanConfigs,
  addEmergencyApp
};
