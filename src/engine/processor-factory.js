function createProcessorFactory(requestId) {
  return {
    setFields: (params) => (obj, env) => {
      const fields = params.fields || {};
      for (const path in fields) {
        let value = fields[path];
        if (typeof value === 'string' && value.includes('{{')) {
          value = Utils.resolveTemplate(value, obj);
        }
        Utils.setPath(obj, path, value);
      }
      return obj;
    },

    mapArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (!Array.isArray(arr)) return obj;
      const fields = params.fields || {};
      for (const item of arr) {
        if (!item) continue;
        for (const path in fields) {
          let value = fields[path];
          if (typeof value === 'string' && value.includes('{{')) {
            value = Utils.resolveTemplate(value, item);
          }
          Utils.setPath(item, path, value);
        }
      }
      return obj;
    },

    filterArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (!Array.isArray(arr)) return obj;
      const excludeSet = new Set(params.excludeKeys || []);
      Utils.setPath(obj, params.path, arr.filter(item => !excludeSet.has(item && item[params.keyField])));
      return obj;
    },

    clearArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr)) arr.length = 0;
      return obj;
    },

    deleteFields: (params) => (obj, env) => {
      for (const path of params.paths || []) {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current && current[parts[i]];
          if (!current) break;
        }
        if (current) delete current[parts[parts.length - 1]];
      }
      return obj;
    },

    sliceArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr) && arr.length > params.keepCount) {
        Utils.setPath(obj, params.path, arr.slice(0, params.keepCount));
      }
      return obj;
    },

    shiftArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr) && arr.length > 0) arr.shift();
      return obj;
    },

    processByKeyPrefix: (params) => (obj, env) => {
      const target = Utils.getPath(obj, params.objPath);
      if (!target || typeof target !== 'object') return obj;
      const rules = Object.entries(params.prefixRules || {});
      for (const key in target) {
        const value = target[key];
        if (!value || typeof value !== 'object') continue;
        for (const [prefix, handler] of rules) {
          if (prefix !== '*' && key.startsWith(prefix)) {
            Object.assign(value, handler);
            break;
          }
          if (prefix === '*') {
            Object.assign(value, handler);
            break;
          }
        }
      }
      return obj;
    },

    notify: (params) => (obj, env) => {
      const title = params.title || 'UnifiedVIP';
      let subtitle = params.subtitle || '';
      let message = params.message || '';

      if (params.subtitleField) {
        subtitle = Utils.getPath(obj, params.subtitleField) || subtitle;
      }

      if (params.messageField) {
        const fieldData = Utils.getPath(obj, params.messageField);
        message = fieldData ? String(fieldData) : message;
      }

      if (typeof Platform !== 'undefined') {
        if (Platform.isQX && typeof $notify !== 'undefined') {
          $notify(title, subtitle, message, params.options || {});
        } else if (typeof $notification !== 'undefined') {
          $notification.post(title, subtitle, message, params.options || {});
        }
      }

      if (params.markField) {
        Utils.setPath(obj, params.markField, true);
      }

      return obj;
    },

    compose: (params, compile) => {
      const steps = params.steps || [];
      const maxSteps = typeof CONFIG !== 'undefined' ? CONFIG.MAX_PROCESSORS_PER_REQUEST : 30;
      if (steps.length > maxSteps) {
        throw new Error(`Too many processors: ${steps.length}`);
      }
      const processors = steps.map(step => compile(step));

      return (obj, env) => {
        let result = obj;
        for (const processor of processors) {
          if (!result) break;
          result = processor(result, env);
        }
        return result;
      };
    },

    when: (params, compile) => {
      const conditionFn = (obj, env) => {
        const url = env && env.getUrl ? env.getUrl() : '';
        switch (params.condition) {
          case "empty":
            const data = Utils.getPath(obj, params.check || 'data');
            return !data || Object.keys(data).length === 0;
          case "pathMatch":
            return params.path && url.includes(params.path);
          case "queryMatch":
            const match = url.match(RegexPool.get(`[?&]${params.param}=([^&]+)`));
            return match && decodeURIComponent(match[1]) === params.value;
          case "includes":
            const checkData = Utils.getPath(obj, params.check || 'data');
            return Array.isArray(checkData) ? checkData.includes(params.value) : String(checkData).includes(params.value);
          case "isObject":
            return typeof obj.data === 'object' && !Array.isArray(obj.data);
          case "isArray":
            return Array.isArray(obj.data);
          default:
            return false;
        }
      };

      const thenProcessor = params.then ? compile(params.then) : null;
      const elseProcessor = params.else ? compile(params.else) : null;

      return (obj, env) => {
        const conditionMet = conditionFn(obj, env);
        if (conditionMet && thenProcessor) {
          return thenProcessor(obj, env);
        } else if (!conditionMet && elseProcessor) {
          return elseProcessor(obj, env);
        }
        return obj;
      };
    },

    sceneDispatcher: (params, compile) => {
      const scenes = (params.scenes || []).map(s => ({
        matchFn: (obj, env) => {
          const url = env && env.getUrl ? env.getUrl() : '';
          switch (s.when) {
            case "pathMatch": return s.path && url.includes(s.path);
            case "queryMatch":
              const m = url.match(RegexPool.get(`[?&]${s.param}=([^&]+)`));
              return m && decodeURIComponent(m[1]) === s.value;
            case "includes":
              const d = Utils.getPath(obj, s.check || 'data');
              return Array.isArray(d) ? d.includes(s.value) : String(d).includes(s.value);
            case "empty":
              const ed = Utils.getPath(obj, s.check || 'data');
              return !ed || Object.keys(ed).length === 0;
            case "isObject": return typeof obj.data === 'object' && !Array.isArray(obj.data);
            case "isArray": return Array.isArray(obj.data);
            default: return false;
          }
        },
        then: compile(s.then)
      }));

      return (obj, env) => {
        for (const scene of scenes) {
          if (scene.matchFn(obj, env)) {
            return scene.then(obj, env);
          }
        }
        return obj;
      };
    }
  };
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createProcessorFactory };
}
