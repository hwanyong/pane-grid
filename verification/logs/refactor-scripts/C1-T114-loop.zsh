#!/bin/zsh -f
# C1-T114.zsh 를 <TREE 목록> 차례로 <회차> 범위만큼 돌리고 close 줄을 모은다.
# 사용: zsh C1-T114-loop.zsh <시작 회차> <끝 회차> [TREE ...]   (TREE 를 주지 않으면 base tgt)
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
a=$1; b=$2; shift 2; if (( $# )); then trees=($@); else trees=(base tgt); fi
for n in {$a..$b}; do for tr in $trees; do
  zsh $J/scripts/C1-T114.zsh $tr $n
  grep -E '^close|visible' $J/out/C1r/$tr-$n/T114.txt | sed "s/^/$tr-$n /"
done; done
