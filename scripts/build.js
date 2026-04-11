#!/usr/bin/env node

// scripts/build.js
// 构建脚本 - 生成生产版/调试版 JS 与 rewrite.conf

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const { spawnSync } = require('child_process');
const BuildGenerators = require('./build/generators');

// ==========================================
// 构建配置开关（手动编辑这里，不依赖环境变量）
// ==========================================
const BUILD_CONFIG = {
  // 手动开关：true=开启，false=关闭
  ENABLE_DIAGNOSE: false,
  DEBUG_MODE: true,

  // 构建产物压缩级别：off | safe | aggressive
  // off: 不压缩，保留原始格式
  // safe: 去注释行/行尾空白/连续空行（默认，语义安全）
  // aggressive: 在 safe 基础上去除全部空行（体积更小）
  COMPACT_LEVEL: 'safe',

  // 可选手动版本后缀，例如 'lazy' / 'beta'
  // 留空 '' 则使用 package.json.version 原始版本
  VERSION_TAG: '',

  // 版本号（单一来源：package.json，可拼接手动后缀）
  get VERSION() {
    return this.VERSION_TAG ? `${pkg.version}-${this.VERSION_TAG}` : pkg.version;
  }
};

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const CONFIGS_DIR = path.join(__dirname, '../configs');
const RULES_DIR = path.join(__dirname, '../rules');

// ==========================================
// 步骤 0: 清理并创建目录
// ==========================================
console.log('📂 步骤 0: 准备目录...');

if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  console.log('  🗑️ 清理旧 dist/ 目录');
}

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'configs'), { recursive: true });
fs.mkdirSync(CONFIGS_DIR, { recursive: true });
console.log('  ✅ 创建 dist/ 和 dist/configs/');

