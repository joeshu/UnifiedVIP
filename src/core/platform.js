// src/core/platform.js
// 平台检测（QX Only）

const Platform = {
  isQX: true,
  isLoon: false,
  isSurge: false,
  isStash: false,

  getName() {
    return 'QX';
  }
};

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Platform };
}
