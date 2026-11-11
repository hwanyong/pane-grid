#!/bin/zsh -f
# X14m: 시작 때 프로젝트를 정하지 못한 세션(.git 을 읽을 수 없음)이 나중에 권한을 돌려받아 프로젝트를 정할 때 내는 toast 와, 그 뒤의 저장 자리.
# k11 c14 5절 「나중에 정해지면 the session moved to ... toast 가 난다」를 실행으로 적고, 세션이 실제로 옮겼는지(시작 디렉터리 · root) 대조한다.
# 사용: zsh X14m.zsh <TREE>. 출력: $J/out/X/<TREE>/X14m.txt
TREE=${1:?TREE}
GROUP=X; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
S=t
nh(){ sed -E "s/proj-[0-9a-f]{16}/proj-<hash>/g; s/sm-[0-9a-f]{16}/sm-<hash>/g; s|$H|\$H|g" }
SM=$H/sm; setup $SM; print 'gitdir: /nonexistent' > $SM/.git; chmod 000 $SM/.git; reset "$F2"; up t $SM $REPO
{ print -- '--start lines'; grep -oE 'pane-grid: (start failed|project not resolved|project ).{0,110}' $LOG/t.log | head -2
  say '/grid split -h'; print -- '--split before'; cap | grep -oE 'pane-grid: .*|Unknown command: /grid' | sed -E 's/ +$//; s/│.*$//; s/ +$//' | grep -v 'split panes'
  print -- '--projects dir before'; ls $H/.claude/pane-grid/projects 2>&1 | sed -E 's/-[0-9a-f]{16}$/-<hash>/'
  chmod 644 $SM/.git; sleep 4
  print -- '--toasts after chmod 644'; toasts | sed -E 's/^.*toast \(pane-grid\): //'
  print -- '--project lines'; grep -oE 'pane-grid: project [^ ]+ \(root [^)]+\) -> .*' $LOG/t.log
  say '/grid split -h'; print -- '--split after'; cap | grep -oE 'pane-grid: .*' | sed -E 's/ +$//; s/│.*$//; s/ +$//' | grep -v 'split panes' | tail -2
  print -- '--projects dir after'; ls $H/.claude/pane-grid/projects 2>&1 | sed -E 's/-[0-9a-f]{16}$/-<hash>/'
  print -- '--saved file'; pl $SM
  say '!pwd'; print -- '--pwd'; cap | grep -oE "${H}[^ ]*" | sort -u
  print "failed hooks: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/t.log)"; } | nh > $OUT/X14m.txt
chmod 644 $SM/.git; down; T kill-server 2>/dev/null
print "done $TREE"
