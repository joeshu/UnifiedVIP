// src/engine/vip-engine.js
// VIP引擎 - 使用预编译的规则

class VipEngine {
  constructor(env, requestId) {
    this.env = env;
    this._requestId = requestId;
  }

  async process(body, config) {
    if (!body) return { body: '{}' };

    const bodySize = typeof body === 'string' ? body.length : Utils.safeJsonStringify(body).length;
    const maxSize = typeof CONFIG !== 'undefined' ? CONFIG.MAX_BODY_SIZE : 5 * 1024 * 1024;
    
    if (bodySize > maxSize) {
      return { body: typeof body === 'string' ? body : Utils.safeJsonStringify(body) };
    }

    switch (config.mode) {
      case 'forward':
        return await this._processForward(config);
      case 'remote':
        return await this._processRemote(config);
      case 'json':
        return this._processJson(body, config);
      case 'regex':
        return this._processRegex(body, config);
      case 'game':
        return this._processGame(body, config);
      case 'hybrid':
        return this._processHybrid(body, config);
      case 'html':
        return this._processHtml(body, config);
      default:
        return { body };
    }
  }

  // ... _processForward 和 _processRemote 保持不变 ...

  _processJson(body, config) {
    let obj = Utils.safeJsonParse(body);
    if (!obj) return { body };

    const factory = createProcessorFactory(this._requestId);
    const compile = createCompiler(factory);
    const processor = config.processor ? compile(config.processor) : null;

    if (typeof processor === 'function') {
      try {
        obj = processor(obj, this.env);
        Logger.info('VipEngine', `${config.name || 'VIP'} unlocked`);
      } catch (e) {
        Logger.error('VipEngine', `Processor error: ${e.message}`);
      }
    }

    return { body: Utils.safeJsonStringify(obj) };
  }

  // 修复：使用预编译的 _regexReplacements
  _processRegex(body, config) {
    let modified = body;
    // 优先使用预编译的规则
    const replacements = config._regexReplacements || config.regexReplacements || [];
    
    for (const rule of replacements) {
      try {
        // 预编译的 rule.pattern 已经是 RegExp 对象
        const regex = rule.pattern instanceof RegExp ? rule.pattern : RegexPool.get(rule.pattern, rule.flags || 'g');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {}
    }
    
    return { body: modified };
  }

  // 修复：使用预编译的 _gameResources
  _processGame(body, config) {
    let modified = body;
    // 优先使用预编译的规则
    const resources = config._gameResources || config.gameResources || [];
    
    for (const res of resources) {
      try {
        // 预编译的 res.pattern 已经是 RegExp 对象
        const regex = res.pattern instanceof RegExp ? res.pattern : RegexPool.get(`"${res.field}":\\d+`, 'g');
        modified = modified.replace(regex, `"${res.field}":${res.value}`);
      } catch (e) {}
    }
    
    return { body: modified };
  }

  _processHybrid(body, config) {
    let result = this._processJson(body, config);
    
    if (config.regexReplacements || config._regexReplacements) {
      result = this._processRegex(result.body, config);
    }
    
    return result;
  }

  // 修复：使用预编译的 _htmlReplacements
  _processHtml(body, config) {
    let modified = body;
    // 优先使用预编译的规则
    const replacements = config._htmlReplacements || config.htmlReplacements || [];
    
    for (const rule of replacements) {
      try {
        const regex = rule.pattern instanceof RegExp ? rule.pattern : RegexPool.get(rule.pattern, rule.flags || 'gi');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {}
    }
    
    return { body: modified };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Environment, VipEngine };
}