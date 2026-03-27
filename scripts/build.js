// scripts/build.js
// 关键修改：生产环境 DEBUG 设为 false

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
  DEBUG: false,  // 生产环境关闭调试
  VERBOSE_PATTERN_LOG: false
};

const META = { name: 'UnifiedVIP', version: '22.0.0-Lazy' };`;
}
