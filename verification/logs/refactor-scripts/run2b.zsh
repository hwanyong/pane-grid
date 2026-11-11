#!/bin/zsh -f
J=/Users/uhd/.claude/jobs/2d2d4469/tmp; cd $J
{ zsh scripts/X-cli.zsh tgt2 > out/X-cli-tgt2-run.txt 2>&1; zsh scripts/X-tty.zsh tgt2 > out/X-tty-tgt2-run.txt 2>&1; zsh scripts/X-static.zsh tgt2 > out/X-static-tgt2-run.txt 2>&1; } &
{ zsh scripts/C1.zsh tgt2 > out/C1-tgt2-run.txt 2>&1; zsh scripts/E.zsh tgt2 > out/E-tgt2-run.txt 2>&1; } &
zsh scripts/C2.zsh tgt2 > out/C2-tgt2-run.txt 2>&1 &
wait
print done-2b
