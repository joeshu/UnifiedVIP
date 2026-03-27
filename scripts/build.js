#!/usr/bin/env node

// scripts/build.js
// 构建脚本 - 生成 Unified_VIP_Unlock_Manager_v22.js 和 rewrite.conf
// 修复: 正确处理 JSON 中的正则转义，避免双重转义问题

const fs = require('fs');
const path = require('path');

// ==========================================
// 目录配置
// ==========================================
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const CONFIGS_DIR = path.join(__dirname, '../configs');

// ==========================================
// 步骤 0: 清理并创建目录
// ==========================================
console.log('📂 步骤 0: 准备目录...');

if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  console.log('  🗑️  清理旧 dist/ 目录');
}

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'configs'), { recursive: true });
console.log('  ✅ 创建 dist/ 和 dist/configs/');

// 确保 configs/ 源目录存在
if (!fs.existsSync(CONFIGS_DIR)) {
  fs.mkdirSync(CONFIGS_DIR, { recursive: true });
  console.log('  ⚠️  创建 configs/ 源目录');
}

// ==========================================
// 加载 APP 注册表和前缀索引生成器
// ==========================================
const { APP_REGISTRY, getAllConfigs, generateRewriteComments } = require('../src/apps/_index');
const { generatePrefixIndex } = require('../src/apps/_prefix-index');

// ==========================================
// 辅助函数: 加载核心模块并移除 CommonJS 导出
// ==========================================
function loadModule(filename) {
  const content = fs.readFileSync(path.join(SRC_DIR, filename), 'utf8');
  return content.replace(/\/\/ CommonJS导出[\s\S]*$/, '').trim();
}

// ==========================================
// 生成器函数
// ==========================================

// 生成头部
function generateHeaderMinified() {
  return `/*
 * ==========================================
 * Unified VIP Unlock Manager v22.0.0-Lazy
 * 构建时间: ${new Date().toISOString()}
 * APP数量: ${Object.keys(APP_REGISTRY).length}
 * ==========================================
 *
 * 订阅规则: https://joeshu.github.io/UnifiedVIP/rewrite.conf
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
  DEBUG: false,
  VERBOSE_PATTERN_LOG: false
};

const META = { name: 'UnifiedVIP', version: '22.0.0-Lazy' };`;
}

// ==========================================
// 生成单行压缩 Manifest (修复双重转义问题)
// ==========================================
function generateManifestOneLine() {
  const configs = {};
  
  // 直接从 configs/*.json 读取原始 urlPattern，避免转义累积
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    let urlPattern = cfg.urlPattern;
    
    // 优先从原始 JSON 文件读取，确保获取正确的未转义值
    if (fs.existsSync(configPath)) {
      try {
        const rawContent = fs.readFileSync(configPath, 'utf8');
        const rawConfig = JSON.parse(rawContent);
        if (rawConfig.urlPattern) {
          urlPattern = rawConfig.urlPattern;
        }
      } catch (e) {
        console.warn(`  ⚠️  读取 ${id}.json 失败，使用 registry 中的 pattern`);
      }
    }
    
    configs[id] = {
      urlPattern: urlPattern,
      configFile: `${id}.json`
    };
  }

  // 关键修复: 手动构建 JSON 字符串，完全控制转义
  // 对每个 urlPattern 单独使用 JSON.stringify，然后拼接
  const entries = [];
  for (const [id, cfg] of Object.entries(configs)) {
    // JSON.stringify 会自动正确转义，不会累积
    const patternStr = JSON.stringify(cfg.urlPattern);
    entries.push(`"${id}":{"urlPattern":${patternStr},"configFile":"${cfg.configFile}"}`);
  }
  
  return `{"version":"22.0.0","updated":"${new Date().toISOString().split('T')[0]}","total":${entries.length},"configs":{${entries.join(',')}}}`;
}

