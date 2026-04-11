// src/engine/vip-engine.js
// VIP引擎 - 增强版 (支持模板替换和 preserveHeaders)

// ==========================================
// Environment 类
// ==========================================
class Environment {
  constructor(name, presetMeta) {
    this.name = name;
    this.isQX = true;

    this.response = (typeof $response !== 'undefined') ? $response : {};
    this.request = (typeof $request !== 'undefined') ? $request : {};

    if (!this.request.url && this.response && this.response.request) {
      this.request = this.response.request;
    }

    this._meta = presetMeta || null;
    this._url = presetMeta && presetMeta.url ? String(presetMeta.url) : null;
  }

  _ensureMeta() {
    if (this._meta) return this._meta;

    let url = (this.response && this.response.url) || (this.request && this.request.url) || '';
    if (typeof $request === 'string') {
      url = $request;
    }
    url = url ? url.toString() : '';

    let hostname = '';
    let pathname = '';
    let search = '';
    try {
      const parsed = new URL(url);
      hostname = (parsed.hostname || '').toLowerCase();
      pathname = parsed.pathname || '';
      search = parsed.search || '';
    } catch (e) {}

    const headers = (this.response && this.response.headers) || (this.request && this.request.headers) || {};
    let contentType = '';
    for (const [k, v] of Object.entries(headers || {})) {
      if (String(k).toLowerCase() === 'content-type') {
        contentType = String(v || '');
        break;
      }
    }

    this._url = url;
    this._meta = {
      url,
      hostname,
      pathname,
      search,
      method: (this.request && this.request.method) ? String(this.request.method).toUpperCase() : '',
      hasResponse: !!(this.response && Object.keys(this.response).length),
      contentType
    };
    return this._meta;
  }

  getUrl() {
    if (this._url != null) return this._url;
    return this._ensureMeta().url || '';
  }

  getHostname() {
    return this._ensureMeta().hostname || '';
  }

  getPathname() {
    return this._ensureMeta().pathname || '';
  }

  getSearch() {
    return this._ensureMeta().search || '';
  }

  getContentType() {
    return this._ensureMeta().contentType || '';
  }

  isResponsePhase() {
    return !!this._ensureMeta().hasResponse;
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
    $done(result);
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
    const normalizedBody = typeof body === 'string' ? body : Utils.safeJsonStringify(body || {});

    if (!config || !config.mode) {
      return { body: normalizedBody };
    }

    // forward/remote 模式不依赖响应 body，必须优先分流，避免空 body 被提前短路
    if (config.mode === 'forward') {
      return await this._processForward(config);
    }
    if (config.mode === 'remote') {
      return await this._processRemote(config);
    }

    if (!normalizedBody) return { body: '{}' };

    const contentType = this.env && this.env.getContentType ? String(this.env.getContentType() || '').toLowerCase() : '';

    switch (config.mode) {
      case 'json':
        if (!this._looksLikeJsonBody(normalizedBody, contentType)) return { body: normalizedBody };
        return this._processJson(normalizedBody, config);
      case 'regex':
        if (!(config._regexReplacements || config.regexReplacements || []).length) return { body: normalizedBody };
        return this._processRegex(normalizedBody, config);
      case 'game':
        if (!(config._gameResources || config.gameResources || []).length) return { body: normalizedBody };
        return this._processGame(normalizedBody, config);
      case 'hybrid':
        return this._processHybrid(normalizedBody, config, contentType);
      case 'html':
        if (!this._looksLikeHtmlBody(normalizedBody, contentType)) return { body: normalizedBody };
        return this._processHtml(normalizedBody, config);
      default:
        return { body: normalizedBody };
    }
  }

  _looksLikeJsonBody(body, contentType) {
    if (!body) return false;
    const firstChar = body[0];
    if (firstChar === '{' || firstChar === '[') return true;
    return contentType.includes('json') || contentType.includes('+json');
  }

