#!/usr/bin/env node

const { getAllConfigs } = require('../src/apps/_index');

function classifyHost(host) {
  if (host.includes('*')) return 'wildcard';
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return 'ipv4';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return 'domain';
  return 'unknown';
}

function isQxSafeHost(host) {
  const h = String(host || '').trim().toLowerCase();
  if (!h) return false;

  // 精确 IPv4
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h)) return true;

  // 精确域名
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;

  // 左侧通配：*.example.com
  if (/^\*\.(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(h)) return true;

  // 中间单段通配：prefix.*.tld（QX 实测可用）
  if (/^(?:[a-z0-9-]+\.)+\*\.(?:[a-z0-9-]+\.)*[a-z]{2,}$/.test(h)) return true;

  return false;
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

    // 全量显式：每个配置都必须包含 mitmHosts 字段（可为空数组）
    if (!Array.isArray(cfg.mitmHosts)) {
      errors.push(`${id}: 缺少显式 mitmHosts 字段（要求全量显式）`);
      continue;
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

      if (!isQxSafeHost(h)) {
        warnings.push(`${id}: 非 QX 安全的 mitmHosts 已在构建时自动过滤 -> ${h}`);
      }
    });
  }

  if (duplicateHosts.size > 0) {
    warnings.push(`发现重复 mitmHosts: ${Array.from(duplicateHosts).join(', ')}`);
  }

  console.log('🔍 MITM 专项检查（全量显式）');
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
