// src/core/logger.js
// 日志系统 - QX 性能版（全部静默）

const Logger = {
  info: () => {},
  error: () => {},
  debug: () => {},
  warn: () => {}
};

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger };
}
