#!/bin/zsh -f
# 묶음 X(diff 검토가 「덮는 행이 없다」고 낸 변경) 중 tmux detached 대화형 세션이 필요한 시나리오.
# 사용: zsh X-tty.zsh <TREE> [행 id ...]   (TREE = base | tgt | broke 등)
# claude 는 한 번에 하나만 띄운다(행마다 down · kill-server 뒤 다음 행).
# 출력: $J/out/X/<TREE>/<id>.txt
# 정규화에서 지운 것:
#   - 화면은 grid pane(문자 index 95 부터, 그 앞 열이 `│` 인 줄)만 남긴다(gp). 왼쪽 대화 영역(로고 · 모델 · spinner · 토큰 수)은 버린다.
#     명령 응답은 `⎿  pane-grid:` 줄만 남긴다(resp).
#   - debug log 줄 머리의 시각, 프로젝트 hash(<hash>), job 이름(JOB), `{"kind":"throw",…}` 의 stack 은 160자에서 자른다.
#   - toast · action 줄은 그 순서대로 둔다(시각이 없다).
TREE=${1:?TREE}; shift
ONLY=( "$@" )
GROUP=X; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
want(){ [ ${#ONLY} -eq 0 ] && return 0; (( ${ONLY[(Ie)$1]} )) }
nh(){ sed -E 's/proj-[0-9a-f]{16}/proj-<hash>/g; s/2d2d4469/JOB/g' }
gp(){ cap | python3 -c 'import sys
ls=[l[95:].rstrip() if len(l)>95 and l[94]=="│" else "" for l in sys.stdin.read().split("\n")]
while ls and ls[-1]=="": ls.pop()
print("\n".join(ls))' }
resp(){ cap | grep -o 'pane-grid: .*' | grep -v '^pane-grid: split panes' | sed -E 's/ +$//; s/│.*$//; s/ +$//' }
tl(){ toasts | sed -E 's/^.*toast \(pane-grid\): //' }
nfail(){ print -r -- "failed hooks: $(grep -c -E 'hook skipped|start failed|(command|scroll|press|message|render) failed' $LOG/${S:-t}.log)" }
fin(){ down; T kill-server 2>/dev/null }
COLUMN3='{"version":1,"tabs":[{"name":"main","root":{"kind":"column","children":[{"node":{"kind":"cell","id":"c1"},"size":98},{"node":{"kind":"cell","id":"c2"},"size":1},{"node":{"kind":"cell","id":"c3"},"size":1}]},"active":"c1"}]}'
S=t

# X2: moveDivider 의 before + after < MIN_PART * 2. 위아래 [98,1,1] 의 마지막 분할선을 3행 위로 끈다
if want X2; then setup; reset "$COLUMN3"; up t $PROJ $REPO
  { print -- '--before'; gp
    set -- $(loc 'c1 -'); col=$(($1+5))
    row=$(cap | python3 -c 'import sys
c=int(sys.argv[1]); ls=sys.stdin.read().split("\n")
print(max(i+1 for i,l in enumerate(ls) if len(l)>94 and l[94]=="│" and l[c-1:c+4]=="─"*5))' $col)
    print "drag at col=$col row=$row by -3"
    drag $col $row 0 -3; say '/grid list'; resp; print -- '--after'; gp; nfail; } | nh > $OUT/X2.txt; fin
fi

# X4c: 다른 세션(여기서는 밖의 쓰기)이 프로젝트 파일을 바꾼 뒤 바뀌지 않는 동작(select-cell c1)
if want X4c; then setup; reset "$F2"; up t $PROJ $REPO
  P=$(pdir $PROJ); mkdir -p $P
  print -r -- '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2"},"size":50}]},"active":"c1"}]}' > $P/layout.json
  say '/grid select-cell c1'; { cap | grep -A1 -E 'pane-grid: (refused|active)' | cut -c1-94 | sed -E 's/^ *(⎿ *)?//; s/ +$//'; nfail; } | nh > $OUT/X4c.txt; fin
fi

# X7: offerChoice 가 `choices:<cell>[:active]` key 를 읽는 방식. 칸 id 가 `active` 인 비활성 칸. usage-gauge 사본에 그 트리의 member 사본을 넣는다
if want X7; then setup; rm -rf $JOB/ug; cp -R $UG $JOB/ug && cp $REPO/skills/add-pane-grid-cell/pane-grid.ts $JOB/ug/hooks/pane-grid.ts
  reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"active"},"size":50}]},"active":"c1"}]}'
  up t $PROJ $JOB/ug $REPO; sleep 2
  { print -- '--screen'; gp
    set -- $(loc 'q: list'); click 166 $2; key 1; sleep 1
    print -- '--toasts'; tl; print -- '--actions'; acts
    say '/grid list'; resp; nfail; } | nh > $OUT/X7.txt; fin
