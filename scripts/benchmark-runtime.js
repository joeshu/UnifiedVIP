#!/usr/bin/env node

const fs = require('fs');
const { performance } = require('perf_hooks');
const path = require('path');

const { Utils } = require('../src/core/utils');
const { RegexPool } = require('../src/engine/regex-pool');
const { Logger } = require('../src/core/logger');
const { Storage } = require('../src/core/storage');
const { HTTP } = require('../src/core/http');
const { createProcessorFactory } = require('../src/engine/processor-factory');
const { createCompiler } = require('../src/engine/compiler');
const { SimpleManifestLoader } = require('../src/engine/manifest-loader');
const { SimpleConfigLoader } = require('../src/engine/config-loader');
const { Environment, VipEngine } = require('../src/engine/vip-engine');
const { APP_REGISTRY, getAllConfigs } = require('../src/apps/_index');
const { generateManifestOneLine } = require('./build/generators');

const ROOT = path.join(__dirname, '..');
const CONFIGS_DIR = path.join(ROOT, 'configs');

global.Utils = Utils;
global.RegexPool = RegexPool;
global.Logger = Logger;
global.Storage = Storage;
global.HTTP = HTTP;
global.createProcessorFactory = createProcessorFactory;
global.createCompiler = createCompiler;
global.SimpleManifestLoader = SimpleManifestLoader;
global.SimpleConfigLoader = SimpleConfigLoader;
global.Environment = Environment;
global.VipEngine = VipEngine;
global.CONFIG = {
  DEBUG: false,
  VERBOSE_PATTERN_LOG: false,
  MAX_PROCESSORS_PER_REQUEST: 100,
  CONFIG_CACHE_TTL: 24 * 60 * 60 * 1000,
  REMOTE_BASE: 'https://example.invalid',
  TIMEOUT: 10
};

global.$notify = () => {};
global.$done = () => {};

const prefStore = new Map();
global.$prefs = {
  valueForKey: (k) => (prefStore.has(k) ? prefStore.get(k) : null),
  setValueForKey: (v, k) => { prefStore.set(k, v); return true; },
  removeValueForKey: (k) => prefStore.delete(k)
};

global.$task = {
  fetch: async () => ({ statusCode: 200, body: '{}', headers: { 'content-type': 'application/json' } })
};

const BUILTIN_MANIFEST_OBJ = JSON.parse(generateManifestOneLine({
  APP_REGISTRY,
  CONFIGS_DIR,
  BUILD_CONFIG: { VERSION: 'bench' }
}));
global.BUILTIN_MANIFEST = BUILTIN_MANIFEST_OBJ;

function makeMeta(url, contentType = 'application/json') {
  const u = new URL(url);
  return {
    url,
    hostname: u.hostname.toLowerCase(),
    pathname: u.pathname,
    search: u.search,
    method: 'GET',
    hasResponse: true,
    contentType
  };
}

