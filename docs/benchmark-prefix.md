# Prefix Matching Benchmark

- Generated: 2026-04-11T02:34:38.900Z
- Index: exact=19, suffix=27, keyword=53

## High-repeat hosts (cache friendly)

- baseline: avg=2322.11ms, ops/s=4306
- optimized: avg=340.83ms, ops/s=29340
- gain: **6.81x**

## Diverse hosts (cache less friendly)

- baseline: avg=2576.84ms, ops/s=3881
- optimized: avg=488.18ms, ops/s=20484
- gain: **5.28x**
