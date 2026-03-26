#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { APP_REGISTRY, getAllConfigs } = require('../src/apps/_index');

function validate() {
  console.log('🔍 验证配置...\n');
  
  const errors = [];
  
  // 1. 检查APP_REGISTRY完整性
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    if (!cfg.name) errors.push(`${id}: 缺少 name`);
    if (!cfg.urlPattern) errors.push(`${id}: 缺少 urlPattern`);
    if (!cfg.mode) errors.push(`${id}: 缺少 mode`);
    if (!cfg.config) errors.push(`${id}: 缺少 config`);
    
    // 检查urlPattern是否合法正则
    try {
      new RegExp(cfg.urlPattern);
    } catch (e) {
      errors.push(`${id}: urlPattern 正则错误 - ${e.message}`);
    }
    
    // 检查mode有效性
    const validModes = ['json', 'regex', 'forward', 'remote', 'game', 'hybrid', 'html'];
    if (!validModes.includes(cfg.mode)) {
      errors.push(`${id}: 无效 mode "${cfg.mode}"`);
    }
  }
  
  // 2. 检查生成的配置
  const allConfigs = getAllConfigs();
  for (const [id, cfg] of Object.entries(allConfigs)) {
    // 检查config内容
    if (cfg.mode === 'json' && !cfg.processor) {
      errors.push(`${id}: json模式缺少 processor`);
    }
    if (cfg.mode === 'regex' && !cfg.regexReplacements) {
      errors.push(`${id}: regex模式缺少 regexReplacements`);
    }
    if (cfg.mode === 'forward' && !cfg.forwardUrl) {
      errors.push(`${id}: forward模式缺少 forwardUrl`);
    }
    if (cfg.mode === 'game' && !cfg.gameResources) {
      errors.push(`${id}: game模式缺少 gameResources`);
    }
    if (cfg.mode === 'html' && !cfg.htmlReplacements) {
      errors.push(`${id}: html模式缺少 htmlReplacements`);
    }
  }
  
  // 3. 检查重复ID
  const ids = Object.keys(APP_REGISTRY);
  const uniqueIds = [...new Set(ids)];
  if (ids.length !== uniqueIds.length) {
    errors.push('APP_REGISTRY 中有重复的ID');
  }
  
  // 输出结果
  if (errors.length === 0) {
    console.log('✅ 验证通过！');
    console.log(`   APP数量: ${ids.length}`);
    console.log(`   模式分布:`);
    const modeCount = {};
    Object.values(APP_REGISTRY).forEach(c => {
      modeCount[c.mode] = (modeCount[c.mode] || 0) + 1;
    });
    Object.entries(modeCount).forEach(([m, c]) => {
      console.log(`     ${m}: ${c}`);
    });
    return 0;
  } else {
    console.log(`❌ 发现 ${errors.length} 个错误:\n`);
    errors.forEach(e => console.log(`   - ${e}`));
    return 1;
  }
}

process.exit(validate());
