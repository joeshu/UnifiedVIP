class VipEngine {
  constructor(env) {
    this.env = env;
  }

  async process(body, config) {
    if (!body) return { body: '{}' };

    if (config.mode === 'json') {
      return this._processJson(body, config);
    }
    
    return { body };
  }

  _processJson(body, config) {
    let obj = Utils.safeJsonParse(body);
    if (!obj) return { body };

    if (config.processor === 'setFields') {
      const fields = config.fields || {};
      for (const [path, value] of Object.entries(fields)) {
        Utils.setPath(obj, path, value);
      }
    }

    return { body: Utils.safeJsonStringify(obj) };
  }
}