// ==========================================
// 生成 PREFIX_INDEX 代码
// ==========================================
function generatePrefixIndexCode() {
  const index = generatePrefixIndex();
  
  const lines = ['const PREFIX_INDEX = {'];
  
  // exact
  lines.push(' exact: {');
  const exactEntries = Object.entries(index.exact);
  for (let i = 0; i < exactEntries.length; i++) {
    const [k, v] = exactEntries[i];
    const comma = i < exactEntries.length - 1 ? ',' : '';
    lines.push(`  '${k}': ${JSON.stringify(v)}${comma}`);
  }
  lines.push(' },');
  
  // suffix
  lines.push(' suffix: {');
  const suffixEntries = Object.entries(index.suffix);
  for (let i = 0; i < suffixEntries.length; i++) {
    const [k, v] = suffixEntries[i];
    const comma = i < suffixEntries.length - 1 ? ',' : '';
    lines.push(`  '${k}': ${JSON.stringify(v)}${comma}`);
  }
  lines.push(' }');
  
  // keyword (如果有)
  if (index.keyword && Object.keys(index.keyword).length > 0) {
    lines[lines.length - 1] = ' },'; // 修改 suffix 结尾
    lines.push(' keyword: {');
    const kwEntries = Object.entries(index.keyword);
    for (let i = 0; i < kwEntries.length; i++) {
      const [k, v] = kwEntries[i];
      const comma = i < kwEntries.length - 1 ? ',' : '';
      lines.push(`  '${k}': ${JSON.stringify(v)}${comma}`);
    }
    lines.push(' }');
  }
  
  lines.push('};');
  
  // 添加 findByPrefix 函数（单行压缩）
  lines.push(`function findByPrefix(hostname){const h=hostname.toLowerCase();if(PREFIX_INDEX.exact[h])return{ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};for(const[suffix,ids]of Object.entries(PREFIX_INDEX.suffix))if(h.endsWith('.'+suffix)||h===suffix)return{ids,method:'suffix',matched:suffix};if(PREFIX_INDEX.keyword)for(const[kw,ids]of Object.entries(PREFIX_INDEX.keyword))if(h.includes(kw))return{ids,method:'keyword',matched:kw};return null}`);
  
  return lines.join('\n');
}

// ==========================================
// 生成 rewrite.conf
// ==========================================
function generateRewriteConf() {
  // 完整的 hostname 列表
  const hostnames = [
    '59.82.99.78',
    '*.ipalfish.com',
    'service.hhdd.com',
    'apis.lifeweek.com.cn',
    'fluxapi.vvebo.vip',
    'res5.haotgame.com',
    'jsq.mingcalc.cn',
    'theater-api.sylangyue.xyz',
    'api.iappdaily.com',
    'api2.tophub.today',
    'api2.tophub.app',
    'api3.tophub.xyz',
    'api3.tophub.today',
    'api3.tophub.app',
    'tophub.tophubdata.com',
    'tophub2.tophubdata.com',
    'tophub.idaily.today',
    'tophub2.idaily.today',
    'tophub.remai.today',
    'tophub.iappdaiy.com',
    'tophub.ipadown.com',
    'service.gpstool.com',
    'mapi.kouyuxingqiu.com',
    'ss.landintheair.com',
    '*.v2ex.com',
    'apis.folidaymall.com',
    'gateway-api.yizhilive.com',
    'pagead*.googlesyndication.com',
    'api.gotokeep.com',
    'kit.gotokeep.com',
    '*.gotokeep.*',
    '120.53.74.*',
    '162.14.5.*',
    '42.187.199.*',
    '101.42.124.*',
    'javelin.mandrillvr.com',
    'api.banxueketang.com',
    'yzy0916.*.com',
    'yz1018.*.com',
    'yz250907.*.com',
    'yz0320.*.com',
    'cfvip.*.com',
    'yr-game-api.feigo.fun',
    'star.jvplay.cn',
    'iotpservice.smartont.net'
  ].sort();

  let conf = `# Unified VIP Unlock Manager v22.0.0-Lazy
# 构建时间: ${new Date().toISOString()}
# APP数量: ${Object.keys(APP_REGISTRY).length}
# 订阅地址: https://joeshu.github.io/UnifiedVIP/rewrite.conf

[rewrite_local]

`;

  // 获取完整配置以读取 name
  let allConfigs = {};
  try {
    allConfigs = getAllConfigs();
  } catch (e) {
    // 如果读取失败，使用基础配置
    for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
      allConfigs[id] = { name: id, ...cfg };
    }
  }

  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    const name = allConfigs[id]?.name || id;
    conf += `# ${name}\n${cfg.urlPattern} url script-response-body https://joeshu.github.io/UnifiedVIP/Unified_VIP_Unlock_Manager_v22.js\n\n`;
  }

  conf += `[mitm]\nhostname = ${hostnames.join(', ')}\n`;

  return conf;
}