function bench(name, fn, rounds = 5) {
  const times = [];
  let last = null;
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    last = fn();
    times.push(performance.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  return { name, avg, min, max, last };
}

async function benchAsync(name, fn, rounds = 5) {
  const times = [];
  let last = null;
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    last = await fn();
    times.push(performance.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  return { name, avg, min, max, last };
}

function print(result) {
  console.log(`${result.name}: avg=${result.avg.toFixed(2)}ms min=${result.min.toFixed(2)} max=${result.max.toFixed(2)}`);
}

function summarize(result) {
  return {
    avg_ms: Number(result.avg.toFixed(2)),
    min_ms: Number(result.min.toFixed(2)),
    max_ms: Number(result.max.toFixed(2))
  };
}

function makeJsonBody(size = 300) {
  return JSON.stringify({
    code: 0,
    data: {
      vip: false,
      level: 1,
      expire: 0,
      list: Array.from({ length: size }, (_, i) => ({ id: i, name: 'item-' + i, flag: false }))
    }
  });
}

function buildRuntimeReportPath() {
  return path.join(ROOT, 'dist', 'benchmark-runtime.json');
}

function makeHtmlBody(size = 200) {
  return `<html><body>${Array.from({ length: size }, (_, i) => `<div class="card">vip-${i}</div>`).join('')}</body></html>`;
}

function pickBenchConfigs() {
  const all = getAllConfigs();
  const values = Object.entries(all);
  const pick = (mode) => values.find(([, cfg]) => cfg.mode === mode);
  return {
    json: pick('json'),
    regex: pick('regex'),
    html: pick('html'),
    hybrid: pick('hybrid')
  };
}

function cloneJsonPayload(jsonStr) {
  return JSON.parse(jsonStr);
}

function buildJsonProfileCase(configLoader, jsonId, jsonBody, env) {
  return configLoader.load(jsonId, '1.0').then(cfg => {
    const engine = new VipEngine(env, 'BENCH');
    const processor = cfg._processor || null;
    return { cfg, engine, processor };
  });
}

function makeProcessorBenchmarkCases(factory, compile) {
  const cases = [];

  cases.push({
    label: 'setFields',
    processor: compile({
      processor: 'setFields',
      params: {
        fields: {
          'data.vip': true,
          'data.level': 9,
          'data.expire': 9999999999
        }
      }
    })
  });

  cases.push({
    label: 'mapArray',
    processor: compile({
      processor: 'mapArray',
      params: {
        path: 'data.list',
        fields: {
          flag: true,
          badge: 'vip'
        }
      }
    })
  });

  cases.push({
    label: 'deleteFields',
    processor: compile({
      processor: 'deleteFields',
      params: {
        paths: ['data.list[0].name', 'data.level']
      }
    })
  });

  cases.push({
    label: 'compose',
    processor: compile({
      processor: 'compose',
      params: {
        steps: [
          {
            processor: 'setFields',
            params: {
              fields: {
                'data.vip': true,
                'data.level': 9
              }
            }
          },
          {
            processor: 'mapArray',
            params: {
              path: 'data.list',
              fields: {
                flag: true
              }
            }
          }
        ]
      }
    })
  });

  return cases.filter(item => typeof item.processor === 'function');
}

async function main() {
  console.log('=== UnifiedVIP Runtime Benchmark ===');
  console.log(`manifest configs=${Object.keys(BUILTIN_MANIFEST_OBJ.configs || {}).length}`);

  const report = {
    generated_at: new Date().toISOString(),
    manifest: {},
    config_loader: {},
    engine: {},
    json_profile: {},
    processor_profile: {}
  };

  const manifestLoader = new SimpleManifestLoader('BENCH');
  const manifest = await manifestLoader.load();

  const urls = [
    'https://api.gotokeep.com/nuocha/plans',
    'https://www.v2ex.com/t/123456',
    'https://theater-api.sylangyue.xyz/api/v1/theater/home',
    'https://service.hhdd.com/book2'
  ];

  console.log('\n--- manifest match ---');
  const manifestWarm = bench('manifest warm x1000', () => {
    for (let i = 0; i < 1000; i++) {
      const url = urls[i % urls.length];
      manifest.findMatch(url, makeMeta(url));
    }
  }, 5);
  print(manifestWarm);
  report.manifest.warm_x1000 = summarize(manifestWarm);

  const manifestCold = bench('manifest cold-ish x1000', () => {
    for (let i = 0; i < 1000; i++) {
      const url = `https://sub${i}.gotokeep.com/nuocha/plans?i=${i}`;
      manifest.findMatch(url, makeMeta(url));
    }
  }, 5);
  print(manifestCold);
  report.manifest.coldish_x1000 = summarize(manifestCold);

  const benchConfigs = pickBenchConfigs();
  const configLoader = new SimpleConfigLoader('BENCH');

  console.log('\n--- config loader ---');
  const jsonId = benchConfigs.json ? benchConfigs.json[0] : Object.keys(getAllConfigs())[0];
  const jsonRaw = getAllConfigs()[jsonId];
  const cacheKey = `${jsonId}@${String(BUILTIN_MANIFEST_OBJ.version || 'v1')}`;
  const cachePayload = JSON.stringify({ v: '1.0', t: Date.now(), d: jsonRaw });

  prefStore.clear();
  const storageLoad = await benchAsync('config load from storage x50', async () => {
    configLoader._memCache.clear();
    prefStore.set('vip_v22_data', JSON.stringify({ [cacheKey]: JSON.parse(cachePayload) }));
    await configLoader.load(jsonId, '1.0');
  }, 5);
  print(storageLoad);
  report.config_loader.storage_x50 = summarize(storageLoad);

  const memoryLoad = await benchAsync('config load from memory x200', async () => {
    await configLoader.load(jsonId, '1.0');
    for (let i = 0; i < 200; i++) {
      await configLoader.load(jsonId, '1.0');
    }
  }, 5);
  print(memoryLoad);
  report.config_loader.memory_x200 = summarize(memoryLoad);

  console.log('\n--- vip engine process ---');
  const engineCases = [];
  if (benchConfigs.json) engineCases.push({ label: 'json', entry: benchConfigs.json, body: makeJsonBody(300), type: 'application/json' });
  if (benchConfigs.regex) engineCases.push({ label: 'regex', entry: benchConfigs.regex, body: makeJsonBody(200), type: 'application/json' });
  if (benchConfigs.html) engineCases.push({ label: 'html', entry: benchConfigs.html, body: makeHtmlBody(180), type: 'text/html' });
  if (benchConfigs.hybrid) engineCases.push({ label: 'hybrid', entry: benchConfigs.hybrid, body: makeJsonBody(250), type: 'application/json' });

  for (const item of engineCases) {
    const [id] = item.entry;
    const cfg = await configLoader.load(id, '1.0');
    const url = urls[0];
    const env = new Environment('BENCH', makeMeta(url, item.type));
    const engine = new VipEngine(env, 'BENCH');

    if (item.label === 'json') {
      const coldJson = await benchAsync('engine json cold x50', async () => {
        for (let i = 0; i < 50; i++) {
          const coldCfg = configLoader._prepareConfig(jsonRaw);
          await engine.process(item.body, coldCfg);
        }
      }, 5);
      print(coldJson);
      report.engine.json_cold_x50 = summarize(coldJson);

      const warmJson = await benchAsync('engine json warm x50', async () => {
        for (let i = 0; i < 50; i++) {
          await engine.process(item.body, cfg);
        }
      }, 5);
      print(warmJson);
      report.engine.json_warm_x50 = summarize(warmJson);

      console.log('\n--- json profile breakdown ---');
      const prepared = await buildJsonProfileCase(configLoader, id, item.body, env);
      const parseOnly = bench('json parse-only x50', () => {
        for (let i = 0; i < 50; i++) {
          Utils.safeJsonParse(item.body);
        }
      }, 5);
      print(parseOnly);
      report.json_profile.parse_only_x50 = summarize(parseOnly);

      const originalObj = cloneJsonPayload(item.body);
      const stringifyOriginal = bench('json stringify original x50', () => {
        for (let i = 0; i < 50; i++) {
          Utils.safeJsonStringify(originalObj);
        }
      }, 5);
      print(stringifyOriginal);
      report.json_profile.stringify_original_x50 = summarize(stringifyOriginal);

      const stringifyOnly = bench('json stringify cloned x50', () => {
        for (let i = 0; i < 50; i++) {
          Utils.safeJsonStringify(cloneJsonPayload(item.body));
        }
      }, 5);
      print(stringifyOnly);
      report.json_profile.stringify_cloned_x50 = summarize(stringifyOnly);

      if (typeof prepared.processor === 'function') {
        const processorOnly = bench('json processor-only x50', () => {
          for (let i = 0; i < 50; i++) {
            const obj = cloneJsonPayload(item.body);
            prepared.processor(obj, env);
          }
        }, 5);
        print(processorOnly);
        report.json_profile.processor_only_x50 = summarize(processorOnly);

        const processorMutatedStringify = bench('json stringify after processor x50', () => {
          for (let i = 0; i < 50; i++) {
            const obj = cloneJsonPayload(item.body);
            const out = prepared.processor(obj, env);
            Utils.safeJsonStringify(out);
          }
        }, 5);
        print(processorMutatedStringify);
        report.json_profile.stringify_after_processor_x50 = summarize(processorMutatedStringify);
      }

      const pf = createProcessorFactory('BENCH');
      const cp = createCompiler(pf);
      const processorCases = makeProcessorBenchmarkCases(pf, cp);
      for (const pCase of processorCases) {
        const pRes = bench(`processor ${pCase.label} x50`, () => {
          for (let i = 0; i < 50; i++) {
            const obj = cloneJsonPayload(item.body);
            pCase.processor(obj, env);
          }
        }, 5);
        print(pRes);
        report.processor_profile[`${pCase.label}_x50`] = summarize(pRes);
      }

      const fullChain = bench('json full-chain manual x50', () => {
        for (let i = 0; i < 50; i++) {
          let obj = Utils.safeJsonParse(item.body);
          if (typeof prepared.processor === 'function') {
            obj = prepared.processor(obj, env);
          }
          Utils.safeJsonStringify(obj);
        }
      }, 5);
      print(fullChain);
      report.json_profile.full_chain_manual_x50 = summarize(fullChain);
      continue;
    }

    const result = await benchAsync(`engine ${item.label} x50`, async () => {
      for (let i = 0; i < 50; i++) {
        await engine.process(item.body, cfg);
      }
    }, 5);
    print(result);
    report.engine[`${item.label}_x50`] = summarize(result);
  }

  const outPath = buildRuntimeReportPath();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 runtime benchmark json: ${outPath}`);
}


main().catch(err => {
  console.error(err);
  process.exit(1);
});
