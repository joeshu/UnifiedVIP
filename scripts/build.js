// scripts/build.js
// 构建脚本 - 生成主脚本、rewrite.conf 和 configs/*.json

const fs = require('fs');
const path = require('path');
const { 
  APP_REGISTRY, 
  getAllConfigs,
  generateManifest, 
  generateRewriteComments, 
  generateHostnames 
} = require('../src/apps/_index');
const { generatePrefixIndex } = require('../src/apps/_prefix-index');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const CONFIGS_DIR = path.join(__dirname, '../configs');

// 加载核心模块并移除 CommonJS 导出
function loadModule(filename) {
  const content = fs.readFileSync(path.join(SRC_DIR, filename), 'utf8');
  return content.replace(/\/\/ CommonJS导出[\s\S]*$/, '').trim();
}

// 生成单行压缩 Manifest（字段名完整）
function generateManifestOneLine() {
  const configs = {};
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    configs[id] = {
      name: cfg.name,
      urlPattern: cfg.urlPattern,
      mode: cfg.mode,
      configFile: `${id}.json`
    };
  }
  
  const manifest = {
    version: "22.0.0",
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(APP_REGISTRY).length,
    configs: configs
  };
  
  return JSON.stringify(manifest);
}

// 生成精简头部（保留原脚本格式，DEBUG开启）
function generateHeaderMinified() {
  const hostnames = generateHostnames();
  
  return `/*
 * ==========================================
 * Unified VIP Unlock Manager v22.0.0-Lazy
 * 构建时间: ${new Date().toISOString()}
 * APP数量: ${Object.keys(APP_REGISTRY).length}
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
  REMOTE_BASE: 'https://joeshu.github.io/UnifiedVIP',
  CONFIG_CACHE_TTL: 24 * 60 * 60 * 1000,
  MAX_BODY_SIZE: 5 * 1024 * 1024,
  MAX_PROCESSORS_PER_REQUEST: 30,
  TIMEOUT: 10,
  DEBUG: true,
  VERBOSE_PATTERN_LOG: false
};

const META = { name: 'UnifiedVIP', version: '22.0.0-Lazy' };`;
}

// 生成 PREFIX_INDEX（每个数组一行）
function generatePrefixIndexMultiLine() {
  const index = generatePrefixIndex();
  
  const lines = ['const PREFIX_INDEX = {'];
  
  // exact
  lines.push('  exact: {');
  const exactEntries = Object.entries(index.exact);
  for (let i = 0; i < exactEntries.length; i++) {
    const [k, v] = exactEntries[i];
    const comma = i < exactEntries.length - 1 ? ',' : '';
    lines.push(`    '${k}': ${JSON.stringify(v)}${comma}`);
  }
  lines.push('  },');
  
  // suffix
  lines.push('  suffix: {');
  const suffixEntries = Object.entries(index.suffix);
  for (let i = 0; i < suffixEntries.length; i++) {
    const [k, v] = suffixEntries[i];
    const comma = i < suffixEntries.length - 1 ? ',' : '';
    lines.push(`    '${k}': ${JSON.stringify(v)}${comma}`);
  }
  lines.push('  },');
  
  // keyword
  if (index.keyword && Object.keys(index.keyword).length > 0) {
    lines.push('  keyword: {');
    const kwEntries = Object.entries(index.keyword);
    for (let i = 0; i < kwEntries.length; i++) {
      const [k, v] = kwEntries[i];
      const comma = i < kwEntries.length - 1 ? ',' : '';
      lines.push(`    '${k}': ${JSON.stringify(v)}${comma}`);
    }
    lines.push('  }');
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(',', '');
  }
  
  lines.push('};');
  
  // findByPrefix 函数（单行压缩）
  lines.push(`function findByPrefix(hostname){const h=hostname.toLowerCase();if(PREFIX_INDEX.exact[h])return{ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};for(const[suffix,ids]of Object.entries(PREFIX_INDEX.suffix))if(h.endsWith('.'+suffix)||h===suffix)return{ids,method:'suffix',matched:suffix};if(PREFIX_INDEX.keyword)for(const[kw,ids]of Object.entries(PREFIX_INDEX.keyword))if(h.includes(kw))return{ids,method:'keyword',matched:kw};return null}`);
  
  return lines.join('\n');
}

