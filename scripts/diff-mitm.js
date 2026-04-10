#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const before = process.argv[2];
const after = process.argv[3];

if (!before || !after) {
  console.error('Usage: node scripts/diff-mitm.js <before_conf> <after_conf>');
  process.exit(1);
}

function parseHosts(confPath) {
  const txt = fs.readFileSync(confPath, 'utf8');
  const m = txt.match(/\[mitm\][\s\S]*?hostname\s*=\s*([^\n]+)/i);
  if (!m) return new Set();
  return new Set(
    m[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );
}

const a = parseHosts(path.resolve(before));
const b = parseHosts(path.resolve(after));

const added = [...b].filter(x => !a.has(x)).sort();
const removed = [...a].filter(x => !b.has(x)).sort();

console.log('## MITM Host Diff');
console.log(`- Added: ${added.length}`);
console.log(`- Removed: ${removed.length}`);

if (added.length) {
  console.log('\n### Added');
  added.forEach(h => console.log(`- ${h}`));
}
if (removed.length) {
  console.log('\n### Removed');
  removed.forEach(h => console.log(`- ${h}`));
}
