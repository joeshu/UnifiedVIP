#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseMitm(confText) {
  const line = String(confText || '').split('\n').find(l => l.trim().startsWith('hostname =')) || '';
  return new Set(
    line.replace(/^\s*hostname\s*=\s*/, '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );
}

function readSourceMap(reportText) {
  const map = {};
  let inTable = false;
  for (const line of String(reportText || '').split('\n')) {
    if (line.trim() === '## Host 来源摘要') {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const host = parts[0];
    const source = parts[1];
    if (host && source && host !== 'Host') map[host] = source;
  }
  return map;
}

function main() {
  const beforePath = process.argv[2];
  const afterPath = process.argv[3];
  const reportPath = process.argv[4];
  if (!beforePath || !afterPath) {
    console.error('Usage: node scripts/diff-mitm-summary.js <before.conf> <after.conf> [report.md]');
    process.exit(1);
  }

  const before = parseMitm(fs.existsSync(beforePath) ? fs.readFileSync(beforePath, 'utf8') : '');
  const after = parseMitm(fs.readFileSync(afterPath, 'utf8'));
  const reportMap = reportPath && fs.existsSync(reportPath)
    ? readSourceMap(fs.readFileSync(reportPath, 'utf8'))
    : {};

  const added = [...after].filter(h => !before.has(h)).sort();
  const removed = [...before].filter(h => !after.has(h)).sort();

  const lines = [];
  lines.push(`# MITM Summary`);
  lines.push('');
  lines.push(`- added: ${added.length}`);
  lines.push(`- removed: ${removed.length}`);
  lines.push('');

  lines.push('## Added');
  lines.push('');
  if (added.length === 0) lines.push('- (none)');
  else added.forEach(h => lines.push(`- ${h}${reportMap[h] ? `  ← ${reportMap[h]}` : ''}`));
  lines.push('');

  lines.push('## Removed');
  lines.push('');
  if (removed.length === 0) lines.push('- (none)');
  else removed.forEach(h => lines.push(`- ${h}`));

  console.log(lines.join('\n'));
}

main();
