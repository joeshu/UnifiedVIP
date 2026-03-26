// src/apps/_index.js
// APP注册表 - 所有配置均不内联，全部生成到 configs/*.json

const APP_REGISTRY = {
  
  // ==================== 1. GPS工具箱 ====================
  gps: {
    name: "GPS工具箱",
    urlPattern: "^https:\\/\\/service\\.gpstool\\.com\\/app\\/index\\/getUserInfo",
    mode: "json",
    priority: 10,
    description: "GPS工具箱VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.is_vip": 1,
            "data.vip_expire_date": 20999999
          }
        }
      }
    }
  },

  // ==================== 2. iAppDaily ====================
  iappdaily: {
    name: "iAppDaily",
    urlPattern: "^https:\\/\\/api\\.iappdaily\\.com\\/my\\/balance",
    mode: "json",
    priority: 10,
    description: "iAppDaily余额修改",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.balance": 99999,
            "data.isVip": true
          }
        }
      }
    }
  },

  // ==================== 3. 三联中读 ====================
  slzd: {
    name: "三联中读",
    urlPattern: "^https:\\/\\/apis\\.lifeweek\\.com\\.cn\\/(?:vip\\/loadMyVipV2|user\\/newindex\\.do|api\\/magazine\\/detail)",
    mode: "json",
    priority: 10,
    description: "三联中读VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.isVip": true,
            "data.vipExpireTime": "2099-12-31",
            "data.vipLevel": 999
          }
        }
      }
    }
  },

  // ==================== 4. 口语星球 ====================
  kyxq: {
    name: "口语星球",
    urlPattern: "^https?:\\/\\/mapi\\.kouyuxingqiu\\.com\\/api\\/v2",
    mode: "json",
    priority: 10,
    description: "口语星球VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.vip": true,
            "data.vip_expire": "2099-12-31"
          }
        }
      }
    }
  },

  // ==================== 5. 复游会 ====================
  foday: {
    name: "复游会",
    urlPattern: "^https?:\\/\\/apis\\.folidaymall\\.com\\/online\\/capi\\/component\\/getPageComponents",
    mode: "json",
    priority: 10,
    description: "复游会会员解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.memberLevel": "钻石会员",
            "data.isVip": true
          }
        }
      }
    }
  },

  // ==================== 6. 球竞APP ====================
  qiujingapp: {
    name: "球竞APP",
    urlPattern: "^https?:\\/\\/gateway-api\\.yizhilive\\.com\\/api\\/(?:v2\\/index\\/carouses\\/(?:3|6|8|11)|v3\\/index\\/all)",
    mode: "json",
    priority: 10,
    description: "球竞APP去广告",
    config: {
      processor: {
        processor: "filterArray",
        params: {
          path: "data.banners",
          keyField: "type",
          excludeKeys: ["ad", "banner_ad"]
        }
      }
    }
  },

  // ==================== 7. 伴学课堂 ====================
  bxkt: {
    name: "伴学课堂",
    urlPattern: "^https?:\\/\\/api\\.banxueketang\\.com\\/api\\/classpal\\/app\\/v1",
    mode: "json",
    priority: 10,
    description: "伴学课堂VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.isVip": true,
            "data.vipEndTime": "2099-12-31"
          }
        }
      }
    }
  },

  // ==================== 8. 成语来解压 ====================
  cyljy: {
    name: "成语来解压",
    urlPattern: "^https?:\\/\\/yr-game-api\\.feigo\\.fun\\/api\\/user\\/get-game-user-value",
    mode: "json",
    priority: 10,
    description: "成语来解压游戏修改",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.coin": 9999999,
            "data.level": 999
          }
        }
      }
    }
  },

  // ==================== 9. 联通智家 ====================
  wohome: {
    name: "联通智家",
    urlPattern: "^https:\\/\\/iotpservice\\.smartont\\.net\\/wohome\\/dispatcher",
    mode: "json",
    priority: 10,
    description: "联通智家VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.isVip": true,
            "data.vipLevel": "钻石会员"
          }
        }
      }
    }
  },

  // ==================== 10. 思朗月影视 ====================
  sylangyue: {
    name: "思朗月影视",
    urlPattern: "^https?:\\/\\/theater-api\\.sylangyue\\.xyz\\/api\\/user\\/info",
    mode: "json",
    priority: 10,
    description: "思朗月影视VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.vip": true,
            "data.vipExpireTime": "2099-12-31 23:59:59"
          }
        }
      }
    }
  },

  // ==================== 11. 明计算 ====================
  mingcalc: {
    name: "明计算",
    urlPattern: "^https?:\\/\\/jsq\\.mingcalc\\.cn\\/XMGetMeCount\\.ashx",
    mode: "json",
    priority: 10,
    description: "明计算VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.isVip": true,
            "data.useCount": 999999
          }
        }
      }
    }
  },

  // ==================== 12. KaDa阅读 ====================
  kada: {
    name: "KaDa阅读",
    urlPattern: "^https:\\/\\/service\\.hhdd\\.com\\/book2",
    mode: "json",
    priority: 10,
    description: "KaDa阅读VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.isVip": true,
            "data.vipEndDate": "2099-12-31"
          }
        }
      }
    }
  },

  // ==================== 13. 伴鱼绘本 ====================
  ipalfish: {
    name: "伴鱼绘本",
    urlPattern: "^https:\\/\\/picturebook\\.ipalfish\\.com\\/pfapi\\/ugc\\/picturebook\\/profile\\/get",
    mode: "json",
    priority: 10,
    description: "伴鱼绘本VIP解锁",
    config: {
      processor: {
        processor: "setFields",
        params: {
          fields: {
            "data.isVip": true,
            "data.vipExpireTime": "2099-12-31"
          }
        }
      }
    }
  },

  // ==================== 14. TopHub ====================
  tophub: {
    name: "TopHub",
    urlPattern: "^https?:\\/\\/(?:api[23]\\.tophub\\.(?:xyz|today|app)|tophub(?:2)?\\.(?:tophubdata\\.com|idaily\\.today|remai\\.today|iappdaiy\\.com|ipadown\\.com))\\/account\\/sync",
    mode: "json",
    priority: 10,
    description: "今日热榜VIP同步",
    config: {
      processor: {
        processor: "sceneDispatcher",
        params: {
          scenes: [
            {
              name: "initEmptyData",
              when: "empty",
              check: "data",
              then: {
                processor: "setFields",
                params: {
                  fields: {
                    error: 0,
                    status: 200,
                    data: {
                      is_vip: "1",
                      vip_expired: "2099-12-31 23:59:59"
                    }
                  }
                }
              }
            },
            {
              name: "patchExistingData",
              when: "isObject",
              check: "data",
              then: {
                processor: "setFields",
                params: {
                  fields: {
                    "data.is_vip": "1",
                    "data.vip_expired": "2099-12-31 23:59:59"
                  }
                }
              }
            }
          ]
        }
      }
    }
  },

  // ==================== 15. Keep ====================
  keep: {
    name: "Keep",
    urlPattern: "^https?:\\/\\/(?:api|kit)\\.gotokeep\\.com\\/(?:nuocha|gerudo|athena|nuocha\\/plans|suit\\/v5\\/smart|kprime\\/v4\\/suit\\/sales)\\/",
    mode: "regex",
    priority: 20,
    description: "Keep健身VIP解锁",
    config: {
      regexReplacements: [
        { pattern: '"memberStatus":\\d+', replacement: '"memberStatus":1', flags: "g" },
        { pattern: '"hasPaid":\\w+', replacement: '"hasPaid":true', flags: "g" }
      ]
    }
  },

  // ==================== 16. Vvebo ====================
  vvebo: {
    name: "Vvebo",
    urlPattern: "^https:\\/\\/fluxapi\\.vvebo\\.vip\\/v1\\/purchase\\/iap\\/subscription",
    mode: "forward",
    priority: 10,
    description: "Vvebo订阅验证转发",
    config: {
      forwardUrl: "https://mock.forward1.workers.dev/forward/v1/purchase/iap/subscription",
      method: "POST",
      timeout: 10000,
      forwardHeaders: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Auth-Key": "{{x-auth-key}}"
      },
      statusTexts: {
        "200": "OK",
        "401": "Unauthorized",
        "500": "Internal Server Error"
      },
      responseHeaders: {
        "server": "openresty",
        "content-type": "application/json; charset=utf-8"
      }
    }
  },

  // ==================== 17. V2EX ====================
  v2ex: {
    name: "V2EX去广告",
    urlPattern: "^https?:\\/\\/.*v2ex\\.com\\/(?!(?:.*(?:api|login|cdn-cgi|verify|auth|captch|\\.(?:js|css|jpg|jpeg|png|webp|gif|zip|woff|woff2|m3u8|mp4|mov|m4v|avi|mkv|flv|rmvb|wmv|rm|asf|asx|mp3|json|ico|otf|ttf)))).+$",
    mode: "html",
    priority: 30,
    description: "V2EX网页去广告",
    config: {
      htmlReplacements: [
        {
          pattern: '<div[^>]*class="[^"]*wwads[^"]*"[^>]*>[\\s\\S]*?<\\/div>',
          replacement: "",
          flags: "gi"
        }
      ]
    }
  },

  // ==================== 18. 星际使命 ====================
  xjsm: {
    name: "星际使命",
    urlPattern: "^https?:\\/\\/star\\.jvplay\\.cn\\/v2\\/storage",
    mode: "game",
    priority: 10,
    description: "星际使命游戏资源修改",
    config: {
      gameResources: [
        { field: "coin", value: 9999880 },
        { field: "coupon", value: 9999880 },
        { field: "gem", value: 9999880 }
      ]
    }
  },

  // ==================== 19. 魔幻粒子 ====================
  mhlz: {
    name: "魔幻粒子",
    urlPattern: "^https?:\\/\\/ss\\.landintheair\\.com\\/storage\\/",
    mode: "json",
    priority: 10,
    description: "魔幻粒子游戏资源批量修改",
    config: {
      processor: {
        processor: "processByKeyPrefix",
        params: {
          objPath: "currencies.list",
          prefixRules: {
            "Quest_": { amount: "1", total_collected: "1" },
            "Event_": {},
            "*": { amount: "99999999988888888", total_collected: "99999999988888888" }
          }
        }
      }
    }
  },

  // ==================== 20. 标枪王者 ====================
  bqwz: {
    name: "标枪王者",
    urlPattern: "^https?:\\/\\/javelin\\.mandrillvr\\.com\\/api\\/data\\/get_game_data",
    mode: "game",
    priority: 10,
    description: "标枪王者游戏修改",
    config: {
      gameResources: [
        { field: "gold", value: 9999999 },
        { field: "diamond", value: 9999999 }
      ]
    }
  },

  // ==================== 21. 全民解压找茬 ====================
  qmjyzc: {
    name: "全民解压找茬",
    urlPattern: "^https?:\\/\\/res5\\.haotgame\\.com\\/cu03\\/static\\/OpenDoors\\/Res\\/data\\/levels\\/\\d+\\.json",
    mode: "game",
    priority: 10,
    description: "全民解压找茬关卡解锁",
    config: {
      gameResources: [
        { field: "unlocked", value: true },
        { field: "stars", value: 3 }
      ]
    }
  },

  // ==================== 22. 影视去广告 ====================
  tv: {
    name: "影视去广告",
    urlPattern: "^https?:\\/\\/(?:yzy0916|yz1018|yz250907|yz0320|cfvip)\\..+\\.com\\/(?:v2|v1)\\/api\\/(?:basic\\/init|home\\/firstScreen|adInfo\\/getPageAd|home\\/body)",
    mode: "hybrid",
    priority: 30,
    description: "影视APP去广告+VIP",
    config: {
      processor: {
        processor: "compose",
        params: {
          steps: [
            {
              processor: "setFields",
              params: {
                fields: {
                  "data.isVip": true,
                  "data.vipExpire": "2099-12-31"
                }
              }
            },
            {
              processor: "clearArray",
              params: {
                path: "data.ads"
              }
            }
          ]
        }
      },
      regexReplacements: [
        { pattern: '"isAd":true', replacement: '"isAd":false', flags: "g" }
      ]
    }
  }

};

