#!/bin/zsh -f
# 묶음 D 준비 확인: $H 의 조상 디렉터리에 .git 이 있는지(T68 의 「위로 .git 이 없는 자리」 전제)
for d in /Users/uhd/.claude/jobs/2d2d4469/tmp/run /Users/uhd/.claude/jobs/2d2d4469/tmp /Users/uhd/.claude/jobs/2d2d4469 /Users/uhd/.claude/jobs /Users/uhd/.claude /Users/uhd /Users; do
  [ -e $d/.git ] && print "has .git: $d"
done
print checked
ls /Users/uhd/.claude/jobs/2d2d4469/tmp/run
grep -n 'drag' /Users/uhd/.claude/jobs/2d2d4469/tmp/scripts/C2.zsh | head -5
