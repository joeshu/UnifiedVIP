// src/engine/processor-factory.js
// 处理器工厂 - 创建各类处理器

function sendNotify(title, subtitle, message, options) {
  if (typeof $notify !== 'undefined') {
    $notify(title, subtitle, message, options || {});
  }
}

function compileValueSetterMap(fields) {
  return Object.entries(fields || {}).map(([path, value]) => ({
    tokens: Utils.compilePath(path),
    value,
    isTemplate: typeof value === 'string' && value.includes('{{'),
    isDirectKey: typeof path === 'string' && path.length > 0 && path.indexOf('.') < 0 && path.indexOf('[') < 0,
    directKey: typeof path === 'string' && path.length > 0 && path.indexOf('.') < 0 && path.indexOf('[') < 0 ? path : null
  }));
}

function applyCompiledValueSetters(target, compiled, sourceObj) {
  for (const item of compiled) {
    const value = item.isTemplate ? Utils.resolveTemplate(item.value, sourceObj) : item.value;
    if (item.isDirectKey && item.directKey) {
      target[item.directKey] = value;
      continue;
    }

    const tokens = item.tokens || [];
    if (tokens.length === 1 && !tokens[0].isArray) {
      target[tokens[0].key] = value;
      continue;
    }
    if (tokens.length === 2 && !tokens[0].isArray && !tokens[1].isArray) {
      const p0 = tokens[0].key;
      const p1 = tokens[1].key;
      let node = target[p0];
      if (node == null || typeof node !== 'object') node = target[p0] = {};
      node[p1] = value;
      continue;
    }

    Utils.setPath(target, tokens, value);
  }
}

function buildNotifyMessageResolver(params) {
  const subtitleFieldTokens = params.subtitleField ? Utils.compilePath(params.subtitleField) : null;
  const messageFieldTokens = params.messageField ? Utils.compilePath(params.messageField) : null;
  const markFieldTokens = params.markField ? Utils.compilePath(params.markField) : null;
  const prefixText = params.prefix || '';
  const maxLen = params.maxLength || 500;
  const separator = params.separator || '\n';
  const title = params.title || 'UnifiedVIP';
  const template = typeof params.template === 'string' ? params.template : '';
  const hasTemplate = !!template;

  return {
    title,
    markFieldTokens,
    resolve(obj) {
      let subtitle = params.subtitle || '';
      let message = params.message || '';

      if (subtitleFieldTokens) {
        subtitle = Utils.getPath(obj, subtitleFieldTokens) || subtitle;
      }

      if (hasTemplate) {
        message = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return Utils.getPath(obj, key) || match;
        });
      } else if (messageFieldTokens) {
        const fieldData = Utils.getPath(obj, messageFieldTokens);
        if (fieldData) {
          message = typeof fieldData === 'object'
            ? Utils.formatObject(fieldData, separator)
            : String(fieldData);
        }
      }

      if (prefixText) {
        message = prefixText + message;
      }

      if (message.length > maxLen) {
        message = message.substring(0, maxLen) + '...';
      }

      return { subtitle, message };
    }
  };
}

function makeConditionMatcher(def) {
  const checkPath = def.check || 'data';
  const checkTokens = Utils.compilePath(checkPath);
  const pathNeedle = def.path ? String(def.path) : '';
  const queryRegex = def.param ? RegexPool.get(`[?&]${def.param}=([^&]+)`) : null;
  const expectedValue = def.value;

  return (obj, env) => {
    switch (def.condition || def.when) {
      case 'empty': {
        const data = Utils.getPath(obj, checkTokens);
        return !data || Object.keys(data).length === 0;
      }
      case 'pathMatch': {
        if (!pathNeedle) return false;
        if (env && env.getPathname) {
          const pathname = env.getPathname();
          if (pathname && pathname.includes(pathNeedle)) return true;
        }
        const url = env && env.getUrl ? env.getUrl() : '';
        return !!(url && url.includes(pathNeedle));
      }
      case 'queryMatch': {
        if (!queryRegex) return false;
        const search = env && env.getSearch ? env.getSearch() : '';
        const source = search || (env && env.getUrl ? env.getUrl() : '');
        const match = source.match(queryRegex);
        return !!(match && decodeURIComponent(match[1]) === expectedValue);
      }
      case 'includes': {
        const checkData = Utils.getPath(obj, checkTokens);
        return Array.isArray(checkData) ? checkData.includes(expectedValue) : String(checkData).includes(expectedValue);
      }
      case 'isObject':
        return typeof obj.data === 'object' && !Array.isArray(obj.data);
      case 'isArray':
        return Array.isArray(obj.data);
      default:
        return false;
    }
  };
}

