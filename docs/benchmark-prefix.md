# Prefix Matching Benchmark

- Generated: 2026-04-10T15:18:46.304Z
- Index: exact=19, suffix=28, keyword=57

## High-repeat hosts (cache friendly)

- baseline: avg=4283.93ms, ops/s=2334
- optimized: avg=1187.41ms, ops/s=8422
- gain: **3.61x**

## Diverse hosts (cache less friendly)

- baseline: avg=4452.53ms, ops/s=2246
- optimized: avg=1621.56ms, ops/s=6167
- gain: **2.75x**
