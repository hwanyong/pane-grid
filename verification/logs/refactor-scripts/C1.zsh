#!/bin/zsh -f
# 묶음 C1(대화형): T35, T100, T57a~T57k, T58, T114, T116.
# 사용: zsh C1.zsh <TREE>   (TREE = base | tgt | broke 등. lib.zsh 가 $J/$TREE 를 REPO 로 쓴다)
# tmux 서버는 이 스크립트가 끝날 때 함께 죽으므로 시나리오 전부를 한 번의 실행 안에서 돌린다.
# 정규화에서 지운 것:
#   - debug log 줄 머리의 시각(plog 와 같은 sed), 「in <수>ms」 「settled in <수>ms」 같은 소요 시간
#   - 화면은 grid pane(오른쪽, 문자 index 95 부터) 줄만 남긴다. 왼쪽 대화 영역(로고 · 모델 · 안내 · spinner · 토큰 수)은 버린다.
#     대화 영역에서는 `⎿  pane-grid:` 로 시작하는 명령 출력 줄만 남긴다.
#   - T35 는 prompt 줄부터 화면 끝까지를 남기되 모드 표시 줄(`⏵⏵`)과 빈 줄은 버린다. 자동 완성 목록은 prompt 위에 그려지므로
#     그중 `/grid` · `/pane-grid:` 로 시작하는 줄만 따로 남긴다(다른 명령 줄은 Claude Code 판 · 계정에 따라 바뀐다).
#   - T114 의 close 응답 끝 `; it is behind <탭>, click its tab to show it` 는 지운다. 같은 입력으로 base 13번 중
#     5번, tgt 9번 중 4번 붙지 않았다(out/C1r/*/T114.txt 와 이 스크립트의 두 회차). showTab 이 $.ui.open(focus) 바로 뒤에 읽는 $.ui.panes() 의 결과가
#     엔진 쪽 시점에 따라 갈린다. 원문은 같은 폴더의 T114.raw 에 남긴다(compare.zsh 는 *.txt 만 대조한다).
TREE=${1:?TREE}
GROUP=C1; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
S=t

