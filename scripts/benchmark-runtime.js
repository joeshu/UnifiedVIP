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
const { APP_REGISTRY } = require('../src/apps/_index');
const { generateManifestOneLine } = require('./build/generators');

const ROOT = path.join(__dirname, '..');
const CONFIGS_DIR = path.join(ROOT, 'configs');
const DIST_JSON_PATH = path.join(ROOT, 'dist', 'benchmark-runtime.json');
const DOC_MD_PATH = path.join(ROOT, 'docs', 'benchmark-runtime.md');

const FAST_MODE = process.argv.includes('--fast') || !process.argv.includes('--full');
const MODE = FAST_MODE ? 'fast' : 'full';
const ROUNDS = FAST_MODE ? 3 : 5;
const COUNTS = FAST_MODE
  ? { manifestWarm: 500, manifestCold: 500, configStorage: 20, configMemory: 80, engine: 20, jsonProfile: 20, processor: 20 }
  : { manifestWarm: 1000, manifestCold: 1000, configStorage: 50, configMemory: 200, engine: 50, jsonProfile: 50, processor: 50 };

const BENCH_TARGETS = {
  json: { id: 'tophub', url: 'https://api2.tophub.today/account/sync', contentType: 'application/json' },
  regex: { id: 'keep', url: 'https://api.gotokeep.com/nuocha/plans/', contentType: 'application/json' },
  html: { id: 'v2ex', url: 'https://www.v2ex.com/t/123456', contentType: 'text/html' },
  hybrid: { id: 'bxkt', url: 'https://api.banxueketang.com/api/classpal/app/v1', contentType: 'application/json' }
};

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
  BUILD_CONFIG: { VERSION: 'bench-runtime' }
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

function bench(name, fn, rounds = ROUNDS) {
  const times = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { name, avg, min: Math.min(...times), max: Math.max(...times) };
}

async function benchAsync(name, fn, rounds = ROUNDS) {
  const times = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { name, avg, min: Math.min(...times), max: Math.max(...times) };
}

function summarize(result, count) {
  const ops = result.avg > 0 ? count / (result.avg / 1000) : 0;
  return {
    avg_ms: Number(result.avg.toFixed(2)),
    min_ms: Number(result.min.toFixed(2)),
    max_ms: Number(result.max.toFixed(2)),
    ops_per_s: Math.round(ops)
  };
}

