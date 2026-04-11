function stableStringify(value) {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function createCompiler(factory) {
  const cache = new Map();

  return function compileProcessor(def) {
    if (!def || !def.processor) return null;

    const cacheKey = Utils.simpleHash(stableStringify(def));
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const processorFactory = factory[def.processor];
    if (!processorFactory) return null;

    const processor = processorFactory(def.params || {}, compileProcessor);
    if (processor) cache.set(cacheKey, processor);
    return processor;
  };
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCompiler };
}
