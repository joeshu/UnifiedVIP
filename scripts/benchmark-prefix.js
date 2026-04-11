#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { generatePrefixIndex } = require('../src/apps/_prefix-index');

const PRESETS = {
  fast: {
    name: 'fast',
    hostCount: 3000,
    rounds: 3,
    writeReport: false
  },
  full: {
    name: 'full',
    hostCount: 10000,
    rounds: 6,
    writeReport: true
  }
};

function resolvePreset(argv) {
  const args = Array.isArray(argv) ? argv : [];
  const modeArg = args.find(arg => arg === '--fast' || arg === '--full' || arg.startsWith('--mode='));
  if (modeArg === '--full') return PRESETS.full;
  if (modeArg === '--fast') return PRESETS.fast;
  if (modeArg && modeArg.startsWith('--mode=')) {
    const name = modeArg.split('=')[1];
    if (PRESETS[name]) return PRESETS[name];
  }
  return PRESETS.fast;
}

function baselineFactory(index) {
  const keywordEntries = Object.entries(index.keyword || {}).sort((a, b) => b[0].length - a[0].length);
  return function findByPrefixBaseline(hostname) {
    const h = String(hostname || '').toLowerCase();
    if (!h) return null;
    if (index.exact[h]) return { ids: index.exact[h], method: 'exact', matched: h };
    for (const [suffix, ids] of Object.entries(index.suffix || {})) {
      if (h.endsWith('.' + suffix) || h === suffix) return { ids, method: 'suffix', matched: suffix };
    }
    for (const [kw, ids] of keywordEntries) {
      if (h.includes(kw)) return { ids, method: 'keyword', matched: kw };
    }
    return null;
  };
}

function optimizedFactory(index) {
  const keywordEntries = Object.entries(index.keyword || {}).sort((a, b) => b[0].length - a[0].length);
  const keywordBuckets2 = {};
  for (const [kw, ids] of keywordEntries) {
    const k2 = kw.slice(0, 2);
    if (k2.length < 2) continue;
    if (!keywordBuckets2[k2]) keywordBuckets2[k2] = [];
    keywordBuckets2[k2].push([kw, ids]);
  }

  const cache = new Map();
  const CACHE_LIMIT = 200;
  function cacheGet(k) {
    if (!cache.has(k)) return undefined;
    const v = cache.get(k);
    cache.delete(k);
    cache.set(k, v);
    return v;
  }
  function cacheSet(k, v) {
    if (cache.has(k)) cache.delete(k);
    else if (cache.size >= CACHE_LIMIT) {
      const first = cache.keys().next().value;
      cache.delete(first);
    }
    cache.set(k, v);
  }

  function findBySuffixFast(h) {
    const lastDot = h.lastIndexOf('.');
    if (lastDot <= 0 || lastDot >= h.length - 1) return null;
    const prevDot = h.lastIndexOf('.', lastDot - 1);
    const suffix = prevDot >= 0 ? h.slice(prevDot + 1) : h;
    const ids = index.suffix[suffix];
    return ids ? { ids, method: 'suffix', matched: suffix } : null;
  }

  return function findByPrefixOptimized(hostname) {
    const h = String(hostname || '').toLowerCase();
    if (!h) return null;
    const c = cacheGet(h);
    if (c !== undefined) return c;

    let out = null;
    if (index.exact[h]) {
      out = { ids: index.exact[h], method: 'exact', matched: h };
    } else {
      out = findBySuffixFast(h);
      if (!out) {
        const seen2 = Object.create(null);
        for (let i = 0; i < h.length - 1; i++) {
          const a = h[i], b = h[i + 1];
          if (a === '.' || a === '-' || a === '_') continue;
          if (b === '.' || b === '-' || b === '_') continue;
          const k2 = a + b;
          if (seen2[k2]) continue;
          seen2[k2] = 1;
          const bucket = keywordBuckets2[k2];
          if (!bucket) continue;
          for (const [kw, ids] of bucket) {
            if (h.includes(kw)) {
              out = { ids, method: 'keyword', matched: kw };
              break;
            }
          }
          if (out) break;
        }
      }
    }

    cacheSet(h, out);
    return out;
  };
}

