#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { generateManifest, generateRemoteConfigs } = require('../src/apps/_index');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const CONFIGS_DIR = path.join(__dirname, '../configs');

if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
if (!fs.existsSync(CONFIGS_DIR)) fs.mkdirSync(CONFIGS_DIR, { recursive: true });

function readFile(filePath) {
  return fs.readFileSync(path.join(SRC_DIR, filePath), 'utf8');
}

function build() {
  console.log('🔨 开始构建...\n');
  
  const manifest = generateManifest();
  const remoteConfigs = generateRemoteConfigs();
  
  for (const [id, config] of Object.entries(remoteConfigs)) {
    fs.writeFileSync(
      path.join(CONFIGS_DIR, `${id}.json`),
      JSON.stringify(config, null, 2)
    );
  }
  console.log(`✅ 生成 ${Object.keys(remoteConfigs).length} 个远程配置`);

  const rewriteRules = Object.entries(manifest.configs).map(([id, cfg]) => {
    return `${cfg.urlPattern} url script-response-body https://joeshu.github.io/vip-unlock-configs/Unified_VIP_Unlock_Manager_v22.js`;
  });
  
  const rewriteContent = `# Unified VIP Unlock Manager v22.0.0
# 生成时间: ${new Date().toLocaleString()}
# APP数量: ${manifest.total}

[rewrite_local]
${rewriteRules.join('\n')}

[mitm]
hostname = ${Object.values(manifest.configs).map(c => {
  const match = c.urlPattern.match(/[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i);
  return match ? `*.${match[0].split('.').slice(-2).join('.')}` : '';
}).filter((v, i, a) => v && a.indexOf(v) === i).join(', ')}
`;
  
  fs.writeFileSync(path.join(DIST_DIR, 'rewrite.conf'), rewriteContent);
  
  const script = `/*
 * Unified VIP Unlock Manager v22.0.0
 * 构建时间: ${new Date().toISOString()}
 * APP数量: ${manifest.total}
 */

'use strict';

if (typeof console === 'undefined') globalThis.console = { log: () => {} };

const CONFIG = {
  REMOTE_BASE: 'https://joeshu.github.io/vip-unlock-configs',
  CONFIG_CACHE_TTL: 24 * 60 * 60 * 1000,
  MAX_BODY_SIZE: 5 * 1024 * 1024
};

const META = { name: 'UnifiedVIP', version: '22.0.0' };

const BUILTIN_MANIFEST = ${JSON.stringify(manifest)};

${readFile('core/platform.js')}

${readFile('core/logger.js')}

${readFile('core/storage.js')}

${readFile('core/http.js')}

${readFile('core/utils.js')}

${readFile('engine/manifest-loader.js')}

${readFile('engine/config-loader.js')}

${readFile('engine/vip-engine.js')}

async function main() {
  const requestId = Math.random().toString(36).substr(2, 6).toUpperCase();
  try {
    let url = '';
    if (typeof $request !== 'undefined') {
      url = (typeof $request === 'string') ? $request : ($request.url || '');
    } else if (typeof $response !== 'undefined' && $response) {
      url = $response.url || '';
    }
    if (!url) return $done({});
    
    const displayUrl = url ? url.split('?')[0].substring(0, 60) : 'unknown';
    Logger.info('Main', \`\${requestId} | \${displayUrl}\`);
    
    const mLoader = new SimpleManifestLoader();
    const manifest = mLoader.load();
    const configId = manifest.findMatch(url);
    
    if (!configId) {
      Logger.info('Main', 'No rule matched');
      return $done($response?.body ? { body: $response.body } : {});
    }
    
    const cLoader = new SimpleConfigLoader();
    const config = await cLoader.load(configId);
    const env = { getUrl: () => url };
    const engine = new VipEngine(env);
    const result = await engine.process($response?.body || '', config);
    
    Logger.info('Main', \`\${requestId} completed\`);
    $done(result);
  } catch (e) {
    Logger.error('Main', \`\${requestId} failed: \${e.message}\`);
    $done($response?.body ? { body: $response.body } : {});
  }
}

main();
`;

  const outputPath = path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js');
  fs.writeFileSync(outputPath, script);
  
  const stats = fs.statSync(outputPath);
  console.log(`\n✅ 构建成功: ${outputPath}`);
  console.log(`📦 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📱 包含APP (${manifest.total}个):`);
  
  Object.entries(manifest.configs).forEach(([id, cfg], i) => {
    console.log(`   ${i + 1}. ${cfg.name}`);
  });
}

build();
