# F40(invalidText) · F58(누름 실패 toast) 대화형 시나리오. 지운 것: 출력에서 시각 접두(plog 의 sed)
GROUP=RV; TREE=$1; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
setup
P=$(pdir $PROJ)
# --- F40
reset "$F2"; mkdir -p $P; print 'not json' > $P/layout.json
up t $PROJ $REPO
print -r -- "$F2" > $P/layout.json
say '/grid reload'; say '/grid split -h'; cap | grep -E 'loaded|split c|refused' | sed 's/^ *//'; grep -oE 'pane-grid: (kept|layout file|action|loaded).*' $LOG/t.log
echo "F40 ls: $(ls $P | tr '\n' ' ')"
echo "F40 invalid: $(cat $P/layout.invalid.json 2>&1)"
down
# --- F58
reset "$F2"; mkdir -p $P; chmod 555 $P
up t $PROJ $REPO
set -- $(loc 'q: list'); echo "hotkey row at $*"
click 168 $2; key v; sleep 1
echo "F58 toasts:"; toasts | sed -E 's/^.*toast \(pane-grid\): //'
echo "F58 press failed lines: $(grep -c 'press failed' $LOG/t.log)"
down; chmod 755 $P
T kill-server 2>/dev/null
