#!/bin/zsh -f
# T116 보강: ui.press hook 첫 줄에 log 한 줄(`T116 press hook called: <element>`)을 더한 사본으로 hook 이 불렸는지 직접 본다.
# 사본: $J/inst/C1-base · $J/inst/C1-tgt (base · tgt 를 cp -R 한 뒤 register.tsx 의 ui.press hook 에 한 줄만 더했다. diff -r 로 그 한 줄뿐인 것을 확인했다)
# 사용: zsh C1-T116i.zsh <base|tgt>. 결과는 $J/out/C1/<TREE>/T116i.txt (compare.zsh C1 이 함께 대조한다)
# 정규화: debug log 줄 머리의 시각과 「in <수>ms」를 지운다. grid pane 줄은 오른쪽(문자 index 95 부터)만.
T0=${1:?TREE}
GROUP=C1i; TREE=inst/C1-$T0; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
OUT=$J/out/C1/$T0; mkdir -p $OUT; S=t
gp(){ cap | python3 -c 'import sys
ls=[]
for l in sys.stdin.read().split("\n"):
    ls.append(l[95:].rstrip() if len(l)>95 and l[94]=="│" else "")
while ls and ls[-1]=="": ls.pop()
print("\n".join(ls))' }
mark(){ ML=$(wc -l < $LOG/t.log) }
newlog(){ tail -n +$((ML+1)) $LOG/t.log | sed -E 's/^[0-9TZ:.-]+ //; s/ in [0-9.]+ms//g' }
kb(){ local r=$(loc 'q: list' | cut -d' ' -f2); click 166 $r }
setup
reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2","plugin":"pending-questions"},"size":50}]},"active":"c2"}]}'
up t $PROJ $REPO $PQ; sleep 2
say '/grid select main'; sleep 3
{ print -r -- "c2 rows: $(gp | sed -n 6,8p | cut -c39- | tr '\n' '|')"
  set -- $(cap | python3 -c 'import sys
for n,l in enumerate(sys.stdin.read().split("\n")):
    i=l.find("Switch to",95)
    if i>=0: print(i+2,n+1); break')
  mark; [ -n "$1" ] && click $1 $2; sleep 2
  print -r -- '-- (1) Button "Switch to" in grid cell c2 (element mode)'
  newlog | grep -E 'T116 press hook called|ui\.press pending-questions|ui\.press pane-grid'
  print -r -- "hook-called lines: $(newlog | grep -c 'T116 press hook called')"
  # 대조군: element 가 hotkey: 로 시작하는 누름. hook 이 불려야 한다.
  kb; mark; T send-keys -t t -l q; sleep 2
  print -r -- '-- (2) hotkey q (element hotkey:q)'
  newlog | grep -E 'T116 press hook called|ui\.press pending-questions|ui\.press pane-grid'
  print -r -- "hook-called lines: $(newlog | grep -c 'T116 press hook called')"
  print -r -- "failed: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/t.log)" } > $OUT/T116i.txt
down; T kill-server 2>/dev/null
