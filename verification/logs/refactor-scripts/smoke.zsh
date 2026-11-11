#!/bin/zsh -f
for TREE in base tgt; do
  GROUP=smoke; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
  setup
  reset $F2
  print "== $TREE"; g split -h; g list; pl; print "failed=$(failed)"; plog 'project ' | head -2
done
