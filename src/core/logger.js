// src/core/logger.js
// 日志系统 - Proxy 代理模式 (与 vip-unlock-configs 一致)

const Logger = (() => {
  const isDebug = typeof CONFIG !== 'undefined' ? CONFIG.DEBUG === true : false;

  if (!isDebug) {
    return new Proxy({}, {
      get: () => () => {}
    });
  }

  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  const metaName = typeof META !== 'undefined' ? META.name : 'UnifiedVIP';

  return {
    info: (tag, msg) => console.log(`[${metaName}][${now()}][INFO][${tag}] ${msg}`),
    error: (tag, msg) => console.log(`[${metaName}][${now()}][ERROR][${tag}] ${msg}`),
    debug: (tag, msg) => {
      if (typeof CONFIG !== 'undefined' && CONFIG.VERBOSE_PATTERN_LOG) {
        console.log(`[${metaName}][${now()}][DEBUG][${tag}] ${msg}`);
      }
    },
    warn: (tag, msg) => console.log(`[${metaName}][${now()}][WARN][${tag}] ${msg}`)
  };
})();

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger };
}