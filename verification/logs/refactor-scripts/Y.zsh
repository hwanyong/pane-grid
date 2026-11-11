#!/bin/zsh -f
# Y.zsh <TREE> [T93|T128 ...]: 묶음 Y. claude 는 한 번에 하나.
#   T93: Client 가 없는 surface(mobile)에서 grid-main render. headless SDK(scripts/R-sdk.py, steps scripts/Y-steps/t93.json).
#        layout: row[c1 usage-gauge | column[c2 filetree / c3]], 활성 c1. member-probe(그 트리의 pane-grid.ts 사본)로 placement 를 읽는다.
#        끝에 desktop render 를 대조군으로 둔다(Client 를 잡는 정규화인지 확인하는 자리).
#   T128: 칸 id `active` 가 활성 칸. usage-gauge 사본 + 그 트리의 member 사본, tmux detached(X7 과 같은 방법).
# 출력: $J/out/Y/<TREE>/T93.txt · T128.txt
# 정규화에서 지운 것: log 줄 앞 ISO 시각, $J/run/Y 머리말(<JOB>), request_id, initialize 응답 본문, ui_render tree 중
#   칸 상자 너비 · Client · divider Box 글자 · choices key 밖의 것(scripts/Y-norm.py), 프로젝트 hash(proj-<hash>).
#   T128 화면은 grid pane(문자 index 95 부터)만 남긴다.
TREE=${1:?TREE}; shift
ONLY=( "$@" )
GROUP=Y; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
S=t
want(){ [ ${#ONLY} -eq 0 ] && return 0; (( ${ONLY[(Ie)$1]} )) }
nh(){ sed -E 's/proj-[0-9a-f]{16}/proj-<hash>/g; s/2d2d4469/JOB/g' }
gp(){ cap | python3 -c 'import sys
ls=[l[95:].rstrip() if len(l)>95 and l[94]=="│" else "" for l in sys.stdin.read().split("\n")]
while ls and ls[-1]=="": ls.pop()
print("\n".join(ls))' }
tl(){ toasts | sed -E 's/^.*toast \(pane-grid\): //' }
nfail(){ print -r -- "failed hooks: $(grep -c -E 'hook skipped|start failed|(command|scroll|press|message|render) failed' $LOG/${S:-t}.log)" }
fin(){ down; T kill-server 2>/dev/null }
resp(){ cap | grep -o 'pane-grid: .*' | grep -v '^pane-grid: split panes' | sed -E 's/ +$//; s/│.*$//; s/ +$//' }

if want T93; then
  setup
  reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1","plugin":"usage-gauge"},"size":50},{"node":{"kind":"column","children":[{"node":{"kind":"cell","id":"c2","plugin":"filetree"},"size":50},{"node":{"kind":"cell","id":"c3"},"size":50}]},"size":50}]},"active":"c1"}]}'
  mkdir -p $JOB/probe; cp -R $REPO/verification/member-probe/. $JOB/probe/; cp $REPO/skills/add-pane-grid-cell/pane-grid.ts $JOB/probe/hooks/pane-grid.ts
  rm -f $LOG/sdk.log
  python3 -I $J/scripts/Y-steps/gen.py
  python3 -I $J/scripts/R-sdk.py "$REPO,$JOB/probe" $H $PROJ $LOG/sdk.log $J/scripts/Y-steps/t93.json > $LOG/sdk.out
  { print -r -- '# T93: mobile surface 의 grid-main render(Client 유무 · 분할선 글자 · placement 게시)'
    python3 -I $J/scripts/Y-norm.py < $LOG/sdk.out
    print -r -- '## log (Ymark 는 단계 경계)'
    grep -o -E '(Ymark: .*|pane-grid: (layout revision|action|layout state|message|render|press|command)[^"]*|k8member: readPlacement .*|ui\.(open|close) pane-grid [^"]{0,60})' $LOG/sdk.log \
      | sed "s#$JOB#<JOB>#g" | sed -E 's/"tab":"main","requestId":"grid-main",//g; s/"(column|row|columns|rows)"://g' | cut -c1-260
    print -r -- "failed hooks: $(grep -c -E 'hook skipped|start failed|(command|scroll|press|message|render) failed' $LOG/sdk.log)"
  } | nh > $OUT/T93.txt
fi

if want T128; then
  setup; rm -rf $JOB/ug; cp -R $UG $JOB/ug && cp $REPO/skills/add-pane-grid-cell/pane-grid.ts $JOB/ug/hooks/pane-grid.ts
  reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"active"},"size":50}]},"active":"active"}]}'
  up t $PROJ $JOB/ug $REPO; sleep 2
  { print -- '--screen'; gp
    print -- '--choice rows of cell active (right half)'; gp | python3 -c 'import sys
for l in sys.stdin.read().split("\n"):
    if "│" in l:
        r=l.split("│",1)[1].rstrip()
        if r: print(r)'
    set -- $(loc 'q: list'); click 166 $2; key 1; sleep 1
    print -- '--toasts'; tl; print -- '--actions'; acts
    print -- '--screen after 1'; gp
    say '/grid list'; resp; nfail; } | nh > $OUT/T128.txt
  fin
fi
T kill-server 2>/dev/null
print -r -- "Y $TREE done: $(ls $OUT | tr '\n' ' ')"
