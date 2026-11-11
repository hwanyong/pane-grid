#!/bin/zsh -f
# 탐색용: 휠 위(SGR 64)가 엔진에 by -1 로 가는 방법을 찾는다.
GROUP=C2 TREE=${1:-base} source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
S=t
FC='{"version":1,"tabs":[{"name":"main","root":{"kind":"column","children":[{"node":{"kind":"cell","id":"c1"},"size":5},{"node":{"kind":"cell","id":"c2"},"size":95}]},"active":"c2"}]}'
setup; reset $FC; up t $PROJ $REPO $UG $PQ
say "/grid select main"; sleep 1; set -- $(loc "c1 -"); c=$(($1+2)); r=$(($2+1))
wheel $c $r 65; wheel $c $r 65; sleep 1
print "A 64 via -l"; wheel $c $r 64; sleep 1
print "B 64 via -H"; T send-keys -t t -H 1b 5b 3c 36 34 3b $(printf '%s' "$c;$r" | xxd -p | sed 's/../& /g') 4d; sleep 1
print "C 64 with release"; T send-keys -t t -l $'\e[<64;'"$c;$r"'M'$'\e[<64;'"$c;$r"'m'; sleep 1
grep -o 'ui.scroll Pane grid-main.*' $LOG/t.log
T kill-server
