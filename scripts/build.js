// scripts/build.js
// 构建脚本 - 所有配置生成到 configs/*.json

const fs = require('fs');
const path = require('path');
const { 
  APP_REGISTRY, 
  getAllConfigs,
  generateManifest, 
  generateRewriteComments, 
  generateHostnames 
} = require('../src/apps/_index');
const { generatePrefixIndexCode } = require('../src/apps/_prefix-index');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const CONFIGS_DIR = path.join(__dirname, '../configs');

// 加载核心模块
function loadModule(filename) {
  const content = fs.readFileSync(path.join(SRC_DIR, filename), 'utf8');
  return content.replace(/\/\/ CommonJS导出[\s\S]*$/, '').trim();
}

// 生成头部注释
function generateHeader() {
  const hostnames = generateHostnames();
  const manifest = generateManifest();
  
  return `/*
 * ==========================================
 * Unified VIP Unlock Manager v${manifest.version}-Lazy
 * 构建时间: ${new Date().toISOString()}
 * APP数量: ${manifest.total}
 * 配置模式: 全远程（configs/*.json）
 * 优化: M3存储+S3缓存+P2压缩+三级索引
 * ==========================================
 * 
 * [rewrite_local]
${generateRewriteComments()}
 * 
 * [mitm]
 * hostname = ${hostnames.join(', ')}
 */

'use strict';

// ==========================================
// 0. 环境修复 & 配置
// ==========================================
if (typeof console === 'undefined') { globalThis.console = { log: () => {} }; }

const CONFIG = {
  REMOTE_BASE: 'https://joeshu.github.io/vip-unlock-configs',
  CONFIG_CACHE_TTL: 24 * 60 * 60 * 1000,
  MAX_BODY_SIZE: 5 * 1024 * 1024,
  MAX_PROCESSORS_PER_REQUEST: 30,
  TIMEOUT: 10,
  DEBUG: false,
  VERBOSE_PATTERN_LOG: false
};

const META = { name: 'UnifiedVIP', version: '${manifest.version}-Lazy' };`;
}