// 生成 rewrite.conf
function generateRewriteConf() {
  const hostnames = generateHostnames();
  
  let conf = `# Unified VIP Unlock Manager v22
# 构建时间: ${new Date().toISOString()}
# APP数量: ${Object.keys(APP_REGISTRY).length}
# 订阅地址: https://joeshu.github.io/UnifiedVIP/rewrite.conf

[rewrite_local]

`;
  
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    conf += `# ${cfg.name}\n${cfg.urlPattern} url script-response-body https://joeshu.github.io/UnifiedVIP/Unified_VIP_Unlock_Manager_v22.js\n\n`;
  }
  
  conf += `[mitm]\nhostname = ${hostnames.join(', ')}\n`;
  
  return conf;
}

// 主构建流程
function build() {
  console.log('🔨 构建 UnifiedVIP v22\n');
  
  // 步骤1：生成 configs/*.json
  console.log('📦 步骤1: 生成 configs/*.json...');
  const allConfigs = getAllConfigs();
  
  if (!fs.existsSync(CONFIGS_DIR)) {
    fs.mkdirSync(CONFIGS_DIR, { recursive: true });
  }
  
  for (const [appId, config] of Object.entries(allConfigs)) {
    fs.writeFileSync(
      path.join(CONFIGS_DIR, `${appId}.json`), 
      JSON.stringify(config, null, 2)
    );
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

  // 步骤3：组装主脚本
  console.log('📦 步骤3: 组装主脚本...');
  const manifestStr = generateManifestOneLine();
  const prefixCode = generatePrefixIndexMultiLine();
  
  const fullScript = `${generateHeaderMinified()}

// ==========================================
// 1. 内置Manifest (P2压缩)
// ==========================================
const BUILTIN_MANIFEST = ${manifestStr};

// ==========================================
// 2. 前缀索引 (构建时生成)
// ==========================================
${prefixCode}

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
// 12. 配置加载器
// ==========================================
${configLoader}

// ==========================================
// 13. VIP引擎
// ==========================================
${vipEngine}

// ==========================================
// 14. 主入口
// ==========================================
async function main(){
  const rid=Math.random().toString(36).substr(2,6).toUpperCase();
  try{
    let u='';
    if(typeof $request!=='undefined')u=typeof $request==='string'?$request:$request.url||'';
    else if(typeof $response!=='undefined'&&$response)u=$response.url||'';
    if(!u)return $done(typeof $response!=='undefined'&&$response?{body:$response.body}:{});
    Logger.info('Main',rid+'|'+u.split('?')[0].substring(0,60));
    const ml=new SimpleManifestLoader(rid),mf=await ml.load(),cid=mf.findMatch(u);
    if(!cid){Logger.info('Main','No match');return $done(typeof $response!=='undefined'&&$response?{body:$response.body}:{})}
    const cl=new SimpleConfigLoader(rid),cfg=await cl.load(cid,mf.getConfigVersion(cid)),env=new Environment(META.name),eng=new VipEngine(env,rid),res=await eng.process(typeof $response!=='undefined'&&$response?$response.body:'',cfg);
    Logger.info('Main',rid+' done ['+cfg.mode+']');
    $done(res)
  }catch(e){
    Logger.error('Main',rid+' fail:'+e.message);
    $done(typeof $response!=='undefined'&&$response?{body:$response.body}:{})
  }
}
main();
`;

  // 步骤4：写入构建产物
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  
  // 写入主脚本
  const outputPath = path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js');
  fs.writeFileSync(outputPath, fullScript);
  
  // 写入 rewrite.conf
  const rewritePath = path.join(DIST_DIR, 'rewrite.conf');
  fs.writeFileSync(rewritePath, generateRewriteConf());
  
  // 统计信息
  const stats = fs.statSync(outputPath);
  const rewriteStats = fs.statSync(rewritePath);
  
  console.log(`\n✅ 构建成功！`);
  console.log(`   📄 Unified_VIP_Unlock_Manager_v22.js (${(stats.size/1024).toFixed(2)} KB)`);
  console.log(`   📋 rewrite.conf (${(rewriteStats.size/1024).toFixed(2)} KB)`);
  console.log(`   📦 configs/*.json (${Object.keys(allConfigs).length}个)`);
  
  console.log(`\n📋 APP列表:`);
  Object.entries(APP_REGISTRY).forEach(([id, cfg], i) => {
    const icons = {json:'📦',regex:'🔍',forward:'➡️',remote:'🌐',game:'🎮',hybrid:'🔀',html:'📄'};
    console.log(`   ${String(i+1).padStart(2)}. ${icons[cfg.mode]||'⚙️'} ${id.padEnd(12)} ${cfg.name}`);
  });
  
  console.log(`\n🚀 发布:`);
  console.log(`   npm run deploy  # 推送到 GitHub Pages`);
  console.log(`\n📱 使用:`);
  console.log(`   订阅: https://joeshu.github.io/UnifiedVIP/rewrite.conf`);
}

// 运行构建
build();
