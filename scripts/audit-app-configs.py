import json, re, os
from pathlib import Path

root = Path('/var/minis/workspace/UnifiedVIP')
cfg_dir = root / 'configs'
files = sorted(cfg_dir.glob('*.json'))

complex_re = re.compile(r'\(\?:|\|')
host_token_re = re.compile(r'[a-z0-9-]+(?:\\\.[a-z0-9-]+)+', re.I)

def extract_host(pattern: str):
    if not isinstance(pattern, str):
        return None
    m = host_token_re.search(pattern)
    if m:
        h = m.group(0).replace('\\.', '.').lower()
        if re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', h):
            return h
    cleaned = pattern
    cleaned = re.sub(r'^\^', '', cleaned)
    cleaned = re.sub(r'\$$', '', cleaned)
    cleaned = re.sub(r'^https\?\:', '', cleaned)
    cleaned = re.sub(r'^https\:', '', cleaned)
    cleaned = re.sub(r'^http\:', '', cleaned)
    cleaned = cleaned.replace('\\/', '/')
    if cleaned.startswith('//'):
        cleaned = cleaned[2:]
    if '/' in cleaned:
        cleaned = cleaned.split('/',1)[0]
    cleaned = re.sub(r'^\(\?:www\.\)\?', '', cleaned)
    cleaned = re.sub(r'^www\.', '', cleaned)
    cleaned = cleaned.replace('\\.', '.')
    if re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', cleaned):
        return cleaned.lower()
    return None

rows = []
skipped = []
for f in files:
    data = json.loads(f.read_text())
    urlp = data.get('urlPattern')
    if not isinstance(urlp, str) or not urlp.strip():
        skipped.append(f.name)
        continue
    mitm = data.get('mitmHosts') if isinstance(data.get('mitmHosts'), list) else []
    mode = data.get('mode','(none)')
    app_id = data.get('id') or f.stem
    name = data.get('name') or app_id
    is_complex = bool(complex_re.search(urlp))
    auto = extract_host(urlp)
    risk = 'LOW'
    if is_complex and not mitm:
        risk = 'HIGH'
    elif (not mitm) and (not auto):
        risk = 'MEDIUM'
    rows.append({
        'file': f.name, 'id': app_id, 'name': name, 'mode': mode,
        'complex': is_complex, 'mitm_count': len(mitm), 'auto_host': auto or '-', 'risk': risk
    })

rows.sort(key=lambda x: (x['risk']!='HIGH', x['risk']!='MEDIUM', x['id']))

md = []
md.append('# UnifiedVIP App 配置体检报告')
md.append('')
md.append(f'- configs/*.json 总数: **{len(files)}**')
md.append(f'- 生效配置(urlPattern存在): **{len(rows)}**')
md.append(f'- 跳过配置(urlPattern缺失): **{len(skipped)}**')
if skipped:
    md.append(f"- 跳过文件: {', '.join(skipped)}")
md.append('')

high = [r for r in rows if r['risk']=='HIGH']
medium = [r for r in rows if r['risk']=='MEDIUM']
md.append(f"- HIGH 风险: **{len(high)}**")
md.append(f"- MEDIUM 风险: **{len(medium)}**")
md.append('')

md.append('## 风险清单')
md.append('')
md.append('| id | file | mode | complex | mitmHosts | autoHost | risk |')
md.append('|---|---|---:|---:|---:|---|---|')
for r in rows:
    md.append(f"| {r['id']} | {r['file']} | {r['mode']} | {'Y' if r['complex'] else 'N'} | {r['mitm_count']} | {r['auto_host']} | {r['risk']} |")

md.append('')
md.append('## 建议动作')
md.append('')
if not high and not medium:
    md.append('- 当前无高风险遗漏，维持现状即可。')
else:
    if high:
        md.append('- 优先为 HIGH 风险项补充 `mitmHosts`（复杂正则且无显式域名）。')
    if medium:
        md.append('- 为 MEDIUM 风险项补充 `mitmHosts`，减少依赖自动提取。')

out = root / 'docs' / 'app-config-audit.md'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text('\n'.join(md), encoding='utf-8')
print(str(out))
