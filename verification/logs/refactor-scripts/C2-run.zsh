#!/bin/zsh -f
# C2-run.zsh <TREE> [ids...]: C2.zsh 를 돌리고 행 파일을 보여 준다.
TREE=$1; shift
tmux -L pgt-C2 kill-server 2>/dev/null
zsh /Users/uhd/.claude/jobs/2d2d4469/tmp/scripts/C2.zsh $TREE > /Users/uhd/.claude/jobs/2d2d4469/tmp/out/C2-$TREE-run.txt 2>&1
tail -5 /Users/uhd/.claude/jobs/2d2d4469/tmp/out/C2-$TREE-run.txt
for f in "$@"; do print "##### $f"; cat /Users/uhd/.claude/jobs/2d2d4469/tmp/out/C2/$TREE/$f.txt; done
