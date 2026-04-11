# CI / MITM 校验说明

当前能力：

1. `npm run check:mitm`
   - 要求 active 配置全量显式 `mitmHosts`
   - 检查过宽通配与非 QX-safe host
   - 默认静默扫描；加 `--verbose` 可看完整 configs 日志

2. PR / CI 中的 MITM 变更检查
   - `scripts/diff-mitm.js`：输出 `[mitm] hostname` 原始差异
   - `scripts/diff-mitm-summary.js`：输出新增/删除摘要
   - PR Summary 会同时展示 `MITM Summary` 与 `MITM Host Diff`

3. 动态域名观测机制
   - 观测文件：`rules/mitm-observed.txt`
   - 手工清单：`rules/mitm-manual.txt`
   - 构建会自动合并 `manual + config.mitmHosts + auto:urlPattern + observed`
   - 构建产物输出 `dist/mitm-filter-report.md`

4. 来源优先级与排查
   - 手工清单：`manual:file`
   - 配置显式：`config:mitmHosts(appId)`
   - 自动提取：`auto:urlPattern(appId)`
   - 观测追加：`observed:file`
   - 若某 host 未进入 `[mitm]`，先看 `dist/mitm-filter-report.md` 的来源和是否被 QX-safe 过滤

5. 规范化维护
   - `npm run mitm:normalize`
   - 统一 `mitmHosts` 的大小写、去重与排序

本地建议流程：

```bash
npm run mitm:normalize
npm run validate
npm run check:mitm
npm run build
```
