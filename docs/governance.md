# 治理与流程（Governance）

本项目采用“配置变更可审计、构建结果可验证、MITM 可控可回溯”的治理原则。

## 1) 变更准入（Change Gate）

任何涉及 `configs/*.json`、`scripts/build/*`、`dist/rewrite.conf` 的变更，PR 必须满足：

1. `npm run validate` 通过
2. `npm run check:mitm` 通过
3. `npm run build` 成功
4. 在 PR 描述中填写 MITM 变更摘要（新增/删除/原因）

建议在本地执行：

```bash
npm run validate && npm run check:mitm && npm run build
```

## 2) MITM 治理规则

### 2.1 来源优先级

`[mitm] hostname` 统一按以下优先级生成：

1. 手工显式 `mitmHosts`（配置文件）
2. 自动提取（`urlPattern`）
3. 观测增量（`rules/mitm-observed.txt`）

### 2.2 白名单形态（QX 兼容）

允许：

- 精确域名：`api.example.com`
- 前缀通配：`*.example.com`
- 中间通配（已验证）：`prefix.*.com`
- IPv4：`1.2.3.4`

不建议提交无法在 QX 稳定识别的复杂形态。

### 2.3 变更可追踪

- 任何 MITM 变更需在 PR 模板中说明。
- `dist/mitm-filter-report.md` 用于记录过滤与纳入结果。

## 3) 配置治理规则（Config Hygiene）

1. 新增/修改 app 时优先维护显式 `mitmHosts`。
2. 若 `urlPattern` 变更，必须复核 `mitmHosts`。
3. 配置命名、字段语义保持一致（参考现有 `configs/*.json`）。
4. 对缺少 `urlPattern` 的配置，需明确“跳过原因”。

可使用：

```bash
python3 scripts/audit-app-configs.py
```

## 4) 性能治理（Prefix Matching）

当前已启用：

- LRU host 缓存
- keyword 二字符分桶
- suffix 反向 Trie 匹配

基准命令：

```bash
npm run benchmark:prefix
```

基准报告输出：`docs/benchmark-prefix.md`。

## 5) CI 治理

CI 至少应在 PR 触发：

- `npm run validate`
- `npm run check:mitm`
- `npm run build`

可选增强（后续）：

- benchmark 阈值门禁（低于基线比例则失败）
- 自动评论 MITM diff

## 6) 发布前检查（Release Checklist）

- [ ] `validate/check:mitm/build` 全通过
- [ ] `dist/rewrite.conf` 变更已人工复核
- [ ] MITM 变更摘要已记录
- [ ]（可选）已更新 `docs/benchmark-prefix.md`

---

如需批量补齐：

```bash
python3 scripts/fill-mitm-hosts.py
```

如需增量追加观测 host：

```bash
npm run mitm:append -- <host1> <host2>
```
