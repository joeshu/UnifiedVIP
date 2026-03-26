// VIP处理引擎 - 支持所有模式
class VipEngine {
  constructor(env, requestId) {
    this.env = env;
    this._requestId = requestId;
  }

  async process(body, config) {
    if (!body) {
      return { body: '{}' };
    }

    // 检查body大小
    const bodySize = typeof body === 'string' ? 
      body.length : 
      Utils.safeJsonStringify(body).length;
    
    if (bodySize > CONFIG.MAX_BODY_SIZE) {
      Logger.warn('VipEngine', 'Body too large, skipping');
      return { 
        body: typeof body === 'string' ? body : Utils.safeJsonStringify(body) 
      };
    }

    // 根据模式分发处理
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
        Logger.warn('VipEngine', `Unknown mode: ${config.mode}`);
        return { body };
    }
  }

  // Forward模式 - 请求转发
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

    // 准备请求头
    const requestHeaders = this.env.getRequestHeaders ? this.env.getRequestHeaders() : {};
    const forwardHeaders = {};

    if (config.forwardHeaders) {
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
      body: this.env.getRequestBody ? this.env.getRequestBody() : '',
      timeout: config.timeout || 10000
    };

    Logger.info('Forward', `Forwarding to ${options.url}`);

    try {
      const response = await HTTP.post(options);
      const statusCode = response.statusCode || 200;
      const statusText = statusTexts[String(statusCode)] || 'Unknown';

      const responseHeaders = {};
      if (config.responseHeaders) {
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
      
      return {
        status: `HTTP/1.1 ${errorCode} ${errorText}`,
        headers: config.responseHeaders || {},
        body: Utils.safeJsonStringify({
          error: 'Request failed',
          message: e.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  // Remote模式 - 远程替换
  async _processRemote(config) {
    if (!config.remoteUrl) {
      Logger.error('Remote', 'Missing remoteUrl');
      return {};
    }

    try {
      const response = await HTTP.get(config.remoteUrl, config.timeout || 10000);

      if (response.statusCode !== 200 || !response.body) {
        Logger.warn('Remote', `Failed with status ${response.statusCode}`);
        return {};
      }

      // 验证JSON
      if (config.validateJson !== false) {
        try {
          JSON.parse(response.body);
        } catch (e) {
          Logger.error('Remote', 'Invalid JSON response');
          return {};
        }
      }

      // 准备响应头
      const responseHeaders = {};
      
      if (config.preserveHeaders && this.env.response) {
        const originalHeaders = this.env.response.headers || {};
        for (const key of config.preserveHeaders) {
          if (originalHeaders[key]) {
            responseHeaders[key] = originalHeaders[key];
          }
        }
      }

      if (config.forceHeaders) {
        Object.assign(responseHeaders, config.forceHeaders);
      }

      if (!responseHeaders['Content-Type'] && !responseHeaders['content-type']) {
        responseHeaders['Content-Type'] = 'application/json; charset=utf-8';
      }

      Logger.info('Remote', `Success: ${response.body.length} bytes`);
      
      return {
        headers: responseHeaders,
        body: response.body
      };

    } catch (e) {
      Logger.error('Remote', `Error: ${e.message}`);
      return {};
    }
  }

  // JSON模式 - 处理器链
  _processJson(body, config) {
    let obj = Utils.safeJsonParse(body);
    if (!obj) {
      Logger.warn('VipEngine', 'Failed to parse JSON');
      return { body };
    }

    // 创建处理器工厂和编译器
    const factory = createProcessorFactory(this._requestId);
    const compile = createCompiler(factory);

    // 编译主处理器
    let processor = null;
    
    if (config.processor === 'sceneDispatcher' && config.scenes) {
      // sceneDispatcher特殊处理
      processor = factory.sceneDispatcher({ scenes: config.scenes }, compile);
    } else if (config.processor === 'when' && (config.then || config.else)) {
      // when条件处理
      processor = factory.when({
        condition: config.condition,
        check: config.check,
        path: config.path,
        param: config.param,
        value: config.value,
        then: config.then,
        else: config.else
      }, compile);
    } else if (config.processor === 'compose' && config.steps) {
      // compose组合处理
      processor = factory.compose({ steps: config.steps }, compile);
    } else if (config.processor && factory[config.processor]) {
      // 简单处理器
      processor = factory[config.processor]({ 
        fields: config.fields,
        path: config.path,
        params: config.params 
      }, compile);
    }

    // 执行处理器
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

  // Regex模式 - 正则替换
  _processRegex(body, config) {
    let modified = body;
    const replacements = config.regexReplacements || [];
    
    for (const rule of replacements) {
      try {
        const regex = RegexPool.get(rule.pattern, rule.flags || 'g');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {
        Logger.error('VipEngine', `Regex error: ${e.message}`);
      }
    }
    
    return { body: modified };
  }

  // Game模式 - 游戏数值修改
  _processGame(body, config) {
    let modified = body;
    const resources = config.gameResources || [];
    
    for (const res of resources) {
      try {
        const pattern = `"${res.field}":\\d+`;
        const regex = RegexPool.get(pattern, 'g');
        modified = modified.replace(regex, `"${res.field}":${res.value}`);
      } catch (e) {
        Logger.error('VipEngine', `Game resource error: ${e.message}`);
      }
    }
    
    return { body: modified };
  }

  // Hybrid模式 - JSON+Regex组合
  _processHybrid(body, config) {
    // 先JSON处理
    let result = this._processJson(body, config);
    
    // 再Regex处理
    if (config.regexReplacements) {
      result = this._processRegex(result.body, {
        regexReplacements: config.regexReplacements
      });
    }
    
    return result;
  }

  // HTML模式 - 网页去广告
  _processHtml(body, config) {
    let modified = body;
    const replacements = config.htmlReplacements || [];
    
    for (const rule of replacements) {
      try {
        const regex = RegexPool.get(rule.pattern, rule.flags || 'gi');
        modified = modified.replace(regex, rule.replacement);
      } catch (e) {
        Logger.error('VipEngine', `HTML replacement error: ${e.message}`);
      }
    }
    
    return { body: modified };
  }
}