// 主构建流程
function build() {
  console.log('🔨 开始构建 UnifiedVIP v22（全远程模式）\n');
  
  // 步骤1：生成所有远程配置文件
  console.log('📦 步骤1: 生成 configs/*.json...');
  const allConfigs = getAllConfigs();
  
  if (!fs.existsSync(CONFIGS_DIR)) {
    fs.mkdirSync(CONFIGS_DIR, { recursive: true });
  }
  
  // 清理旧配置（保留备份）
  const existingFiles = fs.readdirSync(CONFIGS_DIR).filter(f => f.endsWith('.json') && !f.includes('backup'));
  for (const file of existingFiles) {
    const oldPath = path.join(CONFIGS_DIR, file);
    const backupPath = path.join(CONFIGS_DIR, `${file}.backup`);
    fs.renameSync(oldPath, backupPath);
  }
  
  // 生成新配置
  for (const [appId, config] of Object.entries(allConfigs)) {
    const filePath = path.join(CONFIGS_DIR, `${appId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  }
  
  console.log(`   ✅ 生成 ${Object.keys(allConfigs).length} 个配置文件`);
  
  // 步骤2：加载核心模块
  console.log('📦 步骤2: 加载核心模块...');
  const platform = loadModule('core/platform.js');
  const logger = loadModule('core/logger.js');
  const storage = loadModule('core/storage.js');
  const http = loadModule('core/http.js');
  const utils = loadModule('core/utils.js');
  const regexPool = loadModule('engine/regex-pool.js');
  const processorFactory = loadModule('engine/processor-factory.js');
  const compiler = loadModule('engine/compiler.js');
  const manifestLoader = loadModule('engine/manifest-loader.js');
  const configLoader = loadModule('engine/config-loader.js');
  const vipEngine = loadModule('engine/vip-engine.js');

  // 步骤3：组装脚本
  console.log('📦 步骤3: 组装脚本...');
  const manifest = generateManifest();
  const prefixIndexCode = generatePrefixIndexCode();
  
  const fullScript = `${generateHeader()}

// ==========================================
// 1. 内置Manifest（仅元信息，无配置内容）
// ==========================================
const BUILTIN_MANIFEST = ${JSON.stringify(manifest, null, 2)};

${prefixIndexCode}

// ==========================================
// 3. 平台检测
// ==========================================
${platform}

// ==========================================
// 4. 日志系统
// ==========================================
${logger}

// ==========================================
// 5. M3存储系统
// ==========================================
${storage}

// ==========================================
// 6. HTTP客户端
// ==========================================
${http}

// ==========================================
// 7. 工具函数
// ==========================================
${utils}

// ==========================================
// 8. 正则缓存池
// ==========================================
${regexPool}

// ==========================================
// 9. 处理器工厂
// ==========================================
${processorFactory}

// ==========================================
// 10. 处理器编译器
// ==========================================
${compiler}

// ==========================================
// 11. Manifest加载器
// ==========================================
${manifestLoader}

// ==========================================
// 12. 配置加载器（全远程模式）
// ==========================================
${configLoader}

// ==========================================
// 13. VIP引擎
// ==========================================
${vipEngine}

// ==========================================
// 14. 主入口
// ==========================================
async function main() {
  const requestId = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  try {
    let url = '';
    if (typeof $request !== 'undefined') {
      url = (typeof $request === 'string') ? $request : ($request.url || '');
    } else if (typeof $response !== 'undefined' && $response) {
      url = $response.url || '';
    }
    
    if (!url) {
      return $done((typeof $response !== 'undefined' && $response) ? { body: $response.body } : {});
    }
    
    const displayUrl = url.split('?')[0].substring(0, 60);
    Logger.info('Main', \`\${requestId} | \${displayUrl}\`);

    const mLoader = new SimpleManifestLoader(requestId);
    const manifest = await mLoader.load();
    const configId = manifest.findMatch(url);
    
    if (!configId) {
      Logger.info('Main', 'No rule matched');
      return $done((typeof $response !== 'undefined' && $response) ? { body: $response.body } : {});
    }

    // 全远程模式：所有配置都通过HTTP加载
    const cLoader = new SimpleConfigLoader(requestId);
    const config = await cLoader.load(configId, manifest.getConfigVersion(configId));

    const env = new Environment(META.name);
    const engine = new VipEngine(env, requestId);
    const result = await engine.process(
      (typeof $response !== 'undefined' && $response) ? $response.body : '',
      config
    );
    
    Logger.info('Main', \`\${requestId} completed [\${config.mode}]\`);
    $done(result);

  } catch (e) {
    Logger.error('Main', \`\${requestId} failed: \${e.message}\`);
    $done((typeof $response !== 'undefined' && $response) ? { body: $response.body } : {});
  }
}

main();
`;

  // 步骤4：写入构建产物
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  
  const outputPath = path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js');
  fs.writeFileSync(outputPath, fullScript);
  
  // 统计信息
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  
  console.log(`\n✅ 构建成功: ${outputPath}`);
  console.log(`📊 脚本大小: ${sizeKB} KB`);
  console.log(`📱 APP数量: ${manifest.total}`);
  
  console.log(`\n📋 配置文件列表（configs/）:`);
  Object.entries(APP_REGISTRY).forEach(([id, cfg], i) => {
    const modeIcon = {
      json: '📦',
      regex: '🔍',
      forward: '➡️',
      remote: '🌐',
      game: '🎮',
      hybrid: '🔀',
      html: '📄'
    }[cfg.mode] || '⚙️';
    
    console.log(`   ${String(i + 1).padStart(2)}. ${modeIcon} ${id.padEnd(12)} ${cfg.name}`);
  });
  
  console.log(`\n🚀 执行 npm run deploy 发布`);
  console.log(`   - 脚本 → dist/Unified_VIP_Unlock_Manager_v22.js`);
  console.log(`   - 配置 → configs/*.json`);
}

// 运行构建
build();
