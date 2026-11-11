# wf.json(+ extra.json) 의 행을 묶음별 표로 만든다. c1 판정 규칙을 적용한다:
# k11 c11 3절 · 4절을 근거로 한 행만 「다름(의도)」, 2절만 근거인 행은 「다름」 + 비고 머리말.
import json, re, collections, os
T = '/Users/uhd/.claude/jobs/2d2d4469/tmp/'
d = json.load(open(T + 'wf.json'))
rows = d['rows']
if os.path.exists(T + 'extra.json'):
    ex = json.load(open(T + 'extra.json'))
    ids = {r['id'] for r in ex}
    rows = [r for r in rows if r['id'] not in ids] + ex
TO_DIFF = {'T98', 'X5', 'X27', 'R-F47', 'R-F54', 'R-F63', 'T117b-rel', 'T117c'}
for r in rows:
    if r['id'] in TO_DIFF and r['verdict'] == '다름(의도)':
        r['verdict'] = '다름'
        r['note'] = '[c1 규칙으로 다름(의도)를 다름으로 고침: 근거가 k11 c11 2절뿐] ' + r['note']


def grp(r):
    if r['id'] == 'BREAK':
        return 'break'
    if r['id'] == 'T97':
        return 'AB'
    m = re.search(r'out/([A-Za-z0-9]+)/', r.get('evidence', ''))
    if m:
        return m.group(1)
    return 'R' if r['id'].startswith('R-') else 'X' if r['id'].startswith('X') else '?'


by = collections.defaultdict(list)
for r in rows:
    by[grp(r)].append(r)
esc = lambda s: str(s).replace('|', '\\|').replace('\n', '<br>')
out = ['# k12 리팩터링 뒤 전체 기능 시험 결과 표', '',
       '기준선 base = main dd6cda9, 대상 tgt = k11-refactor 2d2d846. 판정 규칙은 카드 k12 c1 을 따른다.', '',
       '| 묶음 | 행 | 같음 | 다름 | 다름(의도) | 실행하지 못함 |', '|---|---|---|---|---|---|']
tot = collections.Counter()
for g in sorted(by):
    c = collections.Counter(r['verdict'] for r in by[g])
    tot += c
    out.append(f"| {g} | {len(by[g])} | {c['같음']} | {c['다름']} | {c['다름(의도)']} | {c['실행하지 못함']} |")
out.append(f"| 합계 | {sum(tot.values())} | {tot['같음']} | {tot['다름']} | {tot['다름(의도)']} | {tot['실행하지 못함']} |")
for g in sorted(by):
    out += ['', f'## 묶음 {g}', '', '| id | 시나리오 | 기준선 출력 | 대상 출력 | 판정 | 비고 | 증거 |', '|---|---|---|---|---|---|---|']
    for r in by[g]:
        out.append('| ' + ' | '.join(esc(r.get(k, '')) for k in ('id', 'title', 'base', 'tgt', 'verdict', 'note', 'evidence')) + ' |')
out += ['', '## diff 덩어리 검토(main..k11-refactor)', '', '| 앵커 | 커밋 | 종류 | 변경 | 의도 근거 | 확인한 행 |', '|---|---|---|---|---|---|']
for h in d['hunks']:
    out.append('| ' + ' | '.join(esc(', '.join(h.get(k, [])) if k == 'coveredBy' else h.get(k, '')) for k in ('anchor', 'commit', 'kind', 'change', 'intended', 'coveredBy')) + ' |')
os.makedirs(T + 'final', exist_ok=True)
open(T + 'final/refactor-table.md', 'w').write('\n'.join(out) + '\n')
print(dict(tot), {g: len(v) for g, v in by.items()})
