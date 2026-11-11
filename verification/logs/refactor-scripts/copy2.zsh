#!/bin/zsh -f
# c6 다시 대조(tgt2 = 4934a60)의 증거를 worktree 의 verification/logs/refactor2-* 와 refactor-out 으로 복사한다.
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
W=/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid/.claude/worktrees/k12/verification/logs
set -e
cp $J/final/refactor2-result.md $W/refactor2-result.md
rsync -a $J/out/ $W/refactor-out/
rsync -a $J/scripts/ $W/refactor-scripts/
rsync -a $J/scratch/ $W/refactor-scripts/scratch/
cp $J/norm-bar.zsh $J/run2a.zsh $J/run2b.zsh $J/copy2.zsh $W/refactor-scripts/
cp $J/diff2.patch $W/refactor2-diff-2d2d846-4934a60.patch
{ print '# 시작'; cat $J/sha-before2.txt; print; print '# 끝'; cat $J/sha-after2.txt; print; print '# SHA-256 줄 대조: diff 출력 없음(같음)'; } > $W/refactor-sha2.txt
cp $J/k11-c14.md $W/refactor2-k11-c14.md
print copied