// ==========================================
// 主构建流程
// ==========================================
function build() {
  console.log('\n🔨 构建 UnifiedVIP v22.0.0-Lazy\n');

  // 步骤 1: 读取并合并配置
  console.log('📦 步骤 1: 读取配置...');
  let allConfigs;
  try {
    allConfigs = getAllConfigs();
    console.log(`  ✅ 成功读取 ${Object.keys(allConfigs).length} 个配置`);
  } catch (e) {
    console.error(`  ❌ 读取配置失败: ${e.message}`);
    process.exit(1);
  }

  // 步骤 2: 生成 configs
  console.log('📦 步骤 2: 生成 configs/*.json...');
  let count = 0;
  for (const [appId, config] of Object.entries(allConfigs)) {
    const jsonContent = JSON.stringify(config, null, 2);
    
    // 写入源目录（保留备份）
    fs.writeFileSync(path.join(CONFIGS_DIR, `${appId}.json`), jsonContent);
    
    // 写入 dist 目录（用于部署）
    fs.writeFileSync(path.join(DIST_DIR, 'configs', `${appId}.json`), jsonContent);
    count++;
  }
  console.log(`  ✅ 生成 ${count} 个配置文件`);

  // 步骤 3: 加载核心模块
  console.log('📦 步骤 3: 加载核心模块...');
  const modules = {
    platform: loadModule('core/platform.js'),
    logger: loadModule('core/logger.js'),
    storage: loadModule('core/storage.js'),
    http: loadModule('core/http.js'),
    utils: loadModule('core/utils.js'),
    regexPool: loadModule('engine/regex-pool.js'),
    processorFactory: loadModule('engine/processor-factory.js'),
    compiler: loadModule('engine/compiler.js'),
    manifestLoader: loadModule('engine/manifest-loader.js'),
    configLoader: loadModule('engine/config-loader.js'),
    vipEngine: loadModule('engine/vip-engine.js')
  };
  console.log('  ✅ 加载 11 个核心模块');

  // 步骤 4: 组装主脚本
  console.log('📦 步骤 4: 组装主脚本...');
  
  const manifestStr = generateManifestOneLine();
  const prefixCode = generatePrefixIndexCode();

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
${modules.platform}

// ==========================================
// 4. 日志系统
// ==========================================
${modules.logger}

// ==========================================
// 5. M3存储系统
// ==========================================
${modules.storage}

// ==========================================
// 6. HTTP客户端
// ==========================================
${modules.http}

// ==========================================
// 7. 工具函数
// ==========================================
${modules.utils}

// ==========================================
// 8. 正则缓存池
// ==========================================
${modules.regexPool}

// ==========================================
// 9. 处理器工厂
// ==========================================
${modules.processorFactory}

// ==========================================
// 10. 处理器编译器
// ==========================================
${modules.compiler}

// ==========================================
// 11. Manifest加载器
// ==========================================
${modules.manifestLoader}

// ==========================================
// 12. 配置加载器
// ==========================================
${modules.configLoader}

// ==========================================
// 13. VIP引擎 (包含 Environment 类)
// ==========================================
${modules.vipEngine}

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
 const cl=new SimpleConfigLoader(rid),cfg=await cl.load(cid,mf.getConfigVersion(cid));
 const env=new Environment(META.name);
 const eng=new VipEngine(env,rid);
 const res=await eng.process(typeof $response!=='undefined'&&$response?$response.body:'',cfg);
 Logger.info('Main',rid+' done ['+cfg.mode+']');
 $done(res)
 }catch(e){
 Logger.error('Main',rid+' fail:'+e.message);
 $done(typeof $response!=='undefined'&&$response?{body:$response.body}:{})
 }
}
main();
`;

  // 步骤 5: 写入构建产物
  console.log('📦 步骤 5: 写入构建产物...');
  
  // 写入主脚本
  const outputPath = path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js');
  fs.writeFileSync(outputPath, fullScript);
  const scriptSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  console.log(`  ✅ Unified_VIP_Unlock_Manager_v22.js (${scriptSize} KB)`);
  
  // 验证 tv pattern
  const scriptContent = fs.readFileSync(outputPath, 'utf8');
  const tvMatch = scriptContent.match(/"tv":\{"urlPattern":"([^"]+)"/);
  if (tvMatch) {
    console.log(`  🔍 tv pattern 预览: ${tvMatch[1].substring(0, 60)}...`);
    // 检查是否有双重转义
    if (tvMatch[1].includes('\\\\.')) {
      console.log(`  ⚠️  警告: tv pattern 可能存在双重转义 (\\\\.)`);
    } else if (tvMatch[1].includes('\\.')) {
      console.log(`  ✅ tv pattern 转义正确 (\\.)`);
    }
  }
  
  // 写入 rewrite.conf
  const rewritePath = path.join(DIST_DIR, 'rewrite.conf');
  fs.writeFileSync(rewritePath, generateRewriteConf());
  const rewriteSize = (fs.statSync(rewritePath).size / 1024).toFixed(2);
  console.log(`  ✅ rewrite.conf (${rewriteSize} KB)`);

  // 验证输出
  console.log('\n📋 构建完成：');
  const distFiles = fs.readdirSync(DIST_DIR);
  distFiles.forEach(file => {
    const stat = fs.statSync(path.join(DIST_DIR, file));
    const size = stat.isDirectory() ? '-' : `${(stat.size / 1024).toFixed(2)} KB`;
    console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file.padEnd(40)} ${size}`);
  });
  
  const configCount = fs.readdirSync(path.join(DIST_DIR, 'configs')).filter(f => f.endsWith('.json')).length;
  console.log(`  📦 configs/*.json (${configCount} 个)`);

  console.log('\n🚀 发布命令:');
  console.log('  npm run deploy:manual    # 手动推送到 main');
  console.log('  git push                 # 触发 GitHub Actions 自动部署');
  console.log('\n📎 订阅地址:');
  console.log('  https://joeshu.github.io/UnifiedVIP/rewrite.conf');
}

// 运行构建
build();
