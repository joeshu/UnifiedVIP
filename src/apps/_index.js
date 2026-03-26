/**
 * APP注册表 - 新增APP在这里添加
 */

const APPS = {
  sylangyue: {
    name: '思朗月影视',
    urlPattern: '^https?:\\/\\/theater-api\\.sylangyue\\.xyz\\/api\\/user\\/info',
    fields: {
      'data.isVip': true,
      'data.vipExpireTime': '2099-12-31',
      'data.nickname': 'VIP用户'
    }
  },

  tophub: {
    name: 'TopHub',
    urlPattern: '^https?:\\/\\/(?:api[23]\\.tophub\\.(?:xyz|today|app)|tophub(?:2)?\\.(?:tophubdata\\.com|idaily\\.today|remai\\.today|iappdaiy\\.com|ipadown\\.com))\\/account\\/sync',
    fields: {
      'data.is_vip': true,
      'data.vip_end_time': 4102444800
    }
  },

  keep: {
    name: 'Keep',
    urlPattern: '^https?:\\/\\/(api|kit)\\.gotokeep\\.com\\/(nuocha|gerudo|athena|nuocha\\/plans|suit\\/v5\\/smart|kprime\\/v4\\/suit\\/sales)\\/',
    fields: {
      'data.memberInfo.isMember': true,
      'data.memberInfo.endTime': '2099-12-31'
    }
  }
};

function generateManifest() {
  const configs = {};
  for (const [id, app] of Object.entries(APPS)) {
    configs[id] = {
      name: app.name,
      urlPattern: app.urlPattern
    };
  }
  
  return {
    version: '22.0.0',
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(APPS).length,
    configs
  };
}

function generateRemoteConfigs() {
  const configs = {};
  for (const [id, app] of Object.entries(APPS)) {
    configs[id] = {
      mode: 'json',
      name: app.name,
      processor: 'setFields',
      fields: app.fields
    };
  }
  return configs;
}

module.exports = { APPS, generateManifest, generateRemoteConfigs };