  _looksLikeHtmlBody(body, contentType) {
    if (!body) return false;
    if (body.indexOf('<') >= 0) return true;
    return contentType.includes('html') || contentType.includes('xml') || contentType.includes('text/');
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
    const requestHeadersLower = {};
    for (const [k, v] of Object.entries(requestHeaders || {})) {
      requestHeadersLower[String(k).toLowerCase()] = v;
    }

    const forwardHeaders = {};

    if (config.forwardHeaders && typeof config.forwardHeaders === 'object') {
      for (const [key, value] of Object.entries(config.forwardHeaders)) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
          const headerName = value.slice(2, -2).trim().toLowerCase();
          forwardHeaders[key] = requestHeadersLower[headerName] || requestHeaders[headerName] || '';
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
        statusCode,
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
        statusCode: errorCode,
        headers: errorHeaders,
        body: Utils.safeJsonStringify({
          error: 'Request failed',
          message: e.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  _pickHeaderCaseInsensitive(headers, key) {
    if (!headers || !key) return undefined;
    if (headers[key] !== undefined) return headers[key];

    const target = String(key).toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (String(k).toLowerCase() === target) return v;
    }
    return undefined;
  }

  _applyRemoteHeaderPolicy(config, sourceHeaders = {}, responseHeaders = {}) {
    const policy = (config && config.headerPolicy && typeof config.headerPolicy === 'object')
      ? config.headerPolicy
      : {};

    const whitelist = Array.isArray(policy.whitelist)
      ? policy.whitelist
      : (Array.isArray(config.preserveHeaders) ? config.preserveHeaders : []);

    for (const key of whitelist) {
      const value = this._pickHeaderCaseInsensitive(sourceHeaders, key);
      if (value !== undefined) responseHeaders[key] = value;
    }

    if (policy.passContentType !== false) {
      const remoteContentType = this._pickHeaderCaseInsensitive(sourceHeaders, 'content-type');
      if (remoteContentType && !this._pickHeaderCaseInsensitive(responseHeaders, 'content-type')) {
        responseHeaders['Content-Type'] = remoteContentType;
      }
    }

    if (policy.passCacheHeaders === true) {
      ['cache-control', 'etag', 'last-modified', 'expires'].forEach(k => {
        const value = this._pickHeaderCaseInsensitive(sourceHeaders, k);
        if (value !== undefined && this._pickHeaderCaseInsensitive(responseHeaders, k) === undefined) {
          responseHeaders[k] = value;
        }
      });
    }

    if (config.forceHeaders && typeof config.forceHeaders === 'object') {
      Object.assign(responseHeaders, config.forceHeaders);
    }

    if (!this._pickHeaderCaseInsensitive(responseHeaders, 'content-type')) {
      responseHeaders['Content-Type'] = 'application/json; charset=utf-8';
    }

    return responseHeaders;
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

      const responseHeaders = this._applyRemoteHeaderPolicy(
        config,
        response.headers || {},
        {}
      );

      Logger.info('Remote', `Success: ${response.body.length} bytes`);
      return { headers: responseHeaders, body: response.body };

    } catch (e) {
      Logger.error('Remote', `Error: ${e.message}`);
      return {};
    }
  }

  _processJson(body, config) {
    if (!body) return { body };

    const firstChar = body[0];
    if (firstChar !== '{' && firstChar !== '[') {
      return { body };
    }

    let obj = Utils.safeJsonParse(body);
    if (!obj) return { body };

    const processor = config._processor || (config.processor ? (() => {
      const factory = createProcessorFactory(this._requestId);
      const compile = createCompiler(factory);
      return compile(config.processor);
    })() : null);

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

  _processHybrid(body, config, contentType) {
    let result = this._looksLikeJsonBody(body, contentType || '')
      ? this._processJson(body, config)
      : { body };

    if (config._regexReplacements || config.regexReplacements) {
      result = this._processRegex(result.body, config);
    }

    return result;
  }

  _processHtml(body, config) {
    const replacements = config._htmlReplacements || config.htmlReplacements || [];
    if (!replacements.length) return { body };

    let modified = body;

    // 快速短路：规则都无关键字时直接返回，减少 replace 循环
    const markers = config._htmlMarkers || config.htmlMarkers || null;
    if (Array.isArray(markers) && markers.length > 0) {
      const hit = markers.some(m => m && modified.indexOf(m) >= 0);
      if (!hit) return { body: modified };
    }

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