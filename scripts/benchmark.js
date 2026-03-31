// scripts/benchmark.js
const { performance } = require('perf_hooks');
const { Utils } = require('../src/core/utils');
const { RegexPool } = require('../src/engine/regex-pool');
const { createProcessorFactory } = require('../src/engine/processor-factory');
const { createCompiler } = require('../src/engine/compiler');

global.Utils = Utils;
global.RegexPool = RegexPool;

global.CONFIG = { MAX_PROCESSORS_PER_REQUEST: 1000 };

global.Platform = { isQX: true, isLoon: false, isSurge: false, isStash: false };
global.$notify = () => {};
global.$notification = { post: () => {} };

function bench(name, fn, rounds = 5) {
  const times = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  console.log(`${name}: avg=${avg.toFixed(2)}ms min=${min.toFixed(2)} max=${max.toFixed(2)}`);
}

function makeData(n = 2000) {
  return {
    data: Array.from({ length: n }, (_, i) => ({
      id: i,
      user: { profile: { vip: false, level: 1 } },
      tags: ['a', 'b', 'c'],
      score: i % 10
    }))
  };
}

console.log('=== UnifiedVIP Benchmark ===');

bench('Utils.getPath/setPath x 200k', () => {
  const obj = makeData(200);
  for (let i = 0; i < 100000; i++) {
    const idx = i % 200;
    const p = `data[${idx}].user.profile.vip`;
    const v = Utils.getPath(obj, p);
    Utils.setPath(obj, p, !v);
  }
});

bench('Processor compose x 2k items', () => {
  const factory = createProcessorFactory('BENCH');
  const compile = createCompiler(factory);

  const def = {
    processor: 'compose',
    params: {
      steps: [
        {
          processor: 'mapArray',
          params: {
            path: 'data',
            fields: {
              'user.profile.vip': true,
              'user.profile.level': 9
            }
          }
        },
        {
          processor: 'filterArray',
          params: {
            path: 'data',
            keyField: 'score',
            excludeKeys: [0, 1]
          }
        }
      ]
    }
  };

  const proc = compile(def);
  const obj = makeData(2000);
  proc(obj, { getUrl: () => '' });
});
