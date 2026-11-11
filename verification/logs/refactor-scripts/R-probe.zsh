# R-probe.zsh <TREE> <steps 이름>: R 묶음 탐색용. SDK driver 로 scripts/R-steps/<이름>.json 을 보내고 pane-grid log 줄을 낸다.
cd /Users/uhd/.claude/jobs/2d2d4469/tmp
GROUP=R TREE=${1:-base} source lib.zsh
setup; reset "$F2"
python3 -I scripts/R-sdk.py $REPO $H $PROJ $LOG/sdk.log scripts/R-steps/${2:-s1}.json | cut -c1-1200
grep -o 'pane-grid: [^"]*' $LOG/sdk.log | cut -c1-200 | head -30
