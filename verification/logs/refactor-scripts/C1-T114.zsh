#!/bin/zsh -f
# T114 흔들림 확인: C1.zsh 의 T114 절차만 같은 입력으로 다시 돌린다. 사용: zsh C1-T114.zsh <TREE> <회차>
# 정규화는 C1.zsh 와 같다. 결과는 $J/out/C1r/<TREE>-<회차>/T114.txt, 그 회차의 debug log 는 같은 폴더의 t.log
TREE=${1:?TREE}; N=${2:?N}
GROUP=C1r; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
OUT=$J/out/C1r/$TREE-$N; S=t
lastout(){ cap | python3 -c 'import sys
r=[l[:94].strip() for l in sys.stdin.read().split("\n") if "⎿" in l[:94]]
print(r[-1] if r else "NO-OUTPUT")' }
setup; mkdir -p $OUT
reset $F2
{ print -r -- "g new: $(g new </dev/null)"; print -r -- "g new: $(g new </dev/null)"; print -r -- '-- g list'; g list </dev/null
  up t $PROJ $REPO; sleep 2
  say '/grid select w2'; sleep 2; print -r -- "select: $(lastout)"
  print -r -- "tab row before close: $(cap | sed -n 1p | cut -c96-)"
  say '/grid close'; sleep 2; print -r -- "close: $(lastout)"
  # 보이는 grid 탭: 칸 제목 줄(화면 6행의 오른쪽). main 이면 `c1 - … c2 -`, w3 이면 `c4 -`
  print -r -- "visible cells after close: $(cap | sed -n 6p | cut -c96- | tr -s ' ')"
  say '/grid list'; sleep 3
  print -r -- '-- list'; cap | python3 -c 'import sys
ls=sys.stdin.read().split("\n")
idx=[n for n,l in enumerate(ls) if "⎿" in l[:94]]
if idx:
    n=idx[-1]; print(ls[n][:94].rstrip())
    for l in ls[n+1:n+4]:
        s=l[:94].rstrip()
        if s.strip() and not s.strip().startswith(("❯","─")): print(s)'
  print -r -- "tab row after: $(cap | sed -n 1p | cut -c96-)"
  print -r -- "failed: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/t.log)" } > $OUT/T114.txt
cp $LOG/t.log $OUT/t.log
down; T kill-server 2>/dev/null
