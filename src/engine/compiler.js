// 处理器编译器 - 递归编译处理器定义
function createCompiler(factory) {
  const cache = new Map();

  return function compileProcessor(def) {
    if (!def || !def.processor) {
      return null;
    }

    // 缓存键
    const cacheKey = Utils.simpleHash(JSON.stringify(def));
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // 获取处理器工厂函数
    const factoryFn = factory[def.processor];
    if (!factoryFn) {
      console.error(`Unknown processor: ${def.processor}`);
      return null;
    }

    // 编译处理器（递归）
    const processor = factoryFn(def.params || {}, compileProcessor);
    
    if (processor) {
      cache.set(cacheKey, processor);
    }
    
    return processor;
  };
}
