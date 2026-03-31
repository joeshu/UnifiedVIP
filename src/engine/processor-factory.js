// src/engine/processor-factory.js
// 处理器工厂 - 创建各类处理器

function sendNotify(title, subtitle, message, options) {
  if (typeof Platform === 'undefined') return;
  if (Platform.isQX && typeof $notify !== 'undefined') {
    $notify(title, subtitle, message, options || {});
    return;
  }
  if (Platform.isLoon && typeof $notification !== 'undefined') {
    const url = options && options['open-url'];
    return url
      ? $notification.post(title, subtitle, message, url)
      : $notification.post(title, subtitle, message);
  }
  if ((Platform.isSurge || Platform.isStash) && typeof $notification !== 'undefined') {
    $notification.post(title, subtitle, message, options || {});
  }
}

function createProcessorFactory(requestId) {
  return {
    setFields: (params) => {
      const fields = params.fields || {};
      const compiled = Object.entries(fields).map(([path, value]) => ({
        tokens: Utils.compilePath(path),
        value
      }));

      return (obj, env) => {
        for (const item of compiled) {
          let value = item.value;
          if (typeof value === 'string' && value.includes('{{')) {
            value = Utils.resolveTemplate(value, obj);
          }
          Utils.setPath(obj, item.tokens, value);
        }
        return obj;
      };
    },

    mapArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      const fields = params.fields || {};
      const compiled = Object.entries(fields).map(([path, value]) => ({
        tokens: Utils.compilePath(path),
        value
      }));

      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (!Array.isArray(arr)) return obj;

        for (const itemObj of arr) {
          if (!itemObj) continue;
          for (const item of compiled) {
            let value = item.value;
            if (typeof value === 'string' && value.includes('{{')) {
              value = Utils.resolveTemplate(value, itemObj);
            }
            Utils.setPath(itemObj, item.tokens, value);
          }
        }
        return obj;
      };
    },

    filterArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      const excludeSet = new Set(params.excludeKeys || []);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (!Array.isArray(arr)) return obj;
        Utils.setPath(obj, arrPathTokens, arr.filter(item => !excludeSet.has(item && item[params.keyField])));
        return obj;
      };
    },

    clearArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (Array.isArray(arr)) arr.length = 0;
        return obj;
      };
    },

    deleteFields: (params) => (obj, env) => {
      for (const path of params.paths || []) {
        if (!path || typeof path !== 'string') continue;

        const parts = path.split('.');
        if (parts.length === 0) continue;

        const parentPath = parts.slice(0, -1).join('.');
        const last = parts[parts.length - 1];
        const parent = parentPath ? Utils.getPath(obj, parentPath) : obj;

        if (!parent || typeof parent !== 'object') continue;

        const lastMatch = last.match(/^([^\[\]]+)\[(\d+)\]$/);
        if (lastMatch) {
          const arrName = lastMatch[1];
          const idx = parseInt(lastMatch[2], 10);
          if (Array.isArray(parent[arrName]) && idx >= 0 && idx < parent[arrName].length) {
            parent[arrName].splice(idx, 1);
          }
        } else if (Array.isArray(parent)) {
          for (const item of parent) {
            if (item && typeof item === 'object') {
              delete item[last];
            }
          }
        } else {
          delete parent[last];
        }
      }
      return obj;
    },

    sliceArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (Array.isArray(arr) && arr.length > params.keepCount) {
          Utils.setPath(obj, arrPathTokens, arr.slice(0, params.keepCount));
        }
        return obj;
      };
    },

    shiftArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (Array.isArray(arr) && arr.length > 0) arr.shift();
        return obj;
      };
    },

    processByKeyPrefix: (params) => {
      const objPathTokens = Utils.compilePath(params.objPath);
      const rules = Object.entries(params.prefixRules || {});

      return (obj, env) => {
        const target = Utils.getPath(obj, objPathTokens);
        if (!target || typeof target !== 'object') return obj;

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
      };
    },

    notify: (params) => {
      const title = params.title || 'UnifiedVIP';
      const subtitleFieldTokens = params.subtitleField ? Utils.compilePath(params.subtitleField) : null;
      const messageFieldTokens = params.messageField ? Utils.compilePath(params.messageField) : null;
      const markFieldTokens = params.markField ? Utils.compilePath(params.markField) : null;

      return (obj, env) => {
        let subtitle = params.subtitle || '';
        let message = params.message || '';

        if (subtitleFieldTokens) {
          subtitle = Utils.getPath(obj, subtitleFieldTokens) || subtitle;
        }

        // template 优先
        if (params.template) {
          message = params.template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return Utils.getPath(obj, key) || match;
          });
        } else if (messageFieldTokens) {
          // 使用 formatObject 处理对象
          const fieldData = Utils.getPath(obj, messageFieldTokens);
          if (fieldData) {
            if (typeof fieldData === 'object') {
              message = Utils.formatObject(fieldData, params.separator || '\n');
            } else {
              message = String(fieldData);
            }
          }
        }

        if (params.prefix) {
          message = params.prefix + message;
        }

        const maxLen = params.maxLength || 500;
        if (message.length > maxLen) {
          message = message.substring(0, maxLen) + '...';
        }

        sendNotify(title, subtitle, message, params.options);

        if (markFieldTokens) {
          Utils.setPath(obj, markFieldTokens, true);
        }

        return obj;
      };
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