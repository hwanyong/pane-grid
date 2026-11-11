# 상대 CLAUDE_CONFIG_DIR(rel) 시나리오. 지운 것: 없음(출력은 hash 만 있고 시각이 없다)
GROUP=RV; TREE=$1; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
setup
reset "$F2"
DIR=$PROJ gc rel reload
DIR=$PROJ gc rel split -h
DIR=$PROJ gc rel reload
plog 'project ' $LOG/p-2.log | sed -E 's/^.*pane-grid: //'
ls $PROJ/rel/pane-grid/projects 2>&1
