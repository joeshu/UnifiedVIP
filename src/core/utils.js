const Utils = {
  safeJsonParse: (str, defaultVal = null) => {
    try { return JSON.parse(str); } catch (e) { return defaultVal; }
  },

  safeJsonStringify: (obj) => {
    try { return JSON.stringify(obj); } catch (e) { return '{}'; }
  },

  getPath: (obj, path) => {
    if (!path || !obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  },

  setPath: (obj, path, value) => {
    if (!path || !obj) return obj;
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]] || (current[parts[i]] = {});
    }
    current[parts[parts.length - 1]] = value;
    return obj;
  }
};
