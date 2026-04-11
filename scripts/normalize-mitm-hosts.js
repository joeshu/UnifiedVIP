#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const configsDir = path.join(root, 'configs');

function normalizeHost(host) {
  return String(host || '').trim().toLowerCase();
}

function sortHosts(hosts) {
  return [...hosts].sort((a, b) => {
    const aw = a.includes('*') ? 1 : 0;
    const bw = b.includes('*') ? 1 : 0;
    if (aw !== bw) return aw - bw;
    const ad = a.split('.').length;
    const bd = b.split('.').length;
    if (ad !== bd) return bd - ad;
    return a.localeCompare(b);
  });
}

function run() {
  const files = fs.readdirSync(configsDir).filter(f => f.endsWith('.json')).sort();
  let changed = 0;
  let touchedHosts = 0;

  for (const file of files) {
    const fullPath = path.join(configsDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const json = JSON.parse(raw);
    if (!Array.isArray(json.mitmHosts)) continue;

    const before = json.mitmHosts.slice();
    const normalized = sortHosts(Array.from(new Set(before.map(normalizeHost).filter(Boolean))));
    json.mitmHosts = normalized;

    const beforeStr = JSON.stringify(before);
    const afterStr = JSON.stringify(normalized);
    if (beforeStr !== afterStr) {
      fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + '\n');
      changed++;
      touchedHosts += normalized.length;
      console.log(`normalized: ${file} (${normalized.length} hosts)`);
    }
  }

  console.log(`\n✅ normalize done: files=${changed}, hosts=${touchedHosts}`);
}

run();
