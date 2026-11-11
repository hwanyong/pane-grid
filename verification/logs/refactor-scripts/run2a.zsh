#!/bin/zsh -f
J=/Users/uhd/.claude/jobs/2d2d4469/tmp; cd $J
zsh scripts/AB.zsh tgt2 > out/AB-tgt2-run.txt 2>&1 &
zsh scripts/D.zsh tgt2 > out/D-tgt2-run.txt 2>&1 &
zsh scripts/F.zsh tgt2 > out/F-tgt2-run.txt 2>&1 &
wait
print done-2a
