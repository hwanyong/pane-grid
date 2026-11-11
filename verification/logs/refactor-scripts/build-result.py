import json, os, re, collections
T = '/Users/uhd/.claude/jobs/2d2d4469/tmp/'
exec(open(T + 'build-table.py').read().split("by = collections")[0])  # rows, TO_DIFF 적용까지
def grp(r):
    if r['id'] == 'BREAK': return 'break'
    if r['id'] == 'T97': return 'AB'
    m = re.search(r'out/([A-Za-z0-9]+)/', r.get('evidence', ''))
    return m.group(1) if m else 'X'
by = collections.defaultdict(list)
for r in rows: by[grp(r)].append(r)
tot = collections.Counter(); lines = []
for g in sorted(by):
    c = collections.Counter(r['verdict'] for r in by[g]); tot += c
    lines.append(f"| {g} | {len(by[g])} | {c['같음']} | {c['다름']} | {c['다름(의도)']} | {c['실행하지 못함']} |")
lines.append(f"| 합계 | {sum(tot.values())} | {tot['같음']} | {tot['다름']} | {tot['다름(의도)']} | {tot['실행하지 못함']} |")
head = open(T + 'result-head.md').read().replace('{{SUMMARY}}', '\n'.join(lines))
cut = lambda s: (s[:240] + '…') if len(s) > 240 else s
esc = lambda s: cut(str(s)).replace('|', '\\|').replace('\n', ' ')
body = ['| id | 시나리오 | 기준선 | 대상 | 비고(재현 · 원인 커밋) | 증거 |', '|---|---|---|---|---|---|']
for r in rows:
    if r['verdict'] == '다름' and r['id'] != 'BREAK':
        body.append('| ' + ' | '.join(esc(r[k]) for k in ('id', 'title', 'base', 'tgt')) + ' | ' + str(r['note']).replace('|', '\\|').replace('\n', ' ') + ' | ' + esc(r['evidence']) + ' |')
intent = ['', '## 8. 「다름(의도)」 행', '', '| id | 근거 |', '|---|---|']
for r in rows:
    if r['verdict'] == '다름(의도)':
        intent.append(f"| {r['id']} | {esc(r['note'])} |")
tail = ['', '## 9. 결정해 줄 것', '',
        '1. 2절만 근거인 「다름」 행(T56 T98 T109 F71s X1~X4c X6 X8 X9 X11 X13 X15 X16 X18 X21 X25 X27 T117d R-F47 R-F54 R-F63 T117b-rel T117c 등)을 k11 의 의도한 수정으로 인정할지. 인정하면 「다름(의도)」로 바꾸면 되고 행 내용은 그대로다.',
        '2. 의도 밖 결함 후보 여섯 가지(T117e · X14 의 `/layout.json` 쓰기, X12, X23, F71m · X24, X26, T106)를 고칠 카드로 보낼지. 권하는 것: T117e · X14 와 X12 는 사용자 파일 자리에 관한 것이라 먼저 고칠 카드로, X23 · F71m · X26 은 묶어서 한 카드로, T106 · T109 는 문서에 적는 것으로 끝낸다.']
open(T + 'final/result.md', 'w').write(head + '\n'.join(body) + '\n' + '\n'.join(intent) + '\n' + '\n'.join(tail) + '\n')
print(dict(tot), len(body) - 2)
