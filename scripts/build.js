#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { generateManifest, generateRemoteConfigs } = require('../src/apps/_index');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const CONFIGS_DIR = path.join(__dirname, '../configs');

// 确保目录存在
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}
if (!fs.existsSync(CONFIGS_DIR)) {
  fs.mkdirSync(CONFIGS_DIR, { recursive: true });
}

// 读取文件
function readFile(filePath) {
  const fullPath = path.join(SRC_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 文件不存在: ${fullPath}`);
    process.exit(1);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

// 主构建函数
function build() {
  console.log('🔨 开始构建 UnifiedVIP v22...\n');

  const manifest = generateManifest();
  const remoteConfigs = generateRemoteConfigs();

  // 生成远程配置文件
  console.log('📝 生成远程配置...');
  for (const [id, config] of Object.entries(remoteConfigs)) {
    const filePath = path.join(CONFIGS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  }
  console.log(`   ✅ ${Object.keys(remoteConfigs).length} 个配置`);

  // 生成 rewrite 规则
  console.log('🔗 生成 rewrite 规则...');
  
  const hostnameSet = new Set();
  const rewriteRules = [];

  for (const [id, cfg] of Object.entries(manifest.configs)) {
    // 提取hostname
    const matches = cfg.urlPattern.match(/[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/gi);
    if (matches) {
      for (const domain of matches) {
        const parts = domain.toLowerCase().split('.');
        if (parts.length >= 2) {
          hostnameSet.add(`*.${parts.slice(-2).join('.')}`);
        }
      }
    }

    // 生成规则
    const rule = `${cfg.urlPattern} url script-response-body https://你的用户名.github.io/vip-unlock-configs/Unified_VIP_Unlock_Manager_v22.js`;
    rewriteRules.push(`# ${cfg.name}\n${rule}`);
  }

  const rewriteContent = `# ==========================================
# Unified VIP Unlock Manager v22.0.0
# 生成时间: ${new Date().toLocaleString()}
# APP数量: ${manifest.total}
# ==========================================

[rewrite_local]
${rewriteRules.join('\n\n')}

[mitm]
hostname = ${Array.from(hostnameSet).join(', ')}
`;

  fs.writeFileSync(path.join(DIST_DIR, 'rewrite.conf'), rewriteContent);

  // 组装主脚本
  console.log('📦 组装主脚本...');

  const script = `/*
 * ==========================================
 * Unified VIP Unlock Manager v22.0.0
 * 构建时间: ${new Date().toISOString()}
 * APP数量: ${manifest.total}
 * 支持模式: json/html/regex/game/hybrid/forward/remote
 * ==========================================
 */

'use strict';

// 环境修复
if (typeof console === 'undefined') {
  globalThis.console = { log: () => {} };
}

// 配置
const CONFIG = {
  REMOTE_BASE: 'https://你的用户名.github.io/vip-unlock-configs',
  CONFIG_CACHE_TTL: 24 * 60 * 60 * 1000,
  MAX_BODY_SIZE: 5 * 1024 * 1024,
  MAX_PROCESSORS_PER_REQUEST: 30,
  TIMEOUT: 10,
  DEBUG: false,
  VERBOSE_PATTERN_LOG: false
};

const META = {
  name: 'UnifiedVIP',
  version: '22.0.0'
};

// 内置Manifest
const BUILTIN_MANIFEST = ${JSON.stringify(manifest, null, 2)};

// 核心模块
${readFile('core/platform.js')}

${readFile('core/logger.js')}

${readFile('core/storage.js')}

${readFile('core/http.js')}

${readFile('core/utils.js')}

// 引擎模块
${readFile('regex-pool.js')}

${readFile('engine/processor-factory.js')}

${readFile('engine/compiler.js')}

${readFile('engine/manifest-loader.js')}

${readFile('engine/config-loader.js')}

${readFile('engine/vip-engine.js')}

// 主入口
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
      Logger.warn('Main', 'No URL detected');
      return $done((typeof $response !== 'undefined' && $response) ? { body: $response.body } : {});
    }

    const displayUrl = url ? url.split('?')[0].substring(0, 60) : 'unknown';
    Logger.info('Main', \`\${requestId} | \${displayUrl}\`);

    const mLoader = new SimpleManifestLoader(requestId);
    const manifest = mLoader.load();
    const configId = manifest.findMatch(url);

    if (!configId) {
      Logger.info('Main', 'No rule matched');
      return $done((typeof $response !== 'undefined' && $response) ? { body: $response.body } : {});
    }

    const cLoader = new SimpleConfigLoader(requestId);
    const config = await cLoader.load(configId, manifest.getConfigVersion(configId));

    const env = new Environment(META.name);
    const engine = new VipEngine(env, requestId);
    const result = await engine.process(
      (typeof $response !== 'undefined' && $response) ? $response.body : '',
      config
    );

    Logger.info('Main', \`\${requestId} completed [\${config.mode || 'default'}]\`);
    $done(result);

  } catch (e) {
    Logger.error('Main', \`\${requestId} failed: \${e.message}\`);
    $done((typeof $response !== 'undefined' && $response) ? { body: $response.body } : {});
  }
}

main();
`;

  // 写入主脚本
  const outputPath = path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js');
  fs.writeFileSync(outputPath, script);

  // 统计信息
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log(`\n✅ 构建成功！`);
  console.log(`📄 输出文件: ${outputPath}`);
  console.log(`📦 文件大小: ${sizeKB} KB`);
  console.log(`📱 APP数量: ${manifest.total}`);
  console.log(`\n包含APP:`);
  
  Object.entries(manifest.configs).forEach(([id, cfg], i) => {
    const mode = remoteConfigs[id]?.mode || 'json';
    console.log(`   ${i + 1}. ${cfg.name} (${id}) [${mode}]`);
  });

  console.log(`\n🚀 下一步:`);
  console.log(`   1. 修改脚本中的"你的用户名"为GitHub用户名`);
  console.log(`   2. git add . && git commit -m "build: v22" && git push`);
  console.log(`   3. GitHub Actions自动部署`);
}

build();
