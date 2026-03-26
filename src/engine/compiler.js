function createCompiler(factory) {
  const cache = new Map();

  return function compileProcessor(def) {
    if (!def || !def.processor) return null;

    const cacheKey = Utils.simpleHash(Utils.safeJsonStringify(def));
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const processorFactory = factory[def.processor];
    if (!processorFactory) return null;

    const processor = processorFactory(def.params, compileProcessor);
    if (processor) cache.set(cacheKey, processor);
    return processor;
  };
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCompiler };
}