function printResult(group, label, result, count) {
  const s = summarize(result, count);
  console.log(`${group} ${label}: avg=${s.avg_ms}ms ops/s=${s.ops_per_s}`);
  return s;
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

function makeHtmlBody(size = 200) {
  return `<html><body>${Array.from({ length: size }, (_, i) => `<div class="card">vip-${i}</div>`).join('')}</body></html>`;
}

function cloneJsonPayload(jsonStr) {
  return JSON.parse(jsonStr);
}

function mustGetConfig(id) {
  const file = path.join(CONFIGS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) throw new Error(`missing benchmark config: ${id}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function makeProcessorBenchmarkCases(compile) {
  const cases = [];
  cases.push({
    label: 'setFields',
    processor: compile({ processor: 'setFields', params: { fields: { 'data.vip': true, 'data.level': 9, 'data.expire': 9999999999 } } })
  });
  cases.push({
    label: 'mapArray',
    processor: compile({ processor: 'mapArray', params: { path: 'data.list', fields: { flag: true, badge: 'vip' } } })
  });
  cases.push({
    label: 'deleteFields',
    processor: compile({ processor: 'deleteFields', params: { paths: ['data.list[0].name', 'data.level'] } })
  });
  cases.push({
    label: 'compose',
    processor: compile({
      processor: 'compose',
      params: {
        steps: [
          { processor: 'setFields', params: { fields: { 'data.vip': true, 'data.level': 9 } } },
          { processor: 'mapArray', params: { path: 'data.list', fields: { flag: true } } }
        ]
      }
    })
  });
  return cases.filter(item => typeof item.processor === 'function');
}

function buildMarkdown(report) {
  const lines = [
    '# Runtime Benchmark',
    '',
    `- Generated: ${report.generated_at}`,
    `- Mode: ${report.mode}`,
    `- Rounds: ${report.rounds}`,
    `- Targets: json=${report.targets.json}, regex=${report.targets.regex}, html=${report.targets.html}, hybrid=${report.targets.hybrid}`,
    ''
  ];

  const sections = [
    ['Manifest', report.manifest],
    ['Config Loader', report.config_loader],
    ['Engine', report.engine],
    ['JSON Profile', report.json_profile],
    ['Processor Profile', report.processor_profile]
  ];

  sections.forEach(([title, obj]) => {
    lines.push(`## ${title}`);
    lines.push('');
    for (const [key, value] of Object.entries(obj || {})) {
      lines.push(`- ${key}: avg=${value.avg_ms}ms, ops/s=${value.ops_per_s}, min=${value.min_ms}ms, max=${value.max_ms}ms`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

async function main() {
  console.log('=== UnifiedVIP Runtime Benchmark ===');
  console.log(`mode=${MODE} rounds=${ROUNDS}`);

  const report = {
    generated_at: new Date().toISOString(),
    mode: MODE,
    rounds: ROUNDS,
    targets: {
      json: BENCH_TARGETS.json.id,
      regex: BENCH_TARGETS.regex.id,
      html: BENCH_TARGETS.html.id,
      hybrid: BENCH_TARGETS.hybrid.id
    },
    manifest: {},
    config_loader: {},
    engine: {},
    json_profile: {},
    processor_profile: {}
  };

  mustGetConfig(BENCH_TARGETS.json.id);
  mustGetConfig(BENCH_TARGETS.regex.id);
  mustGetConfig(BENCH_TARGETS.html.id);
  mustGetConfig(BENCH_TARGETS.hybrid.id);

  const manifestLoader = new SimpleManifestLoader('BENCH');
  const manifest = await manifestLoader.load();

  const hotUrls = [
    BENCH_TARGETS.json.url,
    BENCH_TARGETS.regex.url,
    BENCH_TARGETS.html.url,
    BENCH_TARGETS.hybrid.url
  ];

  console.log('\n--- manifest ---');
  report.manifest.warm = printResult('manifest', `warm x${COUNTS.manifestWarm}`, bench(`manifest warm x${COUNTS.manifestWarm}`, () => {
    for (let i = 0; i < COUNTS.manifestWarm; i++) {
      const url = hotUrls[i % hotUrls.length];
      manifest.findMatch(url, makeMeta(url));
    }
  }), COUNTS.manifestWarm);

  report.manifest.coldish = printResult('manifest', `coldish x${COUNTS.manifestCold}`, bench(`manifest coldish x${COUNTS.manifestCold}`, () => {
    for (let i = 0; i < COUNTS.manifestCold; i++) {
      const url = `https://sub${i}.gotokeep.com/nuocha/plans?i=${i}`;
      manifest.findMatch(url, makeMeta(url));
    }
  }), COUNTS.manifestCold);

  const configLoader = new SimpleConfigLoader('BENCH');
  const jsonCfg = mustGetConfig(BENCH_TARGETS.json.id);
  const cacheKey = `${BENCH_TARGETS.json.id}@${String(BUILTIN_MANIFEST_OBJ.version || 'v1')}`;
  const cachePayload = JSON.stringify({ v: '1.0', t: Date.now(), d: jsonCfg });

  console.log('\n--- config loader ---');
  prefStore.clear();
  report.config_loader.storage = printResult('config', `storage x${COUNTS.configStorage}`, await benchAsync(`config storage x${COUNTS.configStorage}`, async () => {
    configLoader._memCache.clear();
    prefStore.set('vip_v22_data', JSON.stringify({ [cacheKey]: JSON.parse(cachePayload) }));
    for (let i = 0; i < COUNTS.configStorage; i++) {
      await configLoader.load(BENCH_TARGETS.json.id, '1.0');
    }
  }), COUNTS.configStorage);

  report.config_loader.memory = printResult('config', `memory x${COUNTS.configMemory}`, await benchAsync(`config memory x${COUNTS.configMemory}`, async () => {
    await configLoader.load(BENCH_TARGETS.json.id, '1.0');
    for (let i = 0; i < COUNTS.configMemory; i++) {
      await configLoader.load(BENCH_TARGETS.json.id, '1.0');
    }
  }), COUNTS.configMemory);

  console.log('\n--- engine ---');
  const engineCases = [
    { label: 'json', target: BENCH_TARGETS.json, body: makeJsonBody(FAST_MODE ? 160 : 300) },
    { label: 'regex', target: BENCH_TARGETS.regex, body: makeJsonBody(FAST_MODE ? 120 : 220) },
    { label: 'html', target: BENCH_TARGETS.html, body: makeHtmlBody(FAST_MODE ? 100 : 180) },
    { label: 'hybrid', target: BENCH_TARGETS.hybrid, body: makeJsonBody(FAST_MODE ? 140 : 250) }
  ];

  for (const item of engineCases) {
    const cfg = await configLoader.load(item.target.id, '1.0');
    const env = new Environment('BENCH', makeMeta(item.target.url, item.target.contentType));
    const engine = new VipEngine(env, 'BENCH');
    report.engine[item.label] = printResult('engine', `${item.label} x${COUNTS.engine}`, await benchAsync(`engine ${item.label} x${COUNTS.engine}`, async () => {
      for (let i = 0; i < COUNTS.engine; i++) {
        await engine.process(item.body, cfg);
      }
    }), COUNTS.engine);

    if (item.label === 'json') {
      console.log('\n--- json profile ---');
      const processor = cfg._processor || null;
      report.json_profile.parse_only = printResult('json', `parse-only x${COUNTS.jsonProfile}`, bench(`json parse-only x${COUNTS.jsonProfile}`, () => {
        for (let i = 0; i < COUNTS.jsonProfile; i++) Utils.safeJsonParse(item.body);
      }), COUNTS.jsonProfile);

      const originalObj = cloneJsonPayload(item.body);
      report.json_profile.stringify_original = printResult('json', `stringify-original x${COUNTS.jsonProfile}`, bench(`json stringify-original x${COUNTS.jsonProfile}`, () => {
        for (let i = 0; i < COUNTS.jsonProfile; i++) Utils.safeJsonStringify(originalObj);
      }), COUNTS.jsonProfile);

      report.json_profile.stringify_cloned = printResult('json', `stringify-cloned x${COUNTS.jsonProfile}`, bench(`json stringify-cloned x${COUNTS.jsonProfile}`, () => {
        for (let i = 0; i < COUNTS.jsonProfile; i++) Utils.safeJsonStringify(cloneJsonPayload(item.body));
      }), COUNTS.jsonProfile);

      if (typeof processor === 'function') {
        report.json_profile.processor_only = printResult('json', `processor-only x${COUNTS.jsonProfile}`, bench(`json processor-only x${COUNTS.jsonProfile}`, () => {
          for (let i = 0; i < COUNTS.jsonProfile; i++) {
            const obj = cloneJsonPayload(item.body);
            processor(obj, env);
          }
        }), COUNTS.jsonProfile);

        report.json_profile.stringify_after_processor = printResult('json', `stringify-after-processor x${COUNTS.jsonProfile}`, bench(`json stringify-after-processor x${COUNTS.jsonProfile}`, () => {
          for (let i = 0; i < COUNTS.jsonProfile; i++) {
            const obj = cloneJsonPayload(item.body);
            const out = processor(obj, env);
            Utils.safeJsonStringify(out);
          }
        }), COUNTS.jsonProfile);
      }

      const pf = createProcessorFactory('BENCH');
      const cp = createCompiler(pf);
      const processorCases = makeProcessorBenchmarkCases(cp);
      console.log('\n--- processor profile ---');
      for (const pCase of processorCases) {
        report.processor_profile[pCase.label] = printResult('processor', `${pCase.label} x${COUNTS.processor}`, bench(`processor ${pCase.label} x${COUNTS.processor}`, () => {
          for (let i = 0; i < COUNTS.processor; i++) {
            const obj = cloneJsonPayload(item.body);
            pCase.processor(obj, env);
          }
        }), COUNTS.processor);
      }

      report.json_profile.full_chain_manual = printResult('json', `full-chain-manual x${COUNTS.jsonProfile}`, bench(`json full-chain-manual x${COUNTS.jsonProfile}`, () => {
        for (let i = 0; i < COUNTS.jsonProfile; i++) {
          let obj = Utils.safeJsonParse(item.body);
          if (typeof processor === 'function') obj = processor(obj, env);
          Utils.safeJsonStringify(obj);
        }
      }), COUNTS.jsonProfile);
    }
  }

  fs.mkdirSync(path.dirname(DIST_JSON_PATH), { recursive: true });
  fs.writeFileSync(DIST_JSON_PATH, JSON.stringify(report, null, 2));

  if (!FAST_MODE) {
    fs.writeFileSync(DOC_MD_PATH, buildMarkdown(report));
    console.log(`\n📄 runtime benchmark markdown: ${DOC_MD_PATH}`);
  } else {
    console.log('\nℹ️ fast 模式仅写 dist/benchmark-runtime.json；使用 --full 生成 docs/benchmark-runtime.md');
  }

  console.log(`📄 runtime benchmark json: ${DIST_JSON_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