function bench(name, fn, hosts, rounds = 5) {
  const times = [];
  let matched = 0;
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    let hit = 0;
    for (const h of hosts) {
      if (fn(h)) hit++;
    }
    const t1 = performance.now();
    matched = hit;
    times.push(t1 - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const ops = (hosts.length / (avg / 1000)).toFixed(0);
  return { name, avg, ops: Number(ops), matched, total: hosts.length };
}

function randomLabel(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makeHostData(index, hostCount = 10000) {
  const suffixes = Object.keys(index.suffix || {});
  const keywords = Object.keys(index.keyword || {});

  const repeated = [];
  for (let i = 0; i < hostCount; i++) {
    const suffix = suffixes[i % Math.max(suffixes.length, 1)] || 'example.com';
    const kw = keywords[i % Math.max(keywords.length, 1)] || 'demo';
    repeated.push(`${kw}.${suffix}`);
  }

  const diverse = [];
  for (let i = 0; i < hostCount; i++) {
    const suffix = suffixes[i % Math.max(suffixes.length, 1)] || 'example.com';
    const head = i % 3 === 0 ? randomLabel(10) : randomLabel(6);
    diverse.push(`${head}.${suffix}`);
  }

  return { repeated, diverse };
}

function formatLine(r) {
  return `${r.name}: avg=${r.avg.toFixed(2)}ms ops/s=${r.ops} matched=${r.matched}/${r.total}`;
}

function writeMarkdownReport(index, results) {
  const reportPath = path.join(__dirname, '../docs/benchmark-prefix.md');
  const now = new Date().toISOString();

  const repBase = results.repeated.baseline;
  const repOpt = results.repeated.optimized;
  const divBase = results.diverse.baseline;
  const divOpt = results.diverse.optimized;

  const repGain = (repOpt.ops / Math.max(repBase.ops, 1)).toFixed(2);
  const divGain = (divOpt.ops / Math.max(divBase.ops, 1)).toFixed(2);

  const md = [
    '# Prefix Matching Benchmark',
    '',
    `- Generated: ${now}`,
    `- Index: exact=${Object.keys(index.exact).length}, suffix=${Object.keys(index.suffix).length}, keyword=${Object.keys(index.keyword).length}`,
    '',
    '## High-repeat hosts (cache friendly)',
    '',
    `- baseline: avg=${repBase.avg.toFixed(2)}ms, ops/s=${repBase.ops}`,
    `- optimized: avg=${repOpt.avg.toFixed(2)}ms, ops/s=${repOpt.ops}`,
    `- gain: **${repGain}x**`,
    '',
    '## Diverse hosts (cache less friendly)',
    '',
    `- baseline: avg=${divBase.avg.toFixed(2)}ms, ops/s=${divBase.ops}`,
    `- optimized: avg=${divOpt.avg.toFixed(2)}ms, ops/s=${divOpt.ops}`,
    `- gain: **${divGain}x**`,
    ''
  ];

  fs.writeFileSync(reportPath, md.join('\n'));
  return reportPath;
}

const preset = resolvePreset(process.argv.slice(2));

console.log('=== Prefix Matching Benchmark ===');
console.log(`mode: ${preset.name} (hosts=${preset.hostCount}, rounds=${preset.rounds})`);
const index = generatePrefixIndex();
const baseline = baselineFactory(index);
const optimized = optimizedFactory(index);
const { repeated, diverse } = makeHostData(index, preset.hostCount);

console.log(`index: exact=${Object.keys(index.exact).length}, suffix=${Object.keys(index.suffix).length}, keyword=${Object.keys(index.keyword).length}`);
console.log('--- high-repeat hosts (cache friendly) ---');
const repBase = bench('baseline', baseline, repeated, preset.rounds);
const repOpt = bench('optimized', optimized, repeated, preset.rounds);
console.log(formatLine(repBase));
console.log(formatLine(repOpt));
console.log('--- diverse hosts (cache less friendly) ---');
const divBase = bench('baseline', baseline, diverse, preset.rounds);
const divOpt = bench('optimized', optimized, diverse, preset.rounds);
console.log(formatLine(divBase));
console.log(formatLine(divOpt));

if (preset.writeReport) {
  const out = writeMarkdownReport(index, {
    repeated: { baseline: repBase, optimized: repOpt },
    diverse: { baseline: divBase, optimized: divOpt }
  });
  console.log(`\n📄 benchmark report: ${out}`);
} else {
  console.log('\nℹ️ fast 模式不写 docs/benchmark-prefix.md；使用 --full 可生成完整报告');
}
