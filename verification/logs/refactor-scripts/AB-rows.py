import os, re, json
# 묶음 AB 의 rows.md · rows.json 을 out/AB/<tree>/<id>.txt 와 compare.txt 에서 만든다.
J = '/Users/uhd/.claude/jobs/2d2d4469/tmp/out/AB'
titles = {
'T1':'split -h','T2':'split -v','T3':'split -h <mod>','T4':'T3 뒤 split -v <mod>','T5':'kill','T6':'next 두 번','T7':'select-cell c2',
'T8':'place <mod>','T9':'place <mod> c2','T10':'T8 뒤 place -','T11':'T9 뒤 place - c2','T12':'swap','T13':'T1 뒤 swap c1','T14':'zoom 켜고 끄기',
'T15':'zoom 중 next 의 파일 zoomed','T16':'resize 35','T17':'T1 뒤 resize 99','T18':'layout even-horizontal','T19':'layout even-vertical',
'T20':'layout main-vertical','T21':'layout main-horizontal','T22':'layout tiled','T23':'zoom 뒤 layout tiled','T24':'new','T25':'T24 뒤 new notes',
'T26':'T24 뒤 select w2(파일 그대로)','T27':'rename work','T28':'T24 뒤 close','T29':'break','T30':'list(파일 안 생김)','T31':'reload(global 파일)',
'T32':'T1 뒤 reload(프로젝트 파일)','T33':'사람이 고친 프로젝트 파일 list','T34':'help 16줄',
'T36':'인자 없음','T37':'모르는 verb','T38':'split 잘못된 인자 세 가지','T39':'select-cell c9','T40':'select-cell 인자 없음','T41':'place <mod> c9',
'T42':'place 인자 없음','T43':'swap c9 · swap c1','T44':'resize 잘못된 값 다섯 가지','T45':'layout 잘못된 preset','T46':'new main(이름 겹침)',
'T47':'new 잘못된 이름 세 가지','T48':'rename 잘못된 이름 세 가지','T49':'칸 하나 kill','T50':'탭 하나 close','T51':'칸 하나 break','T52':'칸 하나 swap',
'T53':'select zz · select','T54':'같은 mod 를 다른 칸에 place','T55':'같은 mod 두 칸인 파일','T56':'칸 하나 resize · layout','T94':'place Foo(plugin 이름 규칙)',
'T95':'다른 탭에 놓인 mod 옮김','T96':'다른 탭의 칸 id','T97':'there is no tab','T98':'checkOutcome 의 refused','T99':'command.run 실패',
'T112':'안쪽 노드 칸 resize','T113':'zoom 을 푸는 명령과 두는 명령'}
order = ['T%d' % i for i in list(range(1, 35)) + list(range(36, 57)) + [94, 95, 96, 97, 98, 99, 112, 113]]

def summ(tree, id):
    p = f'{J}/{tree}/{id}.txt'
    if not os.path.exists(p):
        return None
    t = open(p).read()
    out = [l[len('pane-grid: '):] for l in t.splitlines() if l.startswith('pane-grid: ')]
    if id in ('T34', 'T36', 'T37'):
        n = len(re.findall(r'^\S.*  \S', t, re.M))
        out = [o for o in out if not o.startswith('split -h')] + [f'help {n}줄']
    s = ' / '.join(out)
    pl = re.search(r'^--- pl\n(.*?)\n--- log', t, re.S | re.M)
    if pl and pl.group(1).strip() == 'NOFILE':
        s += ' · 파일 NOFILE'
    ls_after = re.search(r'^--- ls after\n(.*?)\n', t, re.M)
    if ls_after:
        s += ' · ls after ' + ('없음' if 'No such file' in ls_after.group(1) else ls_after.group(1))
    lg = re.findall(r'refused: [^\n]*|command failed: [^\n]{0,70}', t.split('--- log')[-1])
    if lg:
        s += ' · log ' + ' ; '.join(sorted(set(x[:110] for x in lg)))
    s += ' · ' + re.findall(r'--- failed=\d+', t)[-1][4:]
    return s