fi

# X13: session.start 에서 global 파일을 읽지 못함(chmod 000) 뒤 권한을 돌려준다. 시작 실패 log 와 회복
if want X13; then setup; reset "$F2"; chmod 000 $H/.claude/pane-grid/layout.json; up t $PROJ $REPO
  { print "start failed lines: $(grep -c 'pane-grid: start failed' $LOG/t.log)"
    print "hook skipped lines: $(grep -c 'hook skipped' $LOG/t.log)"
    grep -oE 'pane-grid: start failed: .{0,100}' $LOG/t.log | head -1
    grep -oE 'session.start hook skipped.{0,80}' $LOG/t.log | head -1
    chmod 644 $H/.claude/pane-grid/layout.json; sleep 4
    print "c1 title rows after chmod 644: $(cap | grep -c 'c1 -')"
    print "layout state is empty lines >0: $(( $(grep -c 'layout state is empty' $LOG/t.log) > 0 ))"
    print -- '--grid'; gp; } | nh > $OUT/X13.txt; chmod 644 $H/.claude/pane-grid/layout.json; fin
fi

# X14: session.start 의 resolveProject 가 거부(.git 파일을 읽지 못함)
if want X14; then SM=$H/sm; setup $SM; print 'gitdir: /nonexistent' > $SM/.git; chmod 000 $SM/.git; reset "$F2"; up t $SM $REPO
  { grep -oE 'pane-grid: start failed: .{0,120}' $LOG/t.log | head -1
    grep -oE 'session.start hook skipped.{0,120}' $LOG/t.log | head -1
    say '/grid list'; print -- '--after list'; cap | grep -oE 'pane-grid: .*|Unknown command: /grid' | sed -E 's/ +$//' | grep -v 'split panes'
    say '/grid split -h'; print -- '--after split'; cap | grep -oE 'pane-grid: .*|Unknown command: /grid' | sed -E 's/ +$//' | grep -v 'split panes'
    grep -oE 'pane-grid: command failed.{0,120}' $LOG/t.log | head -1; } | nh > $OUT/X14.txt
  chmod 644 $SM/.git; fin
fi

# X15: /cd 로 옮긴 디렉터리의 프로젝트를 정하지 못함(.git 읽기 거부) 뒤 권한을 돌려준다
if want X15; then SM=$H/sm; setup $SM; print 'gitdir: /nonexistent' > $SM/.git; chmod 000 $SM/.git; reset "$F2"; up t $PROJ $REPO
  say "/cd $SM"; sleep 4
  { print "project not resolved lines >0: $(( $(grep -c 'project not resolved' $LOG/t.log) > 0 ))"
    grep -oE 'pane-grid: project not resolved.{0,100}' $LOG/t.log | head -1
    print "not awaited lines: $(/usr/bin/grep -c 'not awaited' $LOG/t.log)"
    chmod 644 $SM/.git; sleep 4
    print -- '--toasts'; tl; print -- '--project lines'; /usr/bin/grep -o -E 'pane-grid: project [^ ]+' $LOG/t.log | sed -E "s|$H|~|"; nfail; } | nh > $OUT/X15.txt
  chmod 644 $SM/.git; fin
fi

# X16: 무효 파일을 읽은 뒤 유효한 파일을 다시 읽으면 무효 원문(invalidText)을 버리는가
if want X16; then setup; reset "$F2"; P=$(pdir $PROJ); mkdir -p $P; print 'not json' > $P/layout.json; up t $PROJ $REPO
  print -r -- "$F2" > $P/layout.json
  say '/grid reload'; say '/grid split -h'
  { resp; print -- '--ls'; ls $P; print -- '--invalid'; cat $P/layout.invalid.json 2>/dev/null || print NONE
    grep -oE 'pane-grid: kept the invalid.*' $LOG/t.log | sed -E 's/ at [^ ]+$//'; nfail; } | nh > $OUT/X16.txt; fin
fi

