// src/core/logger.js
// 日志系统 - 仅基于 CONFIG.DEBUG + 采样

const Logger = (() => {
  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const metaName = typeof META !== 'undefined' ? META.name : 'UnifiedVIP';

  const normalizeTagSet = () => {
    const tags = (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.LOG_ALWAYS_TAGS))
      ? CONFIG.LOG_ALWAYS_TAGS
      : [];
    return new Set(tags.map(t => String(t)));
  };

  const alwaysTags = normalizeTagSet();

  const getSampleRate = () => {
    const v = typeof CONFIG !== 'undefined' ? Number(CONFIG.LOG_SAMPLE_RATE) : NaN;
    if (!Number.isFinite(v)) return 1;
    if (v <= 0) return 0;
    if (v >= 1) return 1;
    return v;
  };

  const isDebugEnabled = () => {
    return typeof CONFIG !== 'undefined' && CONFIG.DEBUG === true;
  };

  const canLogBySampling = (tag, level) => {
    if (level === 'ERROR') return true;
    if (level === 'WARN') return true;
    if (alwaysTags.has(String(tag))) return true;

    const rate = getSampleRate();
    if (rate >= 1) return true;
    if (rate <= 0) return false;
    return Math.random() < rate;
  };

  const print = (level, tag, msg) => {
    if (!canLogBySampling(tag, level)) return;
    console.log(`[${metaName}][${now()}][${level}][${tag}] ${msg}`);
  };

  return {
    info: (tag, msg) => {
      if (!isDebugEnabled()) return;
      print('INFO', tag, msg);
    },
    error: (tag, msg) => print('ERROR', tag, msg),
    debug: (tag, msg) => {
      if (!isDebugEnabled()) return;
      const verbose = typeof CONFIG !== 'undefined' && CONFIG.VERBOSE_PATTERN_LOG;
      if (!verbose) return;
      print('DEBUG', tag, msg);
    },
    warn: (tag, msg) => {
      if (!isDebugEnabled()) return;
      print('WARN', tag, msg);
    }
  };
})();

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger };
}