function createProcessorFactory(requestId) {
  return {
    setFields: (params) => {
      const compiled = compileValueSetterMap(params.fields || {});
      const directStatic = compiled.filter(item => item.isDirectKey && item.directKey && !item.isTemplate);
      const directTemplate = compiled.filter(item => item.isDirectKey && item.directKey && item.isTemplate);
      const complex = compiled.filter(item => !item.isDirectKey || !item.directKey);

      return (obj, env) => {
        for (const item of directStatic) {
          obj[item.directKey] = item.value;
        }

        for (const item of directTemplate) {
          obj[item.directKey] = Utils.resolveTemplate(item.value, obj);
        }

        if (complex.length > 0) {
          applyCompiledValueSetters(obj, complex, obj);
        }
        return obj;
      };
    },

    mapArray: (params) => {
      const arrPathTokens = Utils.compilePath(params.path);
      const compiled = compileValueSetterMap(params.fields || {});
      const directStatic = compiled.filter(item => item.isDirectKey && item.directKey && !item.isTemplate);
      const directTemplate = compiled.filter(item => item.isDirectKey && item.directKey && item.isTemplate);
      const complex = compiled.filter(item => !item.isDirectKey || !item.directKey);
      const complexLen = complex.length;
      const staticLen = directStatic.length;
      const templateLen = directTemplate.length;

      return (obj, env) => {
        const arr = Utils.getPath(obj, arrPathTokens);
        if (!Array.isArray(arr)) return obj;

        if (complexLen === 0 && templateLen === 0) {
          for (let i = 0; i < arr.length; i++) {
            const itemObj = arr[i];
            if (!itemObj || typeof itemObj !== 'object') continue;
            for (let j = 0; j < staticLen; j++) {
              const item = directStatic[j];
              itemObj[item.directKey] = item.value;
            }
          }
          return obj;
        }

        for (let i = 0; i < arr.length; i++) {
          const itemObj = arr[i];
          if (!itemObj || typeof itemObj !== 'object') continue;

          for (let j = 0; j < staticLen; j++) {
            const item = directStatic[j];
            itemObj[item.directKey] = item.value;
          }

          for (let j = 0; j < templateLen; j++) {
            const item = directTemplate[j];
            itemObj[item.directKey] = Utils.resolveTemplate(item.value, itemObj);
          }

          if (complexLen > 0) {
            applyCompiledValueSetters(itemObj, complex, itemObj);
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

    deleteFields: (params) => {
      const compiledPaths = (params.paths || []).map(path => {
        if (!path || typeof path !== 'string') return null;
        const parts = path.split('.');
        if (!parts.length) return null;
        const last = parts[parts.length - 1];
        const parentTokens = parts.length > 1 ? Utils.compilePath(parts.slice(0, -1).join('.')) : null;
        const lastMatch = last.match(/^([^\[\]]+)\[(\d+)\]$/);
        return {
          parentTokens,
          last,
          arrayDelete: lastMatch ? { key: lastMatch[1], index: parseInt(lastMatch[2], 10) } : null
        };
      }).filter(Boolean);

      return (obj, env) => {
        for (const item of compiledPaths) {
          const parent = item.parentTokens ? Utils.getPath(obj, item.parentTokens) : obj;
          if (!parent || typeof parent !== 'object') continue;

          if (item.arrayDelete) {
            const arr = parent[item.arrayDelete.key];
            const idx = item.arrayDelete.index;
            if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
              arr.splice(idx, 1);
            }
          } else if (Array.isArray(parent)) {
            for (const row of parent) {
              if (row && typeof row === 'object') {
                delete row[item.last];
              }
            }
          } else {
            delete parent[item.last];
          }
        }
        return obj;
      };
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
      const entries = Object.entries(params.prefixRules || {});
      const wildcardEntry = entries.find(([prefix]) => prefix === '*') || null;
      const specificRules = entries.filter(([prefix]) => prefix !== '*');

      return (obj, env) => {
        const target = Utils.getPath(obj, objPathTokens);
        if (!target || typeof target !== 'object') return obj;

        for (const key in target) {
          const value = target[key];
          if (!value || typeof value !== 'object') continue;

          let matchedHandler = null;
          for (const [prefix, handler] of specificRules) {
            if (key.startsWith(prefix)) {
              matchedHandler = handler;
              break;
            }
          }
          if (!matchedHandler && wildcardEntry) {
            matchedHandler = wildcardEntry[1];
          }
          if (matchedHandler) {
            Object.assign(value, matchedHandler);
          }
        }
        return obj;
      };
    },

    notify: (params) => {
      const resolver = buildNotifyMessageResolver(params || {});

      return (obj, env) => {
        const { subtitle, message } = resolver.resolve(obj);
        sendNotify(resolver.title, subtitle, message, params.options);

        if (resolver.markFieldTokens) {
          Utils.setPath(obj, resolver.markFieldTokens, true);
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
      const processors = steps.map(step => compile(step)).filter(Boolean);

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
      const conditionFn = makeConditionMatcher(params || {});

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
        matchFn: makeConditionMatcher(s || {}),
        then: compile(s.then)
      })).filter(scene => typeof scene.then === 'function');

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