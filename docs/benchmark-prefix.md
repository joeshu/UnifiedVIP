# Prefix Matching Benchmark

- Generated: 2026-04-11T04:14:58.385Z
- Index: exact=19, suffix=27, keyword=53

## High-repeat hosts (cache friendly)

- baseline: avg=2556.53ms, ops/s=3912
- optimized: avg=371.95ms, ops/s=26886
- gain: **6.87x**

## Diverse hosts (cache less friendly)

- baseline: avg=2816.95ms, ops/s=3550
- optimized: avg=567.74ms, ops/s=17614
- gain: **4.96x**
