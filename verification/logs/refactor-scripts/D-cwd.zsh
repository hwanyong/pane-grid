#!/bin/zsh -f
# T117c: tgt 에 새로 생긴 $.session.cwd 호출이 어느 커밋의 것인지
W=/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid/.claude/worktrees/k12
print -- "-- git log -S'session.cwd' main..k11-refactor -- hooks/register.tsx"
git -C $W log --format='%h %s' -S'session.cwd' main..k11-refactor -- hooks/register.tsx
print -- "-- diff.patch lines"
grep -n 'session.cwd' /Users/uhd/.claude/jobs/2d2d4469/tmp/diff.patch
print -- "-- base · tgt 의 호출 수"
print "base $(grep -c 'session.cwd' /Users/uhd/.claude/jobs/2d2d4469/tmp/base/hooks/register.tsx) tgt $(grep -c 'session.cwd' /Users/uhd/.claude/jobs/2d2d4469/tmp/tgt/hooks/register.tsx)"
print -- "-- F49 · F50 커밋의 run.root · serial 관련"
git -C $W show --format='%h %s' --stat 10ad989 3ba5537 | head -20
