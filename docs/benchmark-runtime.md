# Runtime Benchmark

说明：

- `npm run benchmark:runtime` / `npm run benchmark:runtime:fast`
  - 固定样本、快速模式，输出 `dist/benchmark-runtime.json`
- `npm run benchmark:runtime:full`
  - 完整模式，除 JSON 外还会更新本文件

固定样本：

- json: `tophub`
- regex: `keep`
- html: `v2ex`
- hybrid: `bxkt`

关注指标：

- `manifest.warm` / `manifest.coldish`
- `config_loader.storage` / `config_loader.memory`
- `engine.json` / `engine.regex` / `engine.html` / `engine.hybrid`
- `json_profile.*`
- `processor_profile.*`

说明：

- runtime benchmark 比 prefix benchmark 更接近真实请求链路，但也更容易受环境波动影响
- 建议优先用于本地性能分析与回归对比，暂不直接作为严格 CI 阈值门禁
