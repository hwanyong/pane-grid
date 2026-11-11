#!/bin/zsh -f
# T114 차이의 원인 커밋을 좁히려고 k11 커밋 두 개(3ba5537 과 그 부모 10ad989)를 로컬 디스크에 풀어 둔다.
# 사용: zsh C1-bisect-archive.zsh <커밋> ...  → $J/c-<커밋>/ (TREE=c-<커밋> 으로 lib.zsh 가 쓴다)
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
W=/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid/.claude/worktrees/k12
for c in "$@"; do
  rm -rf $J/c-$c; mkdir -p $J/c-$c
  git -C $W archive $c | tar -x -C $J/c-$c
  print "$c: $(git -C $W log -1 --format='%h %s' $c)"
done
