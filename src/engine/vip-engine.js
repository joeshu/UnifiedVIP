// ==========================================
// VIP引擎 - 8种处理模式
// ==========================================

class Environment {
  constructor(name) {
    this.name = name;
    this.isQX = typeof Platform !== 'undefined' ? Platform.isQX : false;
    this.isSurge = typeof Platform !== 'undefined' ? Platform.isSurge : false;
    this.isLoon = typeof Platform !== 'undefined' ? Platform.isLoon : false;

    this.response = (typeof $response !== 'undefined') ? $response : {};
    this.request = (typeof $request !== 'undefined') ? $request : {};

    if (!this.request.url && this.response && this.response.request) {
      this.request = this.response.request;
    }
  }

  getUrl() {
    let url = (this.response && this.response.url) || (this.request && this.request.url) || '';
    if (this.isQX && typeof $request === 'string') {
      url = $request;
    }
    return url.toString();
  }

  getBody() {
    return (this.response && this.response.body) || '';
  }

  getRequestHeaders() {
    return (this.request && this.request.headers) || {};
  }

  getRequestBody() {
    return (this.request && this.request.body) || '';
  }

  done(result) {
    if (typeof $done === 'function') {
      $done(result);
    } else {
      console.log('[DONE]', result);
    }
  }
}

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

  async _processForward(config) {
    const options = {
      url: config.forwardUrl,
      method: config.method || 'POST',
      headers: config.forwardHeaders || {},
      body: this.env.getRequestBody(),
      timeout: config.timeout || 10000
    };

    Logger.info('Forward', `Forwarding to ${options.url}`);

    try {
      const response = await HTTP.post(options);
      const statusCode = response.statusCode || 200;
      const statusText = (config.statusTexts || {})[String(statusCode)] || 'OK';

      return {
        status: `HTTP/1.1 ${statusCode} ${statusText}`,
        headers: config.responseHeaders || {},
        body: response.body
      };
    } catch (e) {
      Logger.error('Forward', `Failed: ${e.message}`);
      return {
        status: 'HTTP/1.1 500 Internal Server Error',
        headers: config.responseHeaders || {},
        body: Utils.safeJsonStringify({ error: e.message })
      };
    }
  }

  async _processRemote(config) {
    if (!config.remoteUrl) {
      Logger.error('Remote', 'Missing remoteUrl');
      return {};
    }

    try {
      const response = await HTTP.get(config.remoteUrl, config.timeout || 10000);
      
      if (response.statusCode !== 200) {
        return {};
      }

      if (config.validateJson !== false) {
        try {
          JSON.parse(response.body);
        } catch (e) {
          return {};
        }
      }

      const headers = {};
      if (config.forceHeaders) {
        Object.assign(headers, config.forceHeaders);
      }
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json; charset=utf-8';
      }

      return { headers, body: response.body };
    } catch (e) {
      Logger.error('Remote', `Error: ${e.message}`);
      return {};
    }
  }

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

  _processRegex(body, config) {
    let modified = body;
    const replacements = config.regexReplacements || [];
    
    for (const rule of replacements) {
      try {
        const regex = RegexPool.get(rule.pattern, rule.flags || 'g');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {}
    }
    
    return { body: modified };
  }

  _processGame(body, config) {
    let modified = body;
    const resources = config.gameResources || [];
    
    for (const res of resources) {
      try {
        const pattern = RegexPool.get(`"${res.field}":\\d+`, 'g');
        modified = modified.replace(pattern, `"${res.field}":${res.value}`);
      } catch (e) {}
    }
    
    return { body: modified };
  }

  _processHybrid(body, config) {
    // 先JSON处理
    let result = this._processJson(body, config);
    
    // 再正则处理
    if (config.regexReplacements) {
      result = this._processRegex(result.body, config);
    }
    
    return result;
  }

  _processHtml(body, config) {
    let modified = body;
    const replacements = config.htmlReplacements || [];
    
    for (const rule of replacements) {
      try {
        const regex = RegexPool.get(rule.pattern, rule.flags || 'gi');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {}
    }
    
    return { body: modified };
  }
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Environment, VipEngine };
}
