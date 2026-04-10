# CI / MITM 校验说明

新增能力：

1. `npm run check:mitm`
   - 复杂 `urlPattern`（含 `(?:` 或 `|`）必须显式配置 `mitmHosts`
   - 检查异常通配 host
   - 输出 mitmHosts 统计

2. PR 模板检查项
   - 约束修改 `urlPattern` 时同步评估 `mitmHosts`

3. CI 工作流增强
   - 在 build 前执行 `validate` + `check:mitm`
   - PR 场景自动对比 base 分支与当前分支的 `dist/rewrite.conf` 中 `[mitm] hostname` 差异

本地建议流程：

```bash
npm run validate
npm run check:mitm
npm run build
```
