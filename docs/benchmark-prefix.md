# Prefix Matching Benchmark

- Generated: 2026-04-11T02:52:57.791Z
- Index: exact=19, suffix=27, keyword=53

## High-repeat hosts (cache friendly)

- baseline: avg=2272.15ms, ops/s=4401
- optimized: avg=325.20ms, ops/s=30750
- gain: **6.99x**

## Diverse hosts (cache less friendly)

- baseline: avg=2547.30ms, ops/s=3926
- optimized: avg=497.64ms, ops/s=20095
- gain: **5.12x**
