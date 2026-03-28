/*
 * wohome A/B 极简验证脚本（仅用于排障）
 * 目标：100%确认 QX 是否命中脚本、是否存在缓存问题
 */

(() => {
  const TAG = 'wohome-ab';

  try {
    const reqUrl = (typeof $request !== 'undefined' && $request && $request.url) ? $request.url : '';
    const raw = (typeof $response !== 'undefined' && $response && typeof $response.body === 'string') ? $response.body : '';

    if (!raw) {
      console.log(`[${TAG}] empty body`);
      return $done({ body: raw });
    }

    let obj;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      console.log(`[${TAG}] json parse fail: ${e.message}`);
      return $done({ body: raw });
    }

    let touched = 0;
    const list = obj && obj.RSP && Array.isArray(obj.RSP.DATA) ? obj.RSP.DATA : [];

    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      if (item.posCode === 'APP_START_PAGE' && Object.prototype.hasOwnProperty.call(item, 'configList')) {
        delete item.configList;
        touched += 1;
      }
    }

    // A/B 可见标记：用于肉眼确认脚本已执行
    obj.__uvip_ab = {
      hit: true,
      touched,
      url: reqUrl,
      ts: Date.now()
    };

    console.log(`[${TAG}] hit=1 touched=${touched}`);
    return $done({ body: JSON.stringify(obj) });
  } catch (e) {
    console.log(`[${TAG}] fatal: ${e.message}`);
    return $done({ body: (typeof $response !== 'undefined' && $response && $response.body) ? $response.body : '' });
  }
})();
