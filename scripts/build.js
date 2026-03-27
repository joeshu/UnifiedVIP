#!/usr/bin/env node

// scripts/build.js
// 构建脚本 - 生成 Unified_VIP_Unlock_Manager_v22.js 和 rewrite.conf

const fs = require('fs');
const path = require('path');

// ==========================================
// 构建配置开关
// ==========================================
const BUILD_CONFIG = {
  // 是否启用诊断功能（生产环境设为 false，调试设为 true）
  ENABLE_DIAGNOSE: false,
  
  // 是否开启 DEBUG 模式（生产环境设为 false）
  DEBUG_MODE: true,
  
  // 版本号
  VERSION: '22.0.0-Lazy'
};

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
const { APP_REGISTRY, getAllConfigs } = require('../src/apps/_index');
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

// 生成头部（根据开关设置 DEBUG）
function generateHeaderMinified() {
  const debugFlag = BUILD_CONFIG.DEBUG_MODE ? 'true' : 'false';
  const verboseFlag = BUILD_CONFIG.DEBUG_MODE ? 'true' : 'false';
  
  return `/*
 * ==========================================
 * Unified VIP Unlock Manager v${BUILD_CONFIG.VERSION}
 * 构建时间: ${new Date().toISOString()}
 * APP数量: ${Object.keys(APP_REGISTRY).length}
 * ==========================================
 *
 * 订阅规则: https://joeshu.github.io/UnifiedVIP/rewrite.conf
${BUILD_CONFIG.ENABLE_DIAGNOSE ? ' * 诊断功能: 在 QX 控制台运行 diagnose() 查看详细匹配信息' : ''}
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
  DEBUG: ${debugFlag},
  VERBOSE_PATTERN_LOG: ${verboseFlag}
};

const META = { name: 'UnifiedVIP', version: '${BUILD_CONFIG.VERSION}' };`;
}

