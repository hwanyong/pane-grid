#!/usr/bin/env python3 -I
# R-norm.py: R-sdk.py 의 stdout 을 대조용으로 줄인다.
#   - initialize 응답(명령 목록, 계정 정보)은 'ok' 로 줄인다.
#   - ui_render 응답은 tree 전체 대신 칸 상자(cellbox:<id>)의 width 와, 칸 안 marginTop(스크롤 행 수), r-scroller 칸 유무만 남긴다.
#   - request_id 는 지운다(차례 번호라 두 트리에서 같지만 뜻이 없다).
import json, sys

def walk(node, out, cell=''):
    if isinstance(node, dict):
        props = node.get('props') or {}
        key = props.get('key')
        if isinstance(key, str) and key.startswith('cellbox:'):
            cell = key[len('cellbox:'):]
            out.append(f"{key} w={props.get('width')}")
        if 'marginTop' in props and props.get('marginTop'):
            out.append(f"{cell}.marginTop={props.get('marginTop')}")
        if isinstance(key, str) and key.startswith('cell:'):
            out.append(key)
        if isinstance(key, str) and key.startswith('divider:') and node.get('type') == 'Client':
            out.append(f"Client {key}")
        for c in node.get('children') or []:
            walk(c, out, cell)
    elif isinstance(node, list):
        for c in node:
            walk(c, out, cell)

for line in sys.stdin:
    try:
        m = json.loads(line)
    except Exception:
        print(line.rstrip())
        continue
    if 'mark' in m:
        print(f"## {m['mark']}")
        continue
    if 'stderr' in m:
        print('stderr:', m['stderr'].strip()[-400:])
        continue
    if 'user' in m:
        print(f"[{m['i']}] user {m['user']!r} -> {m.get('result')!r}")
        continue
    sub = m.get('subtype')
    r = m.get('resp') or {}
    r.pop('request_id', None)
    if sub == 'initialize':
        print(f"[{m['i']}] initialize {r.get('subtype')}")
    elif sub == 'ui_render' and r.get('subtype') == 'success':
        out = []
        walk(r.get('response', {}).get('tree'), out)
        print(f"[{m['i']}] ui_render ok {' '.join(out)}")
    else:
        print(f"[{m['i']}] {sub} {json.dumps(r, ensure_ascii=False, sort_keys=True)}")
