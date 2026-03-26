// src/apps/_index.js
// APP注册表 - 极简版，只保留 urlPattern，其他从 configs/*.json 读取

const APP_REGISTRY = {
  gps: { urlPattern: "^https:\\/\\/service\\.gpstool\\.com\\/app\\/index\\/getUserInfo" },
  iappdaily: { urlPattern: "^https:\\/\\/api\\.iappdaily\\.com\\/my\\/balance" },
  slzd: { urlPattern: "^https:\\/\\/apis\\.lifeweek\\.com\\.cn\\/(?:vip\\/loadMyVipV2|user\\/newindex\\.do|api\\/magazine\\/detail)" },
  kyxq: { urlPattern: "^https?:\\/\\/mapi\\.kouyuxingqiu\\.com\\/api\\/v2" },
  foday: { urlPattern: "^https?:\\/\\/apis\\.folidaymall\\.com\\/online\\/capi\\/component\\/getPageComponents" },
  qiujingapp: { urlPattern: "^https?:\\/\\/gateway-api\\.yizhilive\\.com\\/api\\/(?:v2\\/index\\/carouses\\/(?:3|6|8|11)|v3\\/index\\/all)" },
  bxkt: { urlPattern: "^https?:\\/\\/api\\.banxueketang\\.com\\/api\\/classpal\\/app\\/v1" },
  cyljy: { urlPattern: "^https?:\\/\\/yr-game-api\\.feigo\\.fun\\/api\\/user\\/get-game-user-value" },
  wohome: { urlPattern: "^https:\\/\\/iotpservice\\.smartont\\.net\\/wohome\\/dispatcher" },
  sylangyue: { urlPattern: "^https?:\\/\\/theater-api\\.sylangyue\\.xyz\\/api\\/user\\/info" },
  mingcalc: { urlPattern: "^https?:\\/\\/jsq\\.mingcalc\\.cn\\/XMGetMeCount\\.ashx" },
  kada: { urlPattern: "^https:\\/\\/service\\.hhdd\\.com\\/book2" },
  ipalfish: { urlPattern: "^https:\\/\\/picturebook\\.ipalfish\\.com\\/pfapi\\/ugc\\/picturebook\\/profile\\/get" },
  tophub: { urlPattern: "^https?:\\/\\/(?:api[23]\\.tophub\\.(?:xyz|today|app)|tophub(?:2)?\\.(?:tophubdata\\.com|idaily\\.today|remai\\.today|iappdaiy\\.com|ipadown\\.com))\\/account\\/sync" },
  keep: { urlPattern: "^https?:\\/\\/(?:api|kit)\\.gotokeep\\.com\\/(?:nuocha|gerudo|athena|nuocha\\/plans|suit\\/v5\\/smart|kprime\\/v4\\/suit\\/sales)\\/" },
  vvebo: { urlPattern: "^https:\\/\\/fluxapi\\.vvebo\\.vip\\/v1\\/purchase\\/iap\\/subscription" },
  v2ex: { urlPattern: "^https?:\\/\\/.*v2ex\\.com\\/(?!(?:.*(?:api|login|cdn-cgi|verify|auth|captch|\\.(?:js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf)))).+$" },
  xjsm: { urlPattern: "^https?:\\/\\/star\\.jvplay\\.cn\\/v2\\/storage" },
  mhlz: { urlPattern: "^https?:\\/\\/ss\\.landintheair\\.com\\/storage\\/" },
  bqwz: { urlPattern: "^https?:\\/\\/javelin\\.mandrillvr\\.com\\/api\\/data\\/get_game_data" },
  qmjyzc: { urlPattern: "^https?:\\/\\/res5\\.haotgame\\.com\\/cu03\\/static\\/OpenDoors\\/Res\\/data\\/levels\\/\\d+\\.json" },
  tv: { urlPattern: "^https?:\\/\\/(?:yzy0916|yz1018|yz250907|yz0320|cfvip)\\..+\\.com\\/(?:v2|v1)\\/api\\/(?:basic\\/init|home\\/firstScreen|adInfo\\/getPageAd|home\\/body)" }
};

// ==================== 工具函数 ====================

// 从本地 configs/*.json 读取完整配置
function getAllConfigs() {
  const configs = {};
  
  for (const [id, baseCfg] of Object.entries(APP_REGISTRY)) {
    try {
      // Node.js 环境下读取本地文件
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(__dirname, '../../configs', `${id}.json`);
      
      const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // 合并：保留 urlPattern，其他从JSON读取
      configs[id] = {
        urlPattern: baseCfg.urlPattern,
        ...fullConfig
      };
    } catch (e) {
      console.warn(`Warning: Missing configs/${id}.json, using minimal config`);
      configs[id] = {
        urlPattern: baseCfg.urlPattern,
        name: id,
        mode: 'json',
        priority: 10,
        description: `${id} VIP解锁`
      };
    }
  }
  
  return configs;
}

// 生成Manifest（脚本内嵌，用于URL匹配）
function generateManifest() {
  const configs = {};
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    configs[id] = {
      urlPattern: cfg.urlPattern,
      configFile: `${id}.json`
    };
  }
  
  return {
    version: "22.0.0",
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(APP_REGISTRY).length,
    configs: configs
  };
}

// 生成rewrite注释
function generateRewriteComments() {
  const allConfigs = getAllConfigs();
  
  return Object.entries(APP_REGISTRY).map(([id, cfg]) => {
    const fullCfg = allConfigs[id];
    return ` * # ${fullCfg.name || id}\n * ${cfg.urlPattern} url script-response-body https://joeshu.github.io/UnifiedVIP/Unified_VIP_Unlock_Manager_v22.js`;
  }).join('\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    APP_REGISTRY,
    getAllConfigs,
    generateManifest, 
    generateRewriteComments
  };
}
