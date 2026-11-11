#!/bin/zsh -f
# T35 화면 모양 확인용(증거 아님): prompt 에 /grid 를 넣은 뒤 화면 아래 14줄 전체를 낸다.
GROUP=C1x; TREE=${1:-base}; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
setup; reset $F2; up t $PROJ $REPO; sleep 2
T send-keys -t t -l '/gri'; sleep 2.5; cap | tail -16 | cut -c1-170
print '======'
T send-keys -t t -l 'd'; sleep 2.5; cap | tail -16 | cut -c1-170
down; T kill-server 2>/dev/null
