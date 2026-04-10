# Prefix Matching Benchmark

- Generated: 2026-04-10T23:34:37.067Z
- Index: exact=19, suffix=27, keyword=53

## High-repeat hosts (cache friendly)

- baseline: avg=2341.81ms, ops/s=4270
- optimized: avg=692.60ms, ops/s=14438
- gain: **3.38x**

## Diverse hosts (cache less friendly)

- baseline: avg=2553.30ms, ops/s=3917
- optimized: avg=955.85ms, ops/s=10462
- gain: **2.67x**