# X17: hotkey 누름의 동작이 실패(persist 의 쓰기가 EACCES)
if want X17; then setup; reset "$F2"; g split -h > /dev/null; up t $PROJ $REPO
  D=$(pdir $PROJ); chmod 444 $D/layout.json; chmod 555 $D
  set -- $(loc 'q: list'); click 166 $2; key v; sleep 1
  { print -- '--toasts'; tl; print "press failed lines: $(grep -c 'press failed' $LOG/t.log)"
    grep -oE 'pane-grid: press failed.{0,80}' $LOG/t.log | head -1; print -- '--grid'; gp; } | nh > $OUT/X17.txt
  chmod 755 $D; chmod 644 $D/layout.json; fin
fi

# X18: zoomed(c2) != active(c1) 인 탭에서 zoom 한 칸을 그리는 방식
if want X18; then setup
  reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2"},"size":50}]},"active":"c1","zoomed":"c2"}]}'
  up t $PROJ $REPO $UG; sleep 2
  { print -- '--title SGR'; cape | grep -o $'[^│]*c2 -' | head -1 | cat -v
    print -- '--grid'; gp
    set -- $(loc 'c2 -'); click $(($1+10)) $(($2+3)); print -- '--actions after click'; acts
    set -- $(loc 'q: list'); click 166 $2; key 1; sleep 1; print -- '--toasts after key 1'; tl; nfail; } | nh > $OUT/X18.txt; fin
fi

# X19: ui.scroll 이 처음에 publishPlacements 를 부른다. 크기를 바꾼 직후 filetree 칸에 휠
if want X19; then setup; reset "$F2"; up t $PROJ $REPO $FT; sleep 2
  say '/grid place filetree c2'; sleep 2
  set -- $(loc 'c2 filetree')
  T resize-window -t t -x 130 -y 45; wheel $(($1-40)) $(($2+3)); sleep 3
  { print "layout revision lines: $(grep -c 'layout revision' $LOG/t.log)"
    print "scroll failed lines: $(grep -c 'scroll failed' $LOG/t.log)"; nfail; } > $OUT/X19.txt; fin
fi

# X21: hotkey v 네 번을 한 번에 보낸다(dispatch 가 겹치게)
if want X21; then setup; reset "$F2"; up t $PROJ $REPO
  set -- $(loc 'q: list'); click 166 $2; T send-keys -t t -l vvvv; sleep 5
  { print -- '--actions'; acts; say '/grid list'; resp; nfail; } | nh > $OUT/X21.txt; fin
fi

# X27: 칸 최소 크기 미만으로 나누기(split -h 여덟 번)
if want X27; then setup; reset "$F1"
  { for i in 1 2 3 4 5 6 7 8; do g split -h; done; g list; } > $OUT/X27.txt
  up t $PROJ $REPO
  { print -- '--titles'; gp | grep -o -E 'c[0-9]+ -' | sort -u; print "title count: $(gp | grep -o -E 'c[0-9]+ -' | sort -u | wc -l | tr -d ' ')"; nfail; } >> $OUT/X27.txt; fin
fi

# X28: rename 이 옛 pane 을 닫고 새 id 로 연다
if want X28; then setup; reset "$F2"; up t $PROJ $REPO
  say '/grid rename work'; sleep 2
  { resp; print -- '--ui log'; /usr/bin/grep -o -E 'ui\.(open|close) pane-grid grid-(main|work) \([a-z]+' $LOG/t.log | uniq; nfail; } | nh > $OUT/X28.txt; fin
fi

# X29: 칸 내용보다 많이 휠을 내린 뒤 올린다(offset 상한 없음)
if want X29; then setup
  reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"column","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2"},"size":50}]},"active":"c2"}]}'
  up t $PROJ $REPO
  set -- $(loc 'c1 -'); col=$(($1+3)); row=$(($2+2))
  for i in {1..30}; do wheel $col $row; done; sleep 1
  { print -- '--after 30 down'; gp; for i in {1..30}; do wheel $col $row 64; done; sleep 1
    print -- '--after 30 up'; gp; nfail; } > $OUT/X29.txt; fin
fi

# X30: 실행 중 세션은 밖에서 고친 파일을 저절로 다시 읽지 않는다
if want X30; then setup; reset "$F2"; up t $PROJ $REPO
  say '/grid split -v'; print -r -- "$F1" > $(pdir $PROJ)/layout.json; sleep 4
  { say '/grid list'; print -- '--list 1'; resp | tail -1
    say '/grid reload'; print -- '--reload'; resp | tail -1
    say '/grid list'; print -- '--list 2'; resp | tail -1; nfail; } | nh > $OUT/X30.txt; fin
fi
T kill-server 2>/dev/null
exit 0
