// src/core/http.js
// HTTP 客户端 - 增强版 (与 vip-unlock-configs 一致)

const HTTP = (() => {
  function normalizeTimeoutMs(value, fallback = 10000) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return n;
  }

  function toQxSeconds(ms) {
    return Math.max(1, Math.ceil(ms / 1000));
  }

  return {
    get: (url, timeout = 10000) => new Promise((resolve, reject) => {
      const safeTimeout = normalizeTimeoutMs(timeout, 10000);
      const timer = setTimeout(() => reject(new Error('Timeout')), safeTimeout);

      const callback = (error, response, body) => {
        clearTimeout(timer);
        if (error) {
          reject(new Error(String(error)));
        } else {
          resolve({
            body: body || '',
            statusCode: typeof response === 'object' ? (response.statusCode || response.status || 200) : 200,
            headers: typeof response === 'object' ? (response.headers || {}) : {}
          });
        }
      };

      try {
        if (typeof Platform !== 'undefined' && Platform.isQX) {
          $task.fetch({
            url,
            method: 'GET',
            timeout: toQxSeconds(safeTimeout)
          }).then(
            res => callback(null, { statusCode: res.statusCode, headers: res.headers }, res.body),
            err => callback(err, null, null)
          );
        } else if (typeof $httpClient !== 'undefined') {
          $httpClient.get({ url, timeout: safeTimeout / 1000 }, callback);
        } else {
          clearTimeout(timer);
          reject(new Error('No HTTP client'));
        }
      } catch (e) {
        clearTimeout(timer);
        reject(e);
      }
    }),

    post: (options, timeout = 10000) => new Promise((resolve, reject) => {
      const effectiveTimeout = normalizeTimeoutMs(
        options && options.timeout,
        normalizeTimeoutMs(timeout, 10000)
      );

      const timer = setTimeout(() => reject(new Error('Timeout')), effectiveTimeout);

      const callback = (error, response, body) => {
        clearTimeout(timer);
        if (error) {
          reject(new Error(String(error)));
        } else {
          resolve({
            body: body || '',
            statusCode: typeof response === 'object' ? (response.statusCode || response.status || 200) : 200,
            headers: typeof response === 'object' ? (response.headers || {}) : {}
          });
        }
      };

      try {
        if (typeof Platform !== 'undefined' && Platform.isQX) {
          $task.fetch({
            url: options.url,
            method: 'POST',
            headers: options.headers || {},
            body: options.body || '',
            timeout: toQxSeconds(effectiveTimeout)
          }).then(
            res => callback(null, { statusCode: res.statusCode, headers: res.headers }, res.body),
            err => callback(err, null, null)
          );
        } else if (typeof $httpClient !== 'undefined') {
          $httpClient.post({
            url: options.url,
            headers: options.headers || {},
            body: options.body || '',
            timeout: effectiveTimeout / 1000
          }, callback);
        } else {
          clearTimeout(timer);
          reject(new Error('No HTTP client'));
        }
      } catch (e) {
        clearTimeout(timer);
        reject(e);
      }
    })
  };
})();

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HTTP };
}