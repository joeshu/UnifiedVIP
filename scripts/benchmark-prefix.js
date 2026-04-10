#!/usr/bin/env node

const { performance } = require('perf_hooks');
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
  const keywordEntries = Object.entries(index.keyword || {}).sort((a, b) => b[0].length - a[0].length);
  const keywordBuckets = {};
  for (const [kw, ids] of keywordEntries) {
    const head = kw[0] || '#';
    if (!keywordBuckets[head]) keywordBuckets[head] = [];
    keywordBuckets[head].push([kw, ids]);
  }
  const cache = new Map();
  const CACHE_LIMIT = 200;

  function cacheSet(k, v) {
    if (cache.size >= CACHE_LIMIT) {
      const first = cache.keys().next().value;
      cache.delete(first);
    }
    cache.set(k, v);
  }

  return function findByPrefixOptimized(hostname) {
    const h = String(hostname || '').toLowerCase();
    if (!h) return null;
    if (cache.has(h)) return cache.get(h);

    let out = null;
    if (index.exact[h]) {
      out = { ids: index.exact[h], method: 'exact', matched: h };
    } else {
      for (const [suffix, ids] of suffixEntries) {
        if (h === suffix || h.endsWith('.' + suffix)) {
          out = { ids, method: 'suffix', matched: suffix };
          break;
        }
      }
      if (!out) {
        const seen = new Set();
        for (let i = 0; i < h.length; i++) {
          const ch = h[i];
          if (ch === '.' || ch === '-' || ch === '_') continue;
          if (seen.has(ch)) continue;
          seen.add(ch);
          const bucket = keywordBuckets[ch];
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
  console.log(`${name}: avg=${avg.toFixed(2)}ms ops/s=${ops} matched=${matched}/${hosts.length}`);
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

console.log('=== Prefix Matching Benchmark ===');
const index = generatePrefixIndex();
const baseline = baselineFactory(index);
const optimized = optimizedFactory(index);
const { repeated, diverse } = makeHostData(index);

console.log(`index: exact=${Object.keys(index.exact).length}, suffix=${Object.keys(index.suffix).length}, keyword=${Object.keys(index.keyword).length}`);
console.log('--- high-repeat hosts (cache friendly) ---');
bench('baseline', baseline, repeated, 6);
bench('optimized', optimized, repeated, 6);
console.log('--- diverse hosts (cache less friendly) ---');
bench('baseline', baseline, diverse, 6);
bench('optimized', optimized, diverse, 6);