// ==================== 工具函数 ====================

/**
 * 获取所有远程配置（所有APP都生成到 configs/）
 */
function getAllConfigs() {
  const configs = {};
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    configs[id] = {
      name: cfg.name,
      urlPattern: cfg.urlPattern,
      mode: cfg.mode,
      priority: cfg.priority || 10,
      description: cfg.description,
      ...cfg.config
    };
  }
  return configs;
}

/**
 * 生成Manifest（仅包含元信息，无配置内容）
 */
function generateManifest() {
  const configs = {};
  for (const [id, cfg] of Object.entries(APP_REGISTRY)) {
    configs[id] = {
      name: cfg.name,
      urlPattern: cfg.urlPattern,
      mode: cfg.mode,
      priority: cfg.priority || 10,
      configFile: `${id}.json`
    };
  }
  
  return {
    version: "22.0.0",
    updated: new Date().toISOString().split('T')[0],
    total: Object.keys(APP_REGISTRY).length,
    configs
  };
}

/**
 * 生成rewrite注释（用于主脚本头部）
 */
function generateRewriteComments() {
  return Object.entries(APP_REGISTRY).map(([id, cfg]) => {
    return ` * # ${cfg.name}\n * ${cfg.urlPattern} url script-response-body https://joeshu.github.io/UnifiedVIP/Unified_VIP_Unlock_Manager_v22.js`;
  }).join('\n');
}

