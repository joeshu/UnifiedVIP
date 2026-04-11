#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const benchmarkPath = path.join(__dirname, '../dist/benchmark-prefix.json');
const thresholdPct = Number(process.argv[2] || 15);

if (!fs.existsSync(benchmarkPath)) {
  console.error(`benchmark json not found: ${benchmarkPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
const diverse = data?.results?.diverse;
if (!diverse?.baseline?.avg_ms || !diverse?.optimized?.avg_ms) {
  console.error('invalid benchmark json: missing diverse averages');
  process.exit(1);
}

const gainPct = ((diverse.baseline.avg_ms - diverse.optimized.avg_ms) / diverse.baseline.avg_ms) * 100;
console.log(`diverse gain: ${gainPct.toFixed(2)}% (threshold=${thresholdPct}%)`);
if (gainPct < thresholdPct) {
  console.error(`diverse benchmark gain below threshold: ${gainPct.toFixed(2)}% < ${thresholdPct}%`);
  process.exit(1);
}

console.log('✅ benchmark threshold passed');
