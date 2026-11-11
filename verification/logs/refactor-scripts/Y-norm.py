#!/usr/bin/env python3 -I
# Y-norm.py: R-sdk.py 의 stdout 을 T93 대조용으로 줄인다.
#   ui_render 응답에서 남기는 것: 칸 상자(cellbox:<id>)의 width, 모든 Client 요소(key · module),
#   key 가 divider: 인 Box 의 글자(글자 종류와 개수), choices: Box 의 key.
#   지운 것: request_id, initialize 응답 본문, 그 밖의 tree.
import json, sys
from collections import Counter

def texts(node, out):
    if isinstance(node, str):
        out.append(node)
    elif isinstance(node, dict):
        for c in node.get('children') or []:
            texts(c, out)
    elif isinstance(node, list):
        for c in node:
            texts(c, out)

def walk(node, out):
    if isinstance(node, dict):
        props = node.get('props') or {}
        key = props.get('key')
        if node.get('type') == 'Client':
            out.append(f"Client[{key} {props.get('module')}]")
        elif isinstance(key, str) and key.startswith('cellbox:'):
            out.append(f"{key} w={props.get('width')}")
        elif isinstance(key, str) and key.startswith('divider:'):
            t = []
            texts(node, t)
            chars = Counter(''.join(t).replace('\n', ''))
            out.append(f"textdivider[{key} " + ','.join(f"{c}x{n}" for c, n in sorted(chars.items())) + "]")
        elif isinstance(key, str) and key.startswith('choices:'):
            out.append(key)
        for c in node.get('children') or []:
            walk(c, out)
    elif isinstance(node, list):
        for c in node:
            walk(c, out)

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
    sub = m.get('subtype')
    r = m.get('resp') or {}
    r.pop('request_id', None)
    if sub == 'initialize':
        print(f"[{m['i']}] initialize {r.get('subtype')}")
    elif sub == 'ui_render' and r.get('subtype') == 'success':
        out = []
        walk(r.get('response', {}).get('tree'), out)
        print(f"[{m['i']}] ui_render ok")
        for o in out:
            print(f"    {o}")
    else:
        print(f"[{m['i']}] {sub} {json.dumps(r, ensure_ascii=False, sort_keys=True)}")