notes = {
'T17': ('다름(의도)', 'k11 c11 4절 T17 행(F1, 76ca1d2): 새 기대 `* main active=c3 {c1:1,c3:98,c2:1}`, 파일 size [1,98,1] 과 tgt 가 같다. base 는 k10 기대(`{c1:1,c3:98.01,c2:0.99}`, 파일 size 0)와 같다.'),
'T94': ('다름(의도)', 'k11 c11 3절 F12 행 · 4절 T94 행(70b85fd, 준비 450d01d): tgt 는 refused 를 내고 프로젝트 파일이 생기지 않으며 다음 list 는 `{c1:50,c2:50}`. 4절 새 기대와 같다. base 는 k10 기대와 같다.'),
'T98': ('다름(의도)', '도달 방법: `reset F2; g split -h Foo; g list`(T94 와 같은 거부 분기를 split 으로 부름). base 는 checkOutcome 이 checkUnique 만 보므로 k10 기대의 세 이유(탭 이름 · 칸 id · mod 두 칸)에 도달하는 입력을 코드에서 찾지 못했다(new · rename 은 이름 먼저 검사, newCellId 는 모든 탭에서 안 쓴 id, split · place 는 unplace 먼저). tgt 는 checkTabs(70b85fd, F12)가 plugin 이름도 검사해 refused. c11 3절 F12 행은 place 의 경우만 적었고 split 은 같은 원인이다. 세 이유 문자열은 두 판 모두 도달하지 못했다.'),
'T56': ('다름', '재현: `reset F1; g resize 50; g layout tiled; g list; ls $(pdir $PROJ)`. 응답 세 줄은 두 판이 같다. base 는 프로젝트 파일(칸 c1 하나)을 쓰고 tgt 는 쓰지 않는다(ls after 없음, pl NOFILE). 원인으로 보이는 커밋 8e2c8c3(F17, actions.ts apply 가 탭 목록 JSON 이 같으면 isChanged false). c11 2절 F17 행에 결함 수정으로 적혀 있으나 3절 · 4절에는 없어 규칙대로 「다름」. k10 T56 기대(「프로젝트 파일이 쓰인다」)와 tgt 가 어긋난다. JSON 비교로 정해지는 결과라 흔들림이 아니다.'),
'T99': ('같음', '도달 방법: reset F2 뒤 `chmod 555 $H/.claude/pane-grid` 로 projects 디렉터리를 못 만들게 하고 `g split -h`, 뒤에 755 로 되돌리고 `g list`. 두 판 모두 stdout `pane-grid: pane-grid: the command failed; see the debug log`(머리말이 두 번), log `command failed: {"kind":"throw","message":"pane-grid: $.fs.write(…/layout.json) failed: EACCES"…}`. failed=1 은 이 의도한 실패 줄이다. c11 3절 F59 의 HOME 없는 경로(base 에서 같은 문장)는 쓰지 않았다.'),
'T97': ('실행하지 못함', '도달 입력을 찾지 못했다. base actions.ts:62-63 · tgt actions.ts:66-67 의 `if (!tab)` 는 탭 목록이 빈 배열일 때만 참인데, loadFile 은 파일이 없거나 무효면 defaultTabs()(탭 한 개)를 쓰고 파일의 탭 0개는 parse 가 거부하며 close 는 마지막 탭을 거부한다. 두 판 모두 같은 구조다.'),
'T55': ('같음', '두 판 모두 log `refused: plugin usage-gauge is placed in two cells`. 실행 전후 ls 같음. k10 기대와 같다.'),
'T26': ('같음', 'select 앞뒤 프로젝트 파일 내용이 같다(행 파일의 pl before 와 pl 을 diff 로 대조, base 기준. tgt 는 base 와 SAME).'),
'T15': ('같음', '두 판 모두 파일 `"zoomed": "c2"`. k10 기대와 같다.'),
'T34': ('같음', 'help 16줄. k10 기대와 같다.'),
'T36': ('같음', 'T34 와 같은 16줄(diff 로 확인). 실행 전후 ls 같음.'),
'T113': ('같음', 'k11 c11 4절 T113 행(바꾸지 않음)의 값과 두 판이 같다.'),
'T112': ('같음', 'k10 기대와 같다. 준비는 T4 뒤.'),
}
rows = []
md = ['| id | 시험 | 기준선 출력 | 대상 출력 | 판정 | 비고 |', '|---|---|---|---|---|---|']
cmp = open(f'{J}/compare.txt').read()
B = [f'T{i}' for i in range(36, 57)] + ['T95', 'T96']
for id in order:
    b = summ('base', id); t = summ('tgt', id)
    if id in notes:
        v, n = notes[id]
    else:
        st = re.search(rf'^{id} (\w+)', cmp, re.M).group(1)
        v = '같음' if st == 'SAME' else '다름'
        n = 'k10 기대와 같다.' if v == '같음' else ''
        if id in B:
            n = '실행 전후 ls 가 같다. ' + n
    ev = f'/Users/uhd/.claude/jobs/2d2d4469/tmp/out/AB/base/{id}.txt , /Users/uhd/.claude/jobs/2d2d4469/tmp/out/AB/tgt/{id}.txt' if b else '-(파일 없음)'
    rows.append(dict(id=id, title=titles[id], base=b or '실행하지 않음', tgt=t or '실행하지 않음', verdict=v, note=n, evidence=ev))
    md.append('| ' + ' | '.join(x.replace('|', '\\|') for x in [id, titles[id], b or '-', t or '-', v, n]) + ' |')
head = '# 묶음 AB: base(dd6cda9) 대 tgt(2d2d846) claude -p 대조\n\n대조: `zsh compare.zsh AB` 결과 same=58 diff=4 missing=0(T97 은 실행하지 못해 파일이 없다). 스크립트 `scripts/AB.zsh <TREE>`.\n\n'
open(f'{J}/rows.md', 'w').write(head + '\n'.join(md) + '\n')
json.dump(rows, open(f'{J}/rows.json', 'w'), ensure_ascii=False)
print(len(rows))
