#!/usr/bin/env node

const { getAllConfigs } = require('../src/apps/_index');

function extractHostname(pattern) {
  if (!pattern || typeof pattern !== 'string') return null;

  // 先尝试直接从模式里提取第一个可识别域名片段（支持转义点号）
  const token = pattern.match(/[a-z0-9-]+(?:\\\.[a-z0-9-]+)+/i);
  if (token && token[0]) {
    const host = token[0].replace(/\\\./g, '.').toLowerCase();
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return host;
  }

  // 回退到旧逻辑
  let cleaned = pattern
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/^https\?\:/, '')
    .replace(/^https\:/, '')
    .replace(/^http\:/, '');

  cleaned = cleaned.replace(/\\\//g, '/');
  if (cleaned.startsWith('//')) cleaned = cleaned.slice(2);

  const slashIdx = cleaned.indexOf('/');
  if (slashIdx > 0) cleaned = cleaned.slice(0, slashIdx);

  cleaned = cleaned.replace(/^\(\?:www\.\)\?/, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.replace(/\\\./g, '.');

  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  return null;
}

function isComplexUrlPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') return false;
  return /\(\?:|\|/.test(pattern);
}

function classifyHost(host) {
  if (host.includes('*')) return 'wildcard';
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return 'ipv4';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return 'domain';
  return 'unknown';
}

function run() {
  const allConfigs = getAllConfigs();
  const errors = [];
  const warnings = [];
  const seen = new Set();
  const duplicateHosts = new Set();
  const hostStats = { domain: 0, wildcard: 0, ipv4: 0, unknown: 0 };

  for (const [id, cfg] of Object.entries(allConfigs)) {
    const explicitHosts = Array.isArray(cfg.mitmHosts)
      ? cfg.mitmHosts.filter(h => typeof h === 'string' && h.trim()).map(h => h.trim())
      : [];
    const autoHost = extractHostname(cfg.urlPattern);

    if (explicitHosts.length === 0 && !autoHost) {
      errors.push(`${id}: 无法从 urlPattern 提取 hostname，且未配置 mitmHosts`);
    }

    if (isComplexUrlPattern(cfg.urlPattern) && explicitHosts.length === 0) {
      errors.push(`${id}: 复杂 urlPattern 必须显式配置 mitmHosts`);
    }

    explicitHosts.forEach(h => {
      const t = classifyHost(h);
      hostStats[t] = (hostStats[t] || 0) + 1;

      if (seen.has(h)) duplicateHosts.add(h);
      seen.add(h);

      if (h === '*' || h === '*.*' || h === '*.*.*') {
        errors.push(`${id}: 存在过宽通配 host -> ${h}`);
      }

      if (/^\*\.[^.]+\.[^.]+\.[^.]+/.test(h)) {
        warnings.push(`${id}: 多级通配 host 请确认必要性 -> ${h}`);
      }
    });
  }

  if (duplicateHosts.size > 0) {
    warnings.push(`发现重复 mitmHosts: ${Array.from(duplicateHosts).join(', ')}`);
  }

  console.log('🔍 MITM 专项检查');
  console.log(`   配置数: ${Object.keys(allConfigs).length}`);
  console.log(`   显式 mitmHosts 统计: domain=${hostStats.domain}, wildcard=${hostStats.wildcard}, ipv4=${hostStats.ipv4}, unknown=${hostStats.unknown}`);

  if (warnings.length > 0) {
    console.log(`\n⚠️ 警告 ${warnings.length} 项:`);
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ 错误 ${errors.length} 项:`);
    errors.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  }

  console.log('\n✅ MITM 检查通过');
}

run();
