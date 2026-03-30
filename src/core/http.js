// src/core/http.js
// HTTP 客户端 - QX Only

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

      $task.fetch({
        url,
        method: 'GET',
        timeout: toQxSeconds(safeTimeout)
      }).then(
        res => {
          clearTimeout(timer);
          resolve({
            body: res.body || '',
            statusCode: res.statusCode || 200,
            headers: res.headers || {}
          });
        },
        err => {
          clearTimeout(timer);
          reject(new Error(String(err)));
        }
      );
    }),

    post: (options, timeout = 10000) => new Promise((resolve, reject) => {
      const effectiveTimeout = normalizeTimeoutMs(
        options && options.timeout,
        normalizeTimeoutMs(timeout, 10000)
      );

      const timer = setTimeout(() => reject(new Error('Timeout')), effectiveTimeout);

      $task.fetch({
        url: options.url,
        method: 'POST',
        headers: options.headers || {},
        body: options.body || '',
        timeout: toQxSeconds(effectiveTimeout)
      }).then(
        res => {
          clearTimeout(timer);
          resolve({
            body: res.body || '',
            statusCode: res.statusCode || 200,
            headers: res.headers || {}
          });
        },
        err => {
          clearTimeout(timer);
          reject(new Error(String(err)));
        }
      );
    })
  };
})();

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HTTP };
}
