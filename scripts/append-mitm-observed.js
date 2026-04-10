#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const observedPath = path.join(root, 'rules', 'mitm-observed.txt');

function isQxSafeHost(host) {
  const h = String(host || '').trim().toLowerCase();
  if (!h) return false;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h)) return true;
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;
  if (/^\*\.(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;
  return false;
}

function usage() {
  console.log('Usage: npm run mitm:append -- <host1> <host2> ... [--dry-run]');
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const rawHosts = args.filter(a => a !== '--dry-run').map(s => s.trim()).filter(Boolean);

if (rawHosts.length === 0) {
  usage();
  process.exit(1);
}

if (!fs.existsSync(observedPath)) {
  fs.mkdirSync(path.dirname(observedPath), { recursive: true });
  fs.writeFileSync(
    observedPath,
    '# 观测到的动态 host（QX-safe 精确域名优先）\n# 一行一个，支持注释行(#)和空行\n',
    'utf8'
  );
}

const content = fs.readFileSync(observedPath, 'utf8');
const lines = content.split('\n');
const existingHosts = new Set(
  lines
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('#'))
);

const invalid = [];
const duplicates = [];
const added = [];

for (const h of rawHosts) {
  const host = h.toLowerCase();
  if (!isQxSafeHost(host)) {
    invalid.push(host);
    continue;
  }
  if (existingHosts.has(host)) {
    duplicates.push(host);
    continue;
  }
  existingHosts.add(host);
  added.push(host);
}

if (invalid.length > 0) {
  console.log('⚠️ 非 QX-safe，已跳过:');
  invalid.forEach(h => console.log(`  - ${h}`));
}

if (duplicates.length > 0) {
  console.log('ℹ️ 已存在，未重复写入:');
  duplicates.forEach(h => console.log(`  - ${h}`));
}

if (added.length === 0) {
  console.log('✅ 无新增 host');
  process.exit(0);
}

if (dryRun) {
  console.log('🧪 dry-run，将新增:');
  added.forEach(h => console.log(`  - ${h}`));
  process.exit(0);
}

let output = content;
if (!output.endsWith('\n')) output += '\n';
for (const h of added) output += `${h}\n`;
fs.writeFileSync(observedPath, output, 'utf8');

console.log(`✅ 已写入 ${added.length} 个 host 到 ${observedPath}`);
added.forEach(h => console.log(`  - ${h}`));
