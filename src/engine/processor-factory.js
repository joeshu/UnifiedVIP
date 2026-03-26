// 处理器工厂 - 创建各种处理器
function createProcessorFactory(requestId) {
  const factory = {
    // ========== 基础处理器 ==========
    
    // 设置字段值
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

    // 数组映射处理
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

    // 过滤数组元素
    filterArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (!Array.isArray(arr)) return obj;
      
      const excludeSet = new Set(params.excludeKeys || []);
      const filtered = arr.filter(item => {
        const keyValue = item && item[params.keyField];
        return !excludeSet.has(keyValue);
      });
      
      Utils.setPath(obj, params.path, filtered);
      return obj;
    },

    // 清空数组
    clearArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr)) {
        arr.length = 0;
      }
      return obj;
    },

    // 删除字段
    deleteFields: (params) => (obj, env) => {
      for (const path of params.paths || []) {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current || typeof current !== 'object') break;
          current = current[parts[i]];
        }
        if (current && typeof current === 'object') {
          delete current[parts[parts.length - 1]];
        }
      }
      return obj;
    },

    // 数组切片（保留前N个）
    sliceArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr) && arr.length > params.keepCount) {
        Utils.setPath(obj, params.path, arr.slice(0, params.keepCount));
      }
      return obj;
    },

    // 移除数组第一个元素
    shiftArray: (params) => (obj, env) => {
      const arr = Utils.getPath(obj, params.path);
      if (Array.isArray(arr) && arr.length > 0) {
        arr.shift();
      }
      return obj;
    },

    // 按键前缀批量处理
    processByKeyPrefix: (params) => (obj, env) => {
      const target = Utils.getPath(obj, params.objPath);
      if (!target || typeof target !== 'object') return obj;
      
      const rules = Object.entries(params.prefixRules || {});
      for (const key in target) {
        const value = target[key];
        if (!value || typeof value !== 'object') continue;
        
        for (const [prefix, handler] of rules) {
          if (prefix === '*' || key.startsWith(prefix)) {
            Object.assign(value, handler);
            break;
          }
        }
      }
      return obj;
    },

    // ========== 通知处理器 ==========
    
    notify: (params) => (obj, env) => {
      const title = params.title || 'UnifiedVIP';
      let subtitle = params.subtitle || '';
      let message = params.message || '';

      // 从字段获取副标题
      if (params.subtitleField) {
        subtitle = Utils.getPath(obj, params.subtitleField) || subtitle;
      }

      // 模板替换
      if (params.template) {
        message = params.template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          return Utils.getPath(obj, key.trim()) || match;
        });
      }

      // 从字段获取消息
      if (params.messageField) {
        const fieldData = Utils.getPath(obj, params.messageField);
        if (fieldData) {
          if (typeof fieldData === 'object') {
            message = Object.entries(fieldData)
              .map(([k, v], i) => `${i + 1}、${k}: ${v}`)
              .join(params.separator || '\n');
          } else {
            message = String(fieldData);
          }
        }
      }

      // 添加前缀
      if (params.prefix) {
        message = params.prefix + message;
      }

      // 截断
      const maxLen = params.maxLength || 500;
      if (message.length > maxLen) {
        message = message.substring(0, maxLen) + '...';
      }

      // 发送通知
      if (Platform.isQX) {
        $notify(title, subtitle, message, params.options || {});
      } else if (Platform.isLoon) {
        const url = params.options?.['open-url'];
        if (url) {
          $notification.post(title, subtitle, message, url);
        } else {
          $notification.post(title, subtitle, message);
        }
      } else if (Platform.isSurge || Platform.isStash) {
        $notification.post(title, subtitle, message, params.options || {});
      }

      // 标记已通知
      if (params.markField) {
        Utils.setPath(obj, params.markField, true);
      }

      return obj;
    },

    // ========== 组合处理器 ==========
    
    // 顺序执行多个处理器
    compose: (params, compile) => {
      const steps = params.steps || [];
      if (steps.length > 30) {
        throw new Error('Too many processors: ' + steps.length);
      }
      
      const processors = steps.map(step => compile(step)).filter(Boolean);
      
      return (obj, env) => {
        let result = obj;
        for (const processor of processors) {
          if (result === null || result === undefined) break;
          result = processor(result, env);
        }
        return result;
      };
    },

    // 条件分支
    when: (params, compile) => {
      const conditionFn = (obj, env) => {
        const url = env?.getUrl?.() || '';
        
        switch (params.condition) {
          case 'empty': {
            const data = Utils.getPath(obj, params.check || 'data');
            return !data || (typeof data === 'object' && Object.keys(data).length === 0);
          }
          
          case 'pathMatch':
            return params.path && url.includes(params.path);
          
          case 'queryMatch': {
            const regex = new RegExp(`[?&]${params.param}=([^&]+)`);
            const match = url.match(regex);
            return match && decodeURIComponent(match[1]) === params.value;
          }
          
          case 'includes': {
            const data = Utils.getPath(obj, params.check || 'data');
            if (Array.isArray(data)) {
              return data.includes(params.value);
            }
            return String(data).includes(params.value);
          }
          
          case 'isObject':
            return typeof obj.data === 'object' && !Array.isArray(obj.data);
          
          case 'isArray':
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

    // 场景分发器（多条件路由）
    sceneDispatcher: (params, compile) => {
      const scenes = (params.scenes || []).map(scene => ({
        name: scene.name,
        matchFn: (obj, env) => {
          const url = env?.getUrl?.() || '';
          
          switch (scene.when) {
            case 'pathMatch':
              return scene.path && url.includes(scene.path);
            
            case 'queryMatch': {
              const regex = new RegExp(`[?&]${scene.param}=([^&]+)`);
              const match = url.match(regex);
              return match && decodeURIComponent(match[1]) === scene.value;
            }
            
            case 'includes': {
              const data = Utils.getPath(obj, scene.check || 'data');
              if (Array.isArray(data)) {
                return data.includes(scene.value);
              }
              return String(data).includes(scene.value);
            }
            
            case 'empty': {
              const data = Utils.getPath(obj, scene.check || 'data');
              return !data || (typeof data === 'object' && Object.keys(data).length === 0);
            }
            
            case 'isObject':
              return typeof obj.data === 'object' && !Array.isArray(obj.data);
            
            case 'isArray':
              return Array.isArray(obj.data);
            
            default:
              return false;
          }
        },
        processor: compile(scene.then)
      }));

      return (obj, env) => {
        for (const scene of scenes) {
          if (scene.matchFn(obj, env)) {
            if (scene.processor) {
              return scene.processor(obj, env);
            }
            return obj;
          }
        }
        return obj;
      };
    }
  };

  return factory;
}
