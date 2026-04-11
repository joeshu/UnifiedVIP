# Prefix Matching Benchmark

- Generated: 2026-04-11T03:06:17.277Z
- Index: exact=19, suffix=27, keyword=53

## High-repeat hosts (cache friendly)

- baseline: avg=2590.13ms, ops/s=3861
- optimized: avg=365.74ms, ops/s=27342
- gain: **7.08x**

## Diverse hosts (cache less friendly)

- baseline: avg=2741.51ms, ops/s=3648
- optimized: avg=513.89ms, ops/s=19459
- gain: **5.33x**