/**
 * 生成MITM hostname列表（匹配原脚本格式）
 */
function generateHostnames() {
  const hostnames = new Set();
  
  // 特殊IP（原脚本中有）
  hostnames.add('59.82.99.78');
  
  for (const cfg of Object.values(APP_REGISTRY)) {
    const matches = cfg.urlPattern.match(/[a-z0-9-]+\.[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    
    matches.forEach(domain => {
      const cleanDomain = domain.toLowerCase();
      
      // Keep特殊处理
      if (cleanDomain.includes('gotokeep')) {
        hostnames.add('*.gotokeep.*');
        hostnames.add('api.gotokeep.com');
        hostnames.add('kit.gotokeep.com');
        return;
      }
      
      // TopHub多域名家族
      if (cleanDomain.includes('tophub') || 
          cleanDomain.includes('tophubdata') ||
          cleanDomain.includes('idaily') ||
          cleanDomain.includes('remai') ||
          cleanDomain.includes('iappdaiy') ||
          cleanDomain.includes('ipadown')) {
        hostnames.add('*.tophub.xyz');
        hostnames.add('*.tophub.today');
        hostnames.add('*.tophub.app');
        hostnames.add('*.tophubdata.com');
        hostnames.add('*.idaily.today');
        hostnames.add('*.remai.today');
        hostnames.add('*.iappdaiy.com');
        hostnames.add('*.ipadown.com');
        return;
      }
      
      // V2EX
      if (cleanDomain.includes('v2ex')) {
        hostnames.add('*.v2ex.com');
        return;
      }
      
      // 影视动态域名（通配）
      if (cleanDomain.match(/^(yzy|yz|cfvip)/)) {
        hostnames.add('*.com');
        return;
      }
      
      // 通用处理：提取二级域名
      const parts = cleanDomain.split('.').filter(p => p && !p.match(/^\d+$/));
      if (parts.length >= 2) {
        // 去掉www/api等前缀，生成通配符
        const suffix = parts.slice(-2).join('.');
        hostnames.add(`*.${suffix}`);
      }
    });
  }
  
  // 额外添加原脚本中的特殊hostname
  hostnames.add('*.ipalfish.com');
  hostnames.add('service.hhdd.com');
  hostnames.add('apis.lifeweek.com.cn');
  hostnames.add('fluxapi.vvebo.vip');
  hostnames.add('res5.haotgame.com');
  hostnames.add('jsq.mingcalc.cn');
  hostnames.add('theater-api.sylangyue.xyz');
  hostnames.add('api.iappdaily.com');
  hostnames.add('service.gpstool.com');
  hostnames.add('mapi.kouyuxingqiu.com');
  hostnames.add('ss.landintheair.com');
  hostnames.add('apis.folidaymall.com');
  hostnames.add('gateway-api.yizhilive.com');
  hostnames.add('javelin.mandrillvr.com');
  hostnames.add('api.banxueketang.com');
  hostnames.add('yr-game-api.feigo.fun');
  hostnames.add('star.jvplay.cn');
  hostnames.add('iotpservice.smartont.net');
  
  // 去重排序
  return Array.from(hostnames).sort();
}

// CommonJS导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    APP_REGISTRY,
    getAllConfigs,
    generateManifest, 
    generateRewriteComments,
    generateHostnames
  };
}
