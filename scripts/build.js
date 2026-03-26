// scripts/build.js

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
  
  // 压缩为一行
  return JSON.stringify(manifest);
}

// 生成精简头部
function generateHeaderMinified() {
  return `// UnifiedVIP v22.0.0 | ${new Date().toISOString().split('T')[0]} | ${Object.keys(APP_REGISTRY).length} apps | DEBUG:ON
// Sub: https://joeshu.github.io/UnifiedVIP/rewrite.conf
'use strict';if(typeof console==='undefined')globalThis.console={log:()=>{}};
const CONFIG={REMOTE_BASE:'https://joeshu.github.io/UnifiedVIP',CONFIG_CACHE_TTL:864e5,MAX_BODY_SIZE:5242880,MAX_PROCESSORS_PER_REQUEST:30,TIMEOUT:10,DEBUG:true,VERBOSE_PATTERN_LOG:false};
const META={name:'UnifiedVIP',version:'22.0.0-Lazy'};`;
}

// 生成 PREFIX_INDEX（每个数组一行）
function generatePrefixIndexMultiLine() {
  const index = generatePrefixIndex();
  
  // 构建多行格式
  let lines = ['const PREFIX_INDEX = {'];
  
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
  
  // keyword（如果有）
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
    lines[lines.length - 1] = lines[lines.length - 1].replace(',', ''); // 移除suffix的逗号
  }
  
  lines.push('};');
  
  // 添加 findByPrefix 函数（单行压缩）
  lines.push(`function findByPrefix(hostname){const h=hostname.toLowerCase();if(PREFIX_INDEX.exact[h])return{ids:PREFIX_INDEX.exact[h],method:'exact',matched:h};for(const[suffix,ids]of Object.entries(PREFIX_INDEX.suffix))if(h.endsWith('.'+suffix)||h===suffix)return{ids,method:'suffix',matched:suffix};if(PREFIX_INDEX.keyword)for(const[kw,ids]of Object.entries(PREFIX_INDEX.keyword))if(h.includes(kw))return{ids,method:'keyword',matched:kw};return null}`);
  
  return lines.join('\n');
}

// 生成 rewrite.conf
function generateRewriteConf() {
  const hostnames = generateHostnames();
  const base = 'https://joeshu.github.io/UnifiedVIP';
  
  let conf = `# UnifiedVIP v22 | ${new Date().toISOString().split('T')[0]}
# Sub: ${base}/rewrite.conf

[rewrite_local]

`;
  
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    conf += `# ${cfg.name}\n${cfg.urlPattern} url script-response-body ${base}/Unified_VIP_Unlock_Manager_v22.js\n\n`;
  }
  
  conf += `[mitm]\nhostname = ${hostnames.join(', ')}\n`;
  
  return conf;
}

// 主构建
function build() {
  console.log('🔨 构建 UnifiedVIP v22\n');
  
  // 步骤1：生成 configs
  console.log('📦 生成 configs/*.json...');
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
  console.log(`   ✅ ${Object.keys(allConfigs).length} 个配置`);
  
  // 步骤2：加载模块
  console.log('📦 加载模块...');
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

  // 步骤3：组装
  console.log('📦 组装脚本...');
  const manifestStr = generateManifestOneLine();
  const prefixCode = generatePrefixIndexMultiLine();
  
  const fullScript = `${generateHeaderMinified()}

// BUILTIN_MANIFEST (P2压缩)
const BUILTIN_MANIFEST = ${manifestStr};

${prefixCode}

// Core & Engine
${platform}

${logger}

${storage}

${http}

${utils}

${regexPool}

${processorFactory}

${compiler}

${manifestLoader}

${configLoader}

${vipEngine}

// Main
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

  // 写入
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
  
  fs.writeFileSync(
    path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js'), 
    fullScript
  );
  
  fs.writeFileSync(
    path.join(DIST_DIR, 'rewrite.conf'), 
    generateRewriteConf()
  );
  
  // 统计
  const stats = fs.statSync(path.join(DIST_DIR, 'Unified_VIP_Unlock_Manager_v22.js'));
  console.log(`\n✅ 完成`);
  console.log(`   📄 Unified_VIP_Unlock_Manager_v22.js (${(stats.size/1024).toFixed(2)} KB)`);
  console.log(`   📋 rewrite.conf`);
  console.log(`   📦 configs/*.json (${Object.keys(allConfigs).length}个)`);
}

build();
