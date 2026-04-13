#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manualJsonPath = path.join(root, 'rules/mitm-manual.json');
const configsDir = path.join(root, 'configs');

function normalizeHost(host) {
  return String(host || '').trim().toLowerCase();
}

function classifyHost(host) {
  if (host.includes('*')) return 'wildcard';
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return 'ipv4';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return 'domain';
  return 'unknown';
}

function isQxSafeHost(host) {
  const h = normalizeHost(host);
  if (!h) return false;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h)) return true;
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;
  if (/^\*\.(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;
  if (/^(?:[a-z0-9-]+\.)+\*\.(?:[a-z0-9-]+\.)*[a-z]{2,}$/.test(h)) return true;
  return false;
}

function getValidAppIds() {
  return new Set(
    fs.readdirSync(configsDir)
      .filter(name => name.endsWith('.json'))
      .map(name => path.basename(name, '.json'))
  );
}

function run() {
  if (!fs.existsSync(manualJsonPath)) {
    console.log('ℹ️ mitm-manual.json 不存在，跳过');
    return;
  }

  const validAppIds = getValidAppIds();
  const parsed = JSON.parse(fs.readFileSync(manualJsonPath, 'utf8'));
  const errors = [];
  const warnings = [];
  const seenHosts = new Map();
  const stats = { domain: 0, wildcard: 0, ipv4: 0, unknown: 0 };

  for (const [group, hosts] of Object.entries(parsed || {})) {
    if (group !== '_shared' && !validAppIds.has(group)) {
      errors.push(`未知 manual 分组: ${group}`);
    }

    if (!Array.isArray(hosts)) {
      errors.push(`${group}: hosts 必须是数组`);
      continue;
    }

    hosts.forEach((host, index) => {
      if (typeof host !== 'string') {
        errors.push(`${group}[${index}]: host 必须是字符串`);
        return;
      }

      const normalized = normalizeHost(host);
      if (!normalized) {
        warnings.push(`${group}[${index}]: 空 host 已忽略`);
        return;
      }

      const t = classifyHost(normalized);
      stats[t] = (stats[t] || 0) + 1;

      if (seenHosts.has(normalized)) {
        warnings.push(`重复 manual host: ${normalized} (${seenHosts.get(normalized)} + ${group})`);
      } else {
        seenHosts.set(normalized, group);
      }

      if (normalized === '*' || normalized === '*.*' || normalized === '*.*.*') {
        errors.push(`${group}: 存在过宽通配 host -> ${normalized}`);
      }
      if (!isQxSafeHost(normalized)) {
        warnings.push(`${group}: 非 QX 安全 host，构建时将被过滤 -> ${normalized}`);
      }
    });
  }

  console.log('🔍 manual MITM 检查');
  console.log(`   分组数: ${Object.keys(parsed || {}).length}`);
  console.log(`   hosts 统计: domain=${stats.domain}, wildcard=${stats.wildcard}, ipv4=${stats.ipv4}, unknown=${stats.unknown}`);

  if (warnings.length > 0) {
    console.log(`\n⚠️ 警告 ${warnings.length} 项:`);
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ 错误 ${errors.length} 项:`);
    errors.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  }

  console.log('\n✅ manual MITM 检查通过');
}

run();