// 确保 rules/ 目录存在（用于自定义 reject 规则）
if (!fs.existsSync(RULES_DIR)) {
  fs.mkdirSync(RULES_DIR, { recursive: true });
  console.log('  ⚠️ 创建 rules/ 目录（可放置 custom-reject.txt）');
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
// 主构建流程
// ==========================================
function buildScriptArtifact({ BUILD_CONFIG, APP_REGISTRY, modules, prefixIndex, filename }) {
  const manifestStr = BuildGenerators.generateManifestOneLine({ APP_REGISTRY, CONFIGS_DIR, BUILD_CONFIG });
  const prefixCode = BuildGenerators.generatePrefixIndexCode(prefixIndex);
  const diagnoseCode = BuildGenerators.generateDiagnoseFunction(BUILD_CONFIG);

  const fullScript = `${BuildGenerators.generateHeaderMinified({ BUILD_CONFIG, APP_REGISTRY })}

// ==========================================
// 1. 内置Manifest (P2压缩)
// ==========================================
const BUILTIN_MANIFEST = ${manifestStr};

// ==========================================
// 2. 前缀索引 (构建时生成)
// ==========================================
${prefixCode}

// ==========================================
// 3. 日志系统
// ==========================================
${BUILD_CONFIG.DEBUG_MODE ? modules.logger : 'const Logger = { info: () => {}, error: () => {}, debug: () => {}, warn: () => {} };'}

// ==========================================
// 4. M3存储系统
// ==========================================
${modules.storage}

// ==========================================
// 5. HTTP客户端
// ==========================================
${modules.http}

// ==========================================
// 6. 工具函数
// ==========================================
${modules.utils}

// ==========================================
// 7. 正则缓存池
// ==========================================
${modules.regexPool}

// ==========================================
// 8. 处理器工厂
// ==========================================
${modules.processorFactory}

// ==========================================
// 9. 处理器编译器
// ==========================================
${modules.compiler}

// ==========================================
// 10. Manifest加载器
// ==========================================
${modules.manifestLoader}

// ==========================================
// 11. 配置加载器
// ==========================================
${modules.configLoader}

// ==========================================
// 12. VIP引擎 (包含 Environment 类)
// ==========================================
${modules.vipEngine}
${diagnoseCode ? '\n// ==========================================\n// 13. 诊断函数\n// ==========================================\n' + diagnoseCode : ''}

// ==========================================
// ${diagnoseCode ? '14' : '13'}. 主入口
// ==========================================
async function main(){
  const rid=Math.random().toString(36).substr(2,6).toUpperCase();
  try{
    const resp=(typeof $response!=='undefined'&&$response)?$response:null;
    const doneFallback=()=>$done(resp?{body:resp.body}:{});
    let u='';
    if(typeof $request!=='undefined')u=typeof $request==='string'?$request:$request.url||'';
    else if(resp)u=resp.url||'';
    if(!u)return doneFallback();

    Logger.debug('Main',rid+'|'+u.split('?')[0].substring(0,60));

    const g = (typeof globalThis !== 'undefined') ? globalThis : {};
    const ml = g.__UVIP_ML || (g.__UVIP_ML = new SimpleManifestLoader('GLOBAL'));
    const mf = g.__UVIP_MF || (g.__UVIP_MF = await ml.load());
    const cid = mf.findMatch(u);

    if(!cid){
      Logger.debug('Main','No match');
      return doneFallback();
    }

    const cl = g.__UVIP_CL || (g.__UVIP_CL = new SimpleConfigLoader('GLOBAL'));
    const cfg = await cl.load(cid,mf.getConfigVersion(cid));
    const env=new Environment(META.name);

    let eng = g.__UVIP_ENG_IDLE || null;
    if (eng) {
      g.__UVIP_ENG_IDLE = null;
      eng.env = env;
      eng._requestId = rid;
    } else {
      eng = new VipEngine(env,rid);
    }

    const res=await eng.process(resp?resp.body:'',cfg);

    if (!g.__UVIP_ENG_IDLE) {
      eng.env = null;
      eng._requestId = '';
      g.__UVIP_ENG_IDLE = eng;
    }

    Logger.debug('Main',rid+' done ['+cfg.mode+']');
    $done(res)
  }catch(e){
    Logger.error('Main',rid+' fail:'+e.message);
    const resp=(typeof $response!=='undefined'&&$response)?$response:null;
    $done(resp?{body:resp.body}:{})
  }
}
main();
`;

  function compactByLevel(script, level) {
    const lv = String(level || 'safe').toLowerCase();
    if (lv === 'off') return script;

    const lines = script
      .split('\n')
      .map(line => line.replace(/[ \t]+$/g, ''))
      .filter(line => !/^\s*\/\//.test(line));

    if (lv === 'aggressive') return lines.filter(line => line !== '').join('\n');
    return lines.filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n');
  }

  const compactScript = compactByLevel(fullScript, BUILD_CONFIG.COMPACT_LEVEL);
  const outputPath = path.join(DIST_DIR, filename);
  fs.writeFileSync(outputPath, compactScript);
  const scriptSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  return { outputPath, scriptSize };
}

function build() {
  console.log(`\n🔨 构建 UnifiedVIP v${BUILD_CONFIG.VERSION}`);
  console.log(`   诊断功能: ${BUILD_CONFIG.ENABLE_DIAGNOSE ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`   DEBUG模式: ${BUILD_CONFIG.DEBUG_MODE ? '✅ 启用' : '❌ 禁用'}`);
  console.log(`   压缩级别: ${BUILD_CONFIG.COMPACT_LEVEL || 'safe'}\n`);

  // 步骤 1: 读取配置
  console.log('📦 步骤 1: 读取配置...');
  let allConfigs;
  try {
    allConfigs = getAllConfigs();
    console.log(`   ✅ 成功读取 ${Object.keys(allConfigs).length} 个配置`);
  } catch (e) {
    console.error(`   ❌ 读取配置失败: ${e.message}`);
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
  console.log(`   ✅ 生成 ${count} 个配置文件`);

  // 步骤 3: 加载核心模块
  console.log('📦 步骤 3: 加载核心模块...');
  const modules = {
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
  console.log('   ✅ 加载 10 个核心模块');

  // 步骤 4: 组装主脚本
  console.log('📦 步骤 4: 组装主脚本...');

  const prefixIndex = generatePrefixIndex();
  const productionConfig = {
    ...BUILD_CONFIG,
    DEBUG_MODE: false,
    ENABLE_DIAGNOSE: false
  };
  const debugConfig = {
    ...BUILD_CONFIG,
    DEBUG_MODE: true,
    ENABLE_DIAGNOSE: true,
    VERSION_TAG: BUILD_CONFIG.VERSION_TAG ? `${BUILD_CONFIG.VERSION_TAG}-debug` : 'debug'
  };

  console.log('   ℹ️ 生产版: DEBUG=off, diagnose=off');
  console.log('   ℹ️ 调试版: DEBUG=on, diagnose=on');

  // 步骤 5: 写入构建产物
  console.log('📦 步骤 5: 写入构建产物...');

  const production = buildScriptArtifact({
    BUILD_CONFIG: productionConfig,
    APP_REGISTRY,
    modules,
    prefixIndex,
    filename: 'Unified_VIP_Unlock_Manager_v22.js'
  });
  console.log(`   ✅ Unified_VIP_Unlock_Manager_v22.js (${production.scriptSize} KB)`);

  const debug = buildScriptArtifact({
    BUILD_CONFIG: debugConfig,
    APP_REGISTRY,
    modules,
    prefixIndex,
    filename: 'Unified_VIP_Unlock_Manager_v22.debug.js'
  });
  console.log(`   ✅ Unified_VIP_Unlock_Manager_v22.debug.js (${debug.scriptSize} KB)`);

  const scriptContent = fs.readFileSync(production.outputPath, 'utf8');

  // 验证 tv pattern
  const tvMatch = scriptContent.match(/"tv":\{"name":"([^"]*)","urlPattern":"([^"]+)"/);
  if (tvMatch) {
    console.log(`   🔍 tv: ${tvMatch[1]}`);
    console.log(`   🔍 pattern: ${tvMatch[2].substring(0, 60)}...`);
  }

  // 验证诊断函数
  if (BUILD_CONFIG.ENABLE_DIAGNOSE) {
    if (scriptContent.includes('function diagnose(')) {
      console.log(`   ✅ 诊断函数已添加`);
    } else {
      console.log(`   ❌ 诊断函数缺失`);
    }
  }

  const rewritePath = path.join(DIST_DIR, 'rewrite.conf');
  fs.writeFileSync(rewritePath, BuildGenerators.generateRewriteConf({
    BUILD_CONFIG,
    APP_REGISTRY,
    getAllConfigs,
    RULES_DIR
  }));
  const rewriteSize = (fs.statSync(rewritePath).size / 1024).toFixed(2);
  console.log(`   ✅ rewrite.conf (${rewriteSize} KB)`);

  const bench = spawnSync(process.execPath, [path.join(__dirname, 'benchmark-prefix.js'), '--full'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });
  if (bench.status !== 0) {
    console.error('   ❌ benchmark:prefix --full 失败');
    if (bench.stdout) console.error(bench.stdout);
    if (bench.stderr) console.error(bench.stderr);
    process.exit(1);
  }
  console.log('   ✅ benchmark-prefix.md / benchmark-prefix.json 已更新');

  console.log('\n📋 构建完成：');
  const distFiles = fs.readdirSync(DIST_DIR);
  distFiles.forEach(file => {
    const stat = fs.statSync(path.join(DIST_DIR, file));
    const size = stat.isDirectory() ? '-' : `${(stat.size / 1024).toFixed(2)} KB`;
    console.log(`   ${stat.isDirectory() ? '📁' : '📄'} ${file.padEnd(40)} ${size}`);
  });

  const configCount = fs.readdirSync(path.join(DIST_DIR, 'configs')).filter(f => f.endsWith('.json')).length;
  console.log(`   📦 configs/*.json (${configCount} 个)`);
  console.log('   🛠️  调试版脚本: Unified_VIP_Unlock_Manager_v22.debug.js');

  if (BUILD_CONFIG.ENABLE_DIAGNOSE) {
    console.log('\n📋 诊断功能说明:');
    console.log('   1. 在 Quantumult X 中运行脚本');
    console.log('   2. 打开控制台(设置 → 日志)');
    console.log('   3. 输入: diagnose()');
    console.log('   4. 查看详细的匹配过程');
  }

  console.log('\n🚀 发布:');
  console.log('   git add . && git commit -m "build: update v22" && git push');
  console.log('\n📎 订阅: https://joeshu.github.io/UnifiedVIP/rewrite.conf');
}

// 运行构建
build();
