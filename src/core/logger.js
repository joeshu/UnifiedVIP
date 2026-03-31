// src/core/logger.js
// 日志系统 - DEBUG 模式下输出到 QX 控制台

function _log(level, tag, msg) {
  if (typeof CONFIG === 'undefined' || !CONFIG.DEBUG) return;
  if (level === 'debug' && !CONFIG.VERBOSE_PATTERN_LOG) return;
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${ts}][${tag}]`;
  try { console.log(`${prefix} ${msg}`); } catch (e) {}
}

const Logger = {
  info:  (tag, msg) => _log('info', tag, msg),
  error: (tag, msg) => _log('error', tag, msg),
  debug: (tag, msg) => _log('debug', tag, msg),
  warn:  (tag, msg) => _log('warn', tag, msg)
};

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger };
}
