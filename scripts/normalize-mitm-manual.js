#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manualJsonPath = path.join(root, 'rules/mitm-manual.json');

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
  if (!fs.existsSync(manualJsonPath)) {
    console.log('ℹ️ mitm-manual.json 不存在，跳过');
    return;
  }

  const raw = fs.readFileSync(manualJsonPath, 'utf8');
  const parsed = JSON.parse(raw);
  const out = {};
  let groups = 0;
  let hosts = 0;

  for (const key of Object.keys(parsed).sort((a, b) => {
    if (a === '_shared') return -1;
    if (b === '_shared') return 1;
    return a.localeCompare(b);
  })) {
    const list = Array.isArray(parsed[key]) ? parsed[key] : [];
    const normalized = sortHosts(Array.from(new Set(list.map(normalizeHost).filter(Boolean))));
    out[key] = normalized;
    groups++;
    hosts += normalized.length;
  }

  fs.writeFileSync(manualJsonPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`✅ normalized manual mitm: groups=${groups}, hosts=${hosts}`);
}

run();