# grid pane 영역의 줄(오른쪽). 끝의 빈 줄은 버린다.
gp(){ cap | python3 -c 'import sys
ls=[]
for l in sys.stdin.read().split("\n"):
    ls.append(l[95:].rstrip() if len(l)>95 and l[94]=="│" else "")
while ls and ls[-1]=="": ls.pop()
print("\n".join(ls))' }
# 대화 영역의 마지막 `⎿  pane-grid:` 출력 줄
lastout(){ cap | python3 -c 'import sys
r=[l[:94].strip() for l in sys.stdin.read().split("\n") if "⎿" in l[:94]]
print(r[-1] if r else "NO-OUTPUT")' }
# 표시: 지금까지의 toast · action 수
mark(){ MT=$(toasts | wc -l); MA=$(acts | wc -l); ML=$(wc -l < $LOG/t.log) }
newt(){ toasts | tail -n +$((MT+1)) }
newa(){ acts | tail -n +$((MA+1)) }
newlog(){ tail -n +$((ML+1)) $LOG/t.log | sed -E 's/^[0-9TZ:.-]+ //; s/ in [0-9.]+ms//g; s/settled [0-9.]+ms/settled/g' }
# hotkey 줄 오른쪽 끝을 눌러 grid pane 에 키보드를 준다(record.py:336-349 의 방법)
kb(){ local r=$(loc 'q: list' | cut -d' ' -f2); click 166 $r }
# 색: `c1 -` · `c2 -` 앞의 SGR
colors(){ cape | python3 -c 'import sys,re
for l in sys.stdin.read().split("\n"):
    for name in ("c1 -","c2 -","c3 -","c4 -"):
        for m in re.finditer(re.escape(name),l):
            pre=re.findall(r"\x1b\[[0-9;]*m",l[:m.start()])
            print(name, repr("".join(pre[-3:])))' }
row(){ print -r -- "== $1"; }

setup
reset $F2
up t $PROJ $REPO
sleep 2

# ---- T100: hotkey 두 줄
gp | sed -n 3,4p > $OUT/T100.txt

# ---- T35: prompt 에 /grid 만, 이어 '/grid ' (공백)
T send-keys -t t -l '/grid'; sleep 2.5
{ print -r -- '-- /grid (자동 완성 목록 중 pane-grid 의 줄, prompt 줄)'; cap | python3 -c 'import sys,re
ls=sys.stdin.read().split("\n")
for n,l in enumerate(ls):
    if re.match(r"^\s+(❯ )?/grid\b",l) or re.match(r"^\s+(❯ )?/pane-grid:",l): print(l.rstrip())
i=[n for n,l in enumerate(ls) if l.startswith("❯")]
for l in (ls[i[-1]:] if i else []):
    if l.strip() and "⏵⏵" not in l and not set(l.strip())<=set("─"): print(l.rstrip())'
  T send-keys -t t -l ' '; sleep 2
  print -r -- '-- /grid + space'; cap | python3 -c 'import sys
ls=sys.stdin.read().split("\n")
i=[n for n,l in enumerate(ls) if l.startswith("❯")]
for l in (ls[i[-1]:] if i else []):
    if l.strip() and "⏵⏵" not in l and not set(l.strip())<=set("─"): print(l.rstrip())'
  print -r -- '-- log'; grep -o '\$.command.register (pane-grid).*' $LOG/t.log | sort -u
} > $OUT/T35.txt
for k in 1 2 3 4 5 6 7 8; do T send-keys -t t BSpace; done; T send-keys -t t Escape; sleep 1

# ---- T57a: c2 안의 빈 행 누름
mark
set -- $(loc 'c2 -'); click $1 $(($2+3))
{ newa; print -r -- '-- colors'; colors; print -r -- '-- pane'; gp } > $OUT/T57a.txt
# ---- T57b: q
mark; key q; sleep 1
{ newt; newa } > $OUT/T57b.txt
# ---- T57c: o
mark; key o; sleep 1
{ newt; newa } > $OUT/T57c.txt
# ---- T57d: v
mark; key v; sleep 1
{ newt; newa; print -r -- '-- pane'; gp } > $OUT/T57d.txt
# ---- T57e: s
mark; key s; sleep 1
{ newt; newa; print -r -- '-- pane'; gp } > $OUT/T57e.txt
# ---- T57f: z, cap, z
mark; key z; sleep 1
{ newt; newa; print -r -- "ui.open lines: $(newlog | grep -c 'ui.open pane-grid grid-main')"; newlog | grep -o 'ui.open pane-grid grid-main.*'; print -r -- '-- pane (zoomed)'; gp
  mark; key z; sleep 1
  print -r -- '-- second z'; newt; newa; print -r -- '-- pane (unzoomed)'; gp } > $OUT/T57f.txt
# ---- T57g: w, 이어 /grid list
mark; key w; sleep 1
{ newt; newa; say '/grid list'; sleep 3; print -r -- '-- list'; lastout } > $OUT/T57g.txt
# ---- T57h: 키보드를 pane 에, x, 이어 /grid list
kb; mark; key x; sleep 1
{ newt; newa; say '/grid list'; sleep 3; print -r -- '-- list'; lastout } > $OUT/T57h.txt
# ---- T57i: 키보드를 pane 에, b
kb; mark; key b; sleep 2
{ newt; newa; print -r -- '-- tab row'; gp | sed -n 1p; print -r -- '-- pane'; gp } > $OUT/T57i.txt
# ---- T57j: 보이는 pane 이 main 이 아니면 main 탭을 누른다. 그 뒤 키보드를 pane 에, c
{ print -r -- "tab row before: $(gp | sed -n 1p)"
  if ! gp | sed -n 5,7p | grep -q 'c1 -'; then set -- $(loc ' main '); [ -n "$1" ] && click $(($1+1)) $2; sleep 2; print 'clicked main tab'; fi
  kb; mark; key c; sleep 2
  newt; newa; print -r -- '-- tab row'; gp | sed -n 1p } > $OUT/T57j.txt
# ---- T57k: 키를 누를 pane 의 탭을 적고 k
{ print -r -- "pane before: $(gp | sed -n 1p)"; print -r -- "first cell row: $(gp | sed -n 5p)"
  kb; mark; key k; sleep 2
  newt; newa; print -r -- '-- tab row'; gp | sed -n 1p
  print -r -- "press failed lines: $(grep -c 'press failed' $LOG/t.log)" } > $OUT/T57k.txt

# ---- T58: F1 로 되돌리고 k
reset $F1; say '/grid reload'; sleep 2
{ print -r -- "reload: $(lastout)"; kb; mark; key k; sleep 1; newt; newa } > $OUT/T58.txt
print -r -- "C1 session t failed hooks: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/t.log)" > $OUT/failed-t.txt
down; T kill-server 2>/dev/null; mv $LOG/t.log $LOG/t1.log

# ---- T114: F2, g new 두 번(main · w2 · w3), 대화형으로 select w2 · close · list
reset $F2
{ print -r -- "g new: $(g new </dev/null)"; print -r -- "g new: $(g new </dev/null)"; print -r -- '-- g list'; g list </dev/null
  up t $PROJ $REPO; sleep 2
  say '/grid select w2'; sleep 2; print -r -- "select: $(lastout)"
  say '/grid close'; sleep 2; print -r -- "close: $(lastout)"
  say '/grid list'; sleep 3
  print -r -- '-- list'; cap | python3 -c 'import sys
ls=sys.stdin.read().split("\n")
idx=[n for n,l in enumerate(ls) if "⎿" in l[:94]]
if idx:
    n=idx[-1]; print(ls[n][:94].rstrip())
    for l in ls[n+1:n+4]:
        s=l[:94].rstrip()
        if s.strip() and not s.strip().startswith(("❯","─")): print(s)'
  print -r -- "failed: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/t.log)" } > $OUT/T114.raw
sed -E "s/; it is behind [a-z0-9_-]+, click its tab to show it\$//" $OUT/T114.raw > $OUT/T114.txt
down; T kill-server 2>/dev/null; mv $LOG/t.log $LOG/t2.log

# ---- T116: c2 에 pending-questions 를 둔 F2, pane-grid · pending-questions 순서로 load
#   ① pending-questions 가 grid 칸 안에 그린 Button(key mode, 「Switch to …」)을 누른다: element 가 place:/hotkey: 가 아니다.
#      pane-grid 의 ui.press hook 이 불리면 `hooks module pane-grid@inline ui.press` 줄이 남는다.
#   ② 대조군: hotkey q(element hotkey:q). 그 줄이 남아야 한다.
reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2","plugin":"pending-questions"},"size":50}]},"active":"c2"}]}'
up t $PROJ $REPO $PQ; sleep 2
say '/grid select main'; sleep 3
{ print -r -- '-- pane'; gp
  print -r -- "load order: $(grep -o 'built for [a-z,-]*' $LOG/t.log | head -1)"
  set -- $(cap | python3 -c 'import sys
for n,l in enumerate(sys.stdin.read().split("\n")):
    i=l.find("Switch to",95)
    if i>=0: print(i+2,n+1); break')
  print -r -- "Switch button at: $*"
  mark; [ -n "$1" ] && click $1 $2; sleep 2
  print -r -- '-- (1) press Switch to: ui.press lines'; newlog | grep -E 'ui\.press' | grep -v 'more times in the last'
  print -r -- '-- (1) toasts/acts'; newt; newa
  print -r -- "-- (1) mode line: $(gp | grep -o 'Mode: [a-z]*' | head -1)"
  kb; mark; key q; sleep 1
  print -r -- '-- (2) hotkey q: ui.press lines'; newlog | grep -E 'ui\.press' | grep -v 'more times in the last'
  print -r -- '-- (2) toasts'; newt
  print -r -- "failed: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/t.log)" } > $OUT/T116.txt
down; T kill-server 2>/dev/null; mv $LOG/t.log $LOG/t3.log
print "done $TREE"
