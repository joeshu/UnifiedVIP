#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { generatePrefixIndex } = require('../src/apps/_prefix-index');

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
  const suffixEntries = Object.entries(index.suffix || {}).sort((a, b) => b[0].length - a[0].length);

  const suffixTrie = {};
  for (const [suffix, ids] of suffixEntries) {
    const parts = suffix.split('.').reverse();
    let node = suffixTrie;
    for (const p of parts) {
      if (!node[p]) node[p] = {};
      node = node[p];
    }
    node.$ = ids;
  }

  function findBySuffixTrie(h) {
    const parts = h.split('.').reverse();
    let node = suffixTrie;
    let found = null;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!node[p]) break;
      node = node[p];
      if (node.$) {
        found = {
          ids: node.$,
          method: 'suffix',
          matched: parts.slice(0, i + 1).reverse().join('.')
        };
      }
    }
    return found;
  }

  const keywordEntries = Object.entries(index.keyword || {}).sort((a, b) => b[0].length - a[0].length);
  const keywordBuckets2 = {};
  const keywordBuckets1 = {};
  for (const [kw, ids] of keywordEntries) {
    if (kw.length >= 2) {
      const k2 = kw.slice(0, 2);
      if (!keywordBuckets2[k2]) keywordBuckets2[k2] = [];
      keywordBuckets2[k2].push([kw, ids]);
    } else {
      const k1 = kw[0] || '#';
      if (!keywordBuckets1[k1]) keywordBuckets1[k1] = [];
      keywordBuckets1[k1].push([kw, ids]);
    }
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

  return function findByPrefixOptimized(hostname) {
    const h = String(hostname || '').toLowerCase();
    if (!h) return null;
    const c = cacheGet(h);
    if (c !== undefined) return c;

    let out = null;
    if (index.exact[h]) {
      out = { ids: index.exact[h], method: 'exact', matched: h };
    } else {
      out = findBySuffixTrie(h);
      if (!out) {
        const seen2 = new Set();
        for (let i = 0; i < h.length - 1; i++) {
          const a = h[i], b = h[i + 1];
          if (a === '.' || a === '-' || a === '_') continue;
          if (b === '.' || b === '-' || b === '_') continue;
          const k2 = a + b;
          if (seen2.has(k2)) continue;
          seen2.add(k2);
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
      if (!out) {
        const seen1 = new Set();
        for (let i = 0; i < h.length; i++) {
          const ch = h[i];
          if (ch === '.' || ch === '-' || ch === '_') continue;
          if (seen1.has(ch)) continue;
          seen1.add(ch);
          const bucket = keywordBuckets1[ch];
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

function makeHostData(index) {
  const suffixes = Object.keys(index.suffix || {});
  const keywords = Object.keys(index.keyword || {});

  const repeated = [];
  for (let i = 0; i < 10000; i++) {
    const suffix = suffixes[i % Math.max(suffixes.length, 1)] || 'example.com';
    const kw = keywords[i % Math.max(keywords.length, 1)] || 'demo';
    repeated.push(`${kw}.${suffix}`);
  }

  const diverse = [];
  for (let i = 0; i < 10000; i++) {
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

console.log('=== Prefix Matching Benchmark ===');
const index = generatePrefixIndex();
const baseline = baselineFactory(index);
const optimized = optimizedFactory(index);
const { repeated, diverse } = makeHostData(index);

console.log(`index: exact=${Object.keys(index.exact).length}, suffix=${Object.keys(index.suffix).length}, keyword=${Object.keys(index.keyword).length}`);
console.log('--- high-repeat hosts (cache friendly) ---');
const repBase = bench('baseline', baseline, repeated, 6);
const repOpt = bench('optimized', optimized, repeated, 6);
console.log(formatLine(repBase));
console.log(formatLine(repOpt));
console.log('--- diverse hosts (cache less friendly) ---');
const divBase = bench('baseline', baseline, diverse, 6);
const divOpt = bench('optimized', optimized, diverse, 6);
console.log(formatLine(divBase));
console.log(formatLine(divOpt));

const out = writeMarkdownReport(index, {
  repeated: { baseline: repBase, optimized: repOpt },
  diverse: { baseline: divBase, optimized: divOpt }
});
console.log(`\n📄 benchmark report: ${out}`);