// ==========================================
// 生成单行压缩 Manifest
// ==========================================
function generateManifestOneLine() {
  const configs = {};
  
  for (const [id, baseCfg] of Object.entries(APP_REGISTRY)) {
    const configPath = path.join(CONFIGS_DIR, `${id}.json`);
    
    if (fs.existsSync(configPath)) {
      try {
        const rawContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(rawContent);
        
        configs[id] = {
          name: config.name || id,
          urlPattern: config.urlPattern
        };
      } catch (e) {
        console.warn(`  ⚠️  读取 ${id}.json 失败`);
        configs[id] = {
          name: id,
          urlPattern: baseCfg.urlPattern
        };
      }
    } else {
      configs[id] = {
        name: id,
        urlPattern: baseCfg.urlPattern
      };
    }
  }

  const manifest = {
    version: "22.0.0",
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(configs).length,
    configs: configs
  };

  return JSON.stringify(manifest);
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
    lines[lines.length - 1] = ' },';
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
// 生成诊断函数代码（根据开关决定是否包含）
// ==========================================
function generateDiagnoseFunction() {
  if (!BUILD_CONFIG.ENABLE_DIAGNOSE) {
    return ''; // 如果不启用诊断，返回空字符串
  }
  
  return `
// ==========================================
// 诊断函数 - 在 QX 控制台运行 diagnose() 查看详细匹配信息
// ==========================================
function diagnose(urlToTest) {
  console.log("\\n========================================");
  console.log("UnifiedVIP 诊断工具 v${BUILD_CONFIG.VERSION}");
  console.log("========================================\\n");
  
  const testUrls = urlToTest ? [urlToTest] : [
    "https://yz1018.6vh3qyu9x.com/v2/api/basic/init",
    "https://www.v2ex.com/t/1201518",
    "https://api.gotokeep.com/nuocha/plans"
  ];
  
  // 1. 检查全局变量
  console.log("1. 全局变量检查:");
  console.log("   BUILTIN_MANIFEST 存在:", typeof BUILTIN_MANIFEST !== 'undefined');
  console.log("   PREFIX_INDEX 存在:", typeof PREFIX_INDEX !== 'undefined');
  console.log("   findByPrefix 存在:", typeof findByPrefix === 'function');
  
  if (typeof BUILTIN_MANIFEST !== 'undefined') {
    console.log("   APP总数:", BUILTIN_MANIFEST.total);
    if (BUILTIN_MANIFEST.configs.tv) {
      console.log("   ✅ tv 配置存在");
    } else {
      console.log("   ❌ tv 配置不存在");
    }
  }
  
  // 2. 测试每个 URL
  console.log("\\n2. URL 匹配测试:");
  for (const url of testUrls) {
    console.log("\\n   ----------------------------------------");
    console.log("   测试 URL:", url);
    
    try {
      const hostname = new URL(url).hostname;
      console.log("   提取域名:", hostname);
      
      // 测试 findByPrefix
      if (typeof findByPrefix === 'function') {
        const prefixResult = findByPrefix(hostname);
        if (prefixResult) {
          console.log("   ✅ findByPrefix 成功:", prefixResult.method, "->", JSON.stringify(prefixResult.ids));
          
          // 测试每个候选 APP
          let matched = false;
          for (const id of prefixResult.ids) {
            const cfg = BUILTIN_MANIFEST.configs[id];
            if (!cfg || !cfg.urlPattern) {
              console.log("      " + id + ": ❌ 无 urlPattern");
              continue;
            }
            
            try {
              const regex = new RegExp(cfg.urlPattern);
              const isMatch = regex.test(url);
              console.log("      " + id + ":", isMatch ? "✅ 匹配" : "❌ 不匹配");
              if (isMatch) {
                matched = true;
                console.log("      -> 最终匹配:", id);
                break;
              }
            } catch (e) {
              console.log("      " + id + ": ❌ 正则错误 -", e.message);
            }
          }
          
          if (!matched) {
            console.log("   ⚠️  警告: 前缀匹配成功但无 APP 正则匹配");
          }
        } else {
          console.log("   ❌ findByPrefix 返回 null");
          console.log("   🔍 尝试全量扫描...");
          
          // 全量扫描
          for (const [id, cfg] of Object.entries(BUILTIN_MANIFEST.configs)) {
            if (!cfg.urlPattern) continue;
            try {
              const regex = new RegExp(cfg.urlPattern);
              if (regex.test(url)) {
                console.log("      ✅", id, "匹配成功 (但未通过前缀索引)");
                break;
              }
            } catch (e) {}
          }
        }
      } else {
        console.log("   ❌ findByPrefix 函数不存在");
      }
    } catch (e) {
      console.log("   ❌ 错误:", e.message);
    }
  }
  
  // 3. 显示 PREFIX_INDEX 统计
  console.log("\\n3. PREFIX_INDEX 统计:");
  if (typeof PREFIX_INDEX !== 'undefined') {
    console.log("   exact:", Object.keys(PREFIX_INDEX.exact).length);
    console.log("   suffix:", Object.keys(PREFIX_INDEX.suffix).length);
    console.log("   keyword:", Object.keys(PREFIX_INDEX.keyword || {}).length);
    
    if (PREFIX_INDEX.keyword && PREFIX_INDEX.keyword.yz) {
      console.log("   ✅ keyword['yz']:", JSON.stringify(PREFIX_INDEX.keyword.yz));
    } else {
      console.log("   ❌ keyword['yz'] 不存在");
    }
    
    if (PREFIX_INDEX.keyword && PREFIX_INDEX.keyword.v2ex) {
      console.log("   ✅ keyword['v2ex']:", JSON.stringify(PREFIX_INDEX.keyword.v2ex));
    } else {
      console.log("   ❌ keyword['v2ex'] 不存在");
    }
  }
  
  console.log("\\n========================================");
  console.log("诊断结束");
  console.log("========================================\\n");
  
  return { success: true };
}

// 如果 URL 包含 diagnose=1 参数，自动运行诊断
if (typeof $request !== 'undefined') {
  const url = typeof $request === 'string' ? $request : ($request.url || '');
  if (url.includes('diagnose=1')) {
    diagnose();
    // 诊断后不执行主逻辑，直接返回
    $done({});
  }
}
`;
}

// ==========================================
// 生成 rewrite.conf
// ==========================================
function generateRewriteConf() {
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

  let conf = `# Unified VIP Unlock Manager v${BUILD_CONFIG.VERSION}
# 构建时间: ${new Date().toISOString()}
# APP数量: ${Object.keys(APP_REGISTRY).length}
# 订阅地址: https://joeshu.github.io/UnifiedVIP/rewrite.conf
${BUILD_CONFIG.ENABLE_DIAGNOSE ? '# 诊断功能: 在 QX 控制台运行 diagnose() 查看详细匹配信息' : ''}

[rewrite_local]

`;

  let allConfigs = {};
  try {
    allConfigs = getAllConfigs();
  } catch (e) {
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
  console.log(`\n🔨 构建 UnifiedVIP v${BUILD_CONFIG.VERSION}`);
  console.log(`   诊断功能: ${BUILD_CONFIG.ENABLE_DIAGNOSE ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`   DEBUG模式: ${BUILD_CONFIG.DEBUG_MODE ? '✅ 启用' : '❌ 禁用'}\n`);

  // 步骤 1: 读取配置
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
    fs.writeFileSync(path.join(CONFIGS_DIR, `${appId}.json`), jsonContent);
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
  if (BUILD_CONFIG.ENABLE_DIAGNOSE) {
    console.log('  ℹ️  诊断函数已启用');
  }
  
  const manifestStr = generateManifestOneLine();
  const prefixCode = generatePrefixIndexCode();
  const diagnoseCode = generateDiagnoseFunction();

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
${diagnoseCode ? '\n// ==========================================\n// 14. 诊断函数\n// ==========================================\n' + diagnoseCode : ''}

// ==========================================
// ${diagnoseCode ? '15' : '14'}. 主入口
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
  
  const outputPath = path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js');
  fs.writeFileSync(outputPath, fullScript);
  const scriptSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  console.log(`  ✅ Unified_VIP_Unlock_Manager_v22.js (${scriptSize} KB)`);
  
  // 验证
  const scriptContent = fs.readFileSync(outputPath, 'utf8');
  
  // 验证 tv pattern
  const tvMatch = scriptContent.match(/"tv":\{"name":"([^"]*)","urlPattern":"([^"]+)"/);
  if (tvMatch) {
    console.log(`  🔍 tv: ${tvMatch[1]}`);
    console.log(`  🔍 pattern: ${tvMatch[2].substring(0, 60)}...`);
  }
  
  // 验证诊断函数
  if (BUILD_CONFIG.ENABLE_DIAGNOSE) {
    if (scriptContent.includes('function diagnose(')) {
      console.log(`  ✅ 诊断函数已添加`);
    } else {
      console.log(`  ❌ 诊断函数缺失`);
    }
  }
  
  const rewritePath = path.join(DIST_DIR, 'rewrite.conf');
  fs.writeFileSync(rewritePath, generateRewriteConf());
  const rewriteSize = (fs.statSync(rewritePath).size / 1024).toFixed(2);
  console.log(`  ✅ rewrite.conf (${rewriteSize} KB)`);

  console.log('\n📋 构建完成：');
  const distFiles = fs.readdirSync(DIST_DIR);
  distFiles.forEach(file => {
    const stat = fs.statSync(path.join(DIST_DIR, file));
    const size = stat.isDirectory() ? '-' : `${(stat.size / 1024).toFixed(2)} KB`;
    console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file.padEnd(40)} ${size}`);
  });
  
  const configCount = fs.readdirSync(path.join(DIST_DIR, 'configs')).filter(f => f.endsWith('.json')).length;
  console.log(`  📦 configs/*.json (${configCount} 个)`);

  if (BUILD_CONFIG.ENABLE_DIAGNOSE) {
    console.log('\n📋 诊断功能说明:');
    console.log('  1. 在 Quantumult X 中运行脚本');
    console.log('  2. 打开控制台(设置 → 日志)');
    console.log('  3. 输入: diagnose()');
    console.log('  4. 查看详细的匹配过程');
  }

  console.log('\n🚀 发布:');
  console.log('  git add . && git commit -m "build: update v22" && git push');
  console.log('\n📎 订阅: https://joeshu.github.io/UnifiedVIP/rewrite.conf');
}

// 运行构建
build();
