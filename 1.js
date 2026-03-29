/*
 * UnifiedVIP V2EX 诊断脚本（Quantumult X）
 * 用法：作为 V2EX 的 script-response-body 脚本执行，输出响应体分析
 
[rewrite_local]
^https?://www\.v2ex\.com/ url script-response-body https://your-domain/unifiedvip_v2ex_diag.js
[mitm]
hostname = *.v2ex.com
*/

const url = $request.url;
const body = $response.body || '';

const results = {
  url: url,
  timestamp: new Date().toISOString(),
  bodyLength: body.length,
  tests: {}
};

// 检查关键广告特征
results.tests.hasWwadsMeta = body.includes('wwads-cn-verify');
results.tests.hasWwadsScript = body.includes('cdn.wwads.cn');
results.tests.hasAdsbygoogle = body.includes('googlesyndication.com');
results.tests.hasGA = body.includes('google-analytics.com');
results.tests.hasProCampaign = body.includes('pro-campaign-container');
results.tests.hasSidebarUnits = body.includes('sidebar_units');
results.tests.hasSidebarCompliance = body.includes('sidebar_compliance');

// 检查我们的注入脚本是否存在
results.tests.hasInjectedScript = body.includes('sidebar_units') && body.includes('document.querySelectorAll');

// 检查 </body> 位置
const bodyEndIndex = body.toLowerCase().lastIndexOf('</body>');
const htmlEndIndex = body.toLowerCase().lastIndexOf('</html>');
results.tests.bodyEndIndex = bodyEndIndex;
results.tests.htmlEndIndex = htmlEndIndex;
results.tests.hasBodyEnd = bodyEndIndex > 0;
results.tests.hasHtmlEnd = htmlEndIndex > 0;

// 输出到控制台
console.log('[UnifiedVIP:V2EX-Diag] ' + JSON.stringify(results, null, 2));

// 如果注入脚本不存在，说明规则没生效或缓存问题
if (!results.tests.hasInjectedScript) {
  console.log('[UnifiedVIP:V2EX-Diag] ⚠️ 警告：注入脚本未找到，可能原因：');
  console.log('[UnifiedVIP:V2EX-Diag]   1. QX 缓存了旧脚本');
  console.log('[UnifiedVIP:V2EX-Diag]   2. HTML 模式处理异常');
  console.log('[UnifiedVIP:V2EX-Diag]   3. </body> 标签格式异常');
  
  // 打印 body 尾部 300 字符用于调试
  console.log('[UnifiedVIP:V2EX-Diag] Body 尾部 300 字符：');
  console.log(body.slice(-300));
}

$done({ body: body });
