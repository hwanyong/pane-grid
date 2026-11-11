# F48: session.start 의 reload 가 거부된 뒤의 회복. 지운 것: 시각 접두(grep -o 로 줄 앞을 버린다)
GROUP=RV; TREE=$1; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
setup
reset "$F2"; chmod 000 $H/.claude/pane-grid/layout.json
up t $PROJ $REPO
echo "start log: $(grep -oE 'pane-grid: start failed.*' $LOG/t.log | cut -c1-80)"
echo "hook error lines: $(grep -c -E 'session.start.*(fail|error|threw)|hook skipped' $LOG/t.log)"
chmod 644 $H/.claude/pane-grid/layout.json
sleep 4
echo "grid pane after chmod 644: $(cap | grep -c 'c1 -')"
echo "restore log: $(grep -c 'layout state is empty' $LOG/t.log)"
down
T kill-server 2>/dev/null
