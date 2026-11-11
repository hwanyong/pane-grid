# session.start 의 resolveProject 가 거부될 때(.git 파일을 읽지 못함). 지운 것: 시각 접두(grep -o)
GROUP=RV; TREE=$1; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
SM=$H/sm
setup $SM
print 'gitdir: /nonexistent' > $SM/.git; chmod 000 $SM/.git
reset "$F2"
up t $SM $REPO
echo "start log: $(grep -oE 'pane-grid: (start failed|project ).*' $LOG/t.log | cut -c1-90)"
echo "hook error lines: $(grep -c -E 'hook skipped' $LOG/t.log)"
say '/grid list'
cap | grep -E 'grid|main active|Unknown|failed' | sed 's/^ *//' | grep -v '^❯' | tail -4
say '/grid split -h'
cap | grep -E 'split c|failed|Unknown' | sed 's/^ *//' | tail -3
echo "command failed log: $(grep -oE 'pane-grid: command failed.*' $LOG/t.log | cut -c1-120)"
down
chmod 644 $SM/.git
T kill-server 2>/dev/null
