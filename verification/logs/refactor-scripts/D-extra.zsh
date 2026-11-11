#!/bin/zsh -f
# 묶음 D 의 표 밖 행 두 개. git diff main..k11-refactor 검토에서 저장 쪽 동작 변경인데 표에 행이 없던 것.
#   T117d: F40(1ca03e9). 무효 프로젝트 파일로 시작한 세션이, 다른 곳에서 유효 파일로 바뀐 것을 다시 읽은 뒤 저장할 때
#          layout.invalid.json 을 쓰는가. (대화형 한 개)
#   T117e: F48(c16cdd4) · F49(10ad989). `.git` 이 읽을 수 없는 파일(chmod 000)인 디렉터리에서 시작하면 projectOf 가 거부된다.
#          그때 /grid 가 등록되는가와 응답. (claude -p)
# 사용: zsh D-extra.zsh <TREE> [행 id ...]. 정규화는 D.zsh 와 같다($H · $J · JOB · mtimeMs 수).
TREE=${1:?TREE}; shift
ONLY=( "$@" )
GROUP=D; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
want(){ [ ${#ONLY} -eq 0 ] && return 0; local x; for x in "$@"; do (( ${ONLY[(Ie)$x]} )) && return 0; done; return 1 }
nz(){ sed -E -e "s#$H#\$H#g" -e "s#$J#\$J#g" -e 's/2d2d4469/JOB/g' -e "s#/Users/uhd#\$REALHOME#g" \
  -e 's/(mtimeMs )[0-9.]+/\1N/g' -e 's/ -> [0-9]+(\.[0-9]+)?\)/ -> N)/g' -e 's/ in [0-9.]+ms//g' }
pg(){ plog "pane-grid: ($1)" ${2:-$LOG/p.log} | sed -E 's/.*\$\.ui\.log \(to debug\): //' }
functions[g0]=$functions[g]; g(){ rm -f $LOG/p.log; g0 "$@" }
lastout(){ cap | python3 -c 'import sys
L=[l[:94].rstrip() for l in sys.stdin.read().split("\n")]
idx=[i for i,l in enumerate(L) if "⎿" in l]
if not idx: print("NO-OUTPUT"); sys.exit()
i=idx[-1]; out=[L[i].split("⎿",1)[1].strip()]
for l in L[i+1:]:
    s=l.strip()
    if not s or s.startswith(("❯","─","⏺","✻","⎿")): break
    out.append(s)
print(" ".join(out))' }
nfail(){ print -r -- "failed hooks: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/$S.log)" }

setup
P=$(pdir $PROJ)
if want T117d; then
  reset $F2; g split -h >/dev/null; print 'not json' > $P/layout.json
  S=t117d; up $S $PROJ $REPO; sleep 3
  { print -r -- "-- toasts at start"; toasts
    print -r -- "$F2" > $P/layout.json
    say '/grid split -h'; print -r -- "-- split -h #1: $(lastout)"
    say '/grid split -h'; print -r -- "-- split -h #2: $(lastout)"
    print -r -- "-- invalid file: $(cat $P/layout.invalid.json 2>/dev/null || print NOFILE)"
    print -r -- "-- log"; grep -o 'pane-grid: \(kept .*\|layout file .*\|.*changed by.*\)' $LOG/$S.log
    nfail } 2>&1 | nz > $OUT/T117d.txt
  T send-keys -t $S -l '/exit'; sleep 0.5; T send-keys -t $S Enter; sleep 2; T kill-server 2>/dev/null
fi
if want T117e; then
  mkdir -p $H/locked; print 'gitdir: /nonexistent' > $H/locked/.git; chmod 000 $H/locked/.git
  { print -r -- "-- DIR=locked g list"; o=$(DIR=$H/locked g list); print -r -- "$o" | grep "^pane-grid: "; print -r -- "other stdout lines (model text): $( [ $(print -r -- "$o" | grep -v "^pane-grid: " | grep -c .) -gt 0 ] && print some || print none)"
    print -r -- "-- log"; pg 'project|not resolved|start failed|command failed'
    print -r -- "-- DIR=locked g split -h"; o=$(DIR=$H/locked g split -h); print -r -- "$o" | grep "^pane-grid: "; print -r -- "other stdout lines (model text): $( [ $(print -r -- "$o" | grep -v "^pane-grid: " | grep -c .) -gt 0 ] && print some || print none)"
    print -r -- "-- log"; pg 'project|not resolved|start failed|command failed'
  } 2>&1 | nz > $OUT/T117e.txt
  chmod 644 $H/locked/.git
fi
T kill-server 2>/dev/null
print done $TREE
