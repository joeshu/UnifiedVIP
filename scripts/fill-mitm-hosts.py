#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path('/var/minis/workspace/UnifiedVIP')
CFG_DIR = ROOT / 'configs'

HOST_TOKEN_RE = re.compile(r'[a-z0-9-]+(?:\\\.[a-z0-9-]+)+', re.I)


def extract_host(pattern: str):
    if not isinstance(pattern, str) or not pattern.strip():
        return None

    m = HOST_TOKEN_RE.search(pattern)
    if m:
        host = m.group(0).replace('\\.', '.').lower()
        if re.match(r'^(?:[a-z0-9-]+\.)+[a-z]{2,}$', host):
            return host

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
        cleaned = cleaned.split('/', 1)[0]
    cleaned = re.sub(r'^\(\?:www\.\)\?', '', cleaned)
    cleaned = re.sub(r'^www\.', '', cleaned)
    cleaned = cleaned.replace('\\.', '.')
    if re.match(r'^(?:[a-z0-9-]+\.)+[a-z]{2,}$', cleaned, re.I):
        return cleaned.lower()
    return None


updated = []
added_empty = []
skipped = []

for p in sorted(CFG_DIR.glob('*.json')):
    data = json.loads(p.read_text(encoding='utf-8'))

    if not isinstance(data.get('urlPattern'), str) or not data['urlPattern'].strip():
        skipped.append(p.name)
        continue

    if 'mitmHosts' in data and isinstance(data['mitmHosts'], list):
        continue

    host = extract_host(data['urlPattern'])
    if host:
        data['mitmHosts'] = [host]
        updated.append((p.name, host))
    else:
        data['mitmHosts'] = []
        added_empty.append(p.name)

    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('updated_with_host:', len(updated))
for n, h in updated:
    print(f'  {n}: {h}')
print('updated_empty:', len(added_empty))
for n in added_empty:
    print(f'  {n}: []')
print('skipped_no_urlPattern:', len(skipped))
for n in skipped:
    print(f'  {n}')
