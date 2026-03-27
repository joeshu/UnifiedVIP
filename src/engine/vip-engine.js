// src/engine/vip-engine.js
// VIP引擎 - 增强版 (支持模板替换和 preserveHeaders)

// ==========================================
// Environment 类
// ==========================================
class Environment {
  constructor(name) {
    this.name = name;
    this.isQX = typeof Platform !== 'undefined' ? Platform.isQX : false;
    this.isSurge = typeof Platform !== 'undefined' ? Platform.isSurge : false;
    this.isLoon = typeof Platform !== 'undefined' ? Platform.isLoon : false;
    this.isStash = typeof Platform !== 'undefined' ? Platform.isStash : false;

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

// ==========================================
// VipEngine 类
// ==========================================
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
    const statusTexts = config.statusTexts || {
      '200': 'OK',
      '201': 'Created',
      '204': 'No Content',
      '400': 'Bad Request',
      '401': 'Unauthorized',
      '403': 'Forbidden',
      '404': 'Not Found',
      '500': 'Internal Server Error',
      '502': 'Bad Gateway',
      '503': 'Service Unavailable'
    };

    // 支持 {{header}} 模板替换
    const requestHeaders = this.env.getRequestHeaders();
    const forwardHeaders = {};

    if (config.forwardHeaders && typeof config.forwardHeaders === 'object') {
      for (const [key, value] of Object.entries(config.forwardHeaders)) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
          const headerName = value.slice(2, -2).toLowerCase();
          forwardHeaders[key] = requestHeaders[headerName] || '';
        } else {
          forwardHeaders[key] = value;
        }
      }
    }

    const options = {
      url: config.forwardUrl,
      method: config.method || 'POST',
      headers: forwardHeaders,
      body: this.env.getRequestBody(),
      timeout: config.timeout || 10000
    };

    Logger.info('Forward', `Forwarding to ${options.url}`);

    try {
      const response = await HTTP.post(options);
      const statusCode = response.statusCode || 200;
      const statusText = statusTexts[String(statusCode)] || 'Unknown';

      const responseHeaders = {};
      if (config.responseHeaders && typeof config.responseHeaders === 'object') {
        Object.assign(responseHeaders, config.responseHeaders);
      }

      return {
        status: `HTTP/1.1 ${statusCode} ${statusText}`,
        headers: responseHeaders,
        body: response.body
      };
    } catch (e) {
      Logger.error('Forward', `Failed: ${e.message}`);
      const errorCode = 500;
      const errorText = statusTexts[String(errorCode)] || 'Internal Server Error';
      const errorHeaders = config.responseHeaders ? Object.assign({}, config.responseHeaders) : {};

      return {
        status: `HTTP/1.1 ${errorCode} ${errorText}`,
        headers: errorHeaders,
        body: Utils.safeJsonStringify({
          error: 'Request failed',
          message: e.message,
          timestamp: new Date().toISOString()
        })
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

      if (response.statusCode !== 200 || !response.body) {
        return {};
      }

      if (config.validateJson !== false) {
        try {
          JSON.parse(response.body);
        } catch (e) {
          return {};
        }
      }

      const responseHeaders = {};

      // 支持 preserveHeaders
      if (config.preserveHeaders && Array.isArray(config.preserveHeaders)) {
        const originalHeaders = (typeof $response !== 'undefined' && $response) ?
          $response.headers : {};
        for (const key of config.preserveHeaders) {
          if (originalHeaders[key]) {
            responseHeaders[key] = originalHeaders[key];
          }
        }
      }

      if (config.forceHeaders && typeof config.forceHeaders === 'object') {
        Object.assign(responseHeaders, config.forceHeaders);
      }

      if (!responseHeaders['Content-Type'] && !responseHeaders['content-type']) {
        responseHeaders['Content-Type'] = 'application/json; charset=utf-8';
      }

      Logger.info('Remote', `Success: ${response.body.length} bytes`);
      return { headers: responseHeaders, body: response.body };

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
    const replacements = config._regexReplacements || config.regexReplacements || [];

    for (const rule of replacements) {
      try {
        const regex = rule.pattern instanceof RegExp ? rule.pattern : RegexPool.get(rule.pattern, rule.flags || 'g');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {}
    }

    return { body: modified };
  }

  _processGame(body, config) {
    let modified = body;
    const resources = config._gameResources || config.gameResources || [];

    for (const res of resources) {
      try {
        const regex = res.pattern instanceof RegExp ? res.pattern : RegexPool.get(`"${res.field}":\\d+`, 'g');
        modified = modified.replace(regex, `"${res.field}":${res.value}`);
      } catch (e) {}
    }

    return { body: modified };
  }

  _processHybrid(body, config) {
    let result = this._processJson(body, config);

    if (config._regexReplacements || config.regexReplacements) {
      result = this._processRegex(result.body, config);
    }

    return result;
  }

  _processHtml(body, config) {
    let modified = body;
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

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Environment, VipEngine };
}
