# R-f47.zsh <TREE> [nodelay]: F47 시나리오. global layout.json 을 형식이 틀린 파일({"version":1,"tabs":[]})로 두고 SDK steps f47 을 보낸다.
#   기본은 그 트리의 사본($JOB/copy)에 loadFile 3초 지연(patch.py delay47)을 넣어 돌린다. nodelay 면 원래 트리로 돌린다.
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
if [[ $2 != nodelay ]]; then
  export PRE="python3 -I scripts/R-steps/patch.py \$REPO \$JOB/copy delay47"
  export REPO_OVERRIDE=$J/run/R/copy
fi
zsh $J/scripts/R-run.zsh ${1:?TREE} f47 '{"version":1,"tabs":[]}'
L=$J/run/R/logs/sdk.log
# /clear 뒤의 줄만 센다: 'layout state is empty' 가 처음 나온 줄부터.
N=$(grep -n 'layout state is empty' $L | head -1 | cut -d: -f1)
print -r -- '## counts after /clear'
if [[ -z $N ]]; then print -r -- 'no "layout state is empty" line'; else
  print -r -- "state-empty: $(tail -n +$N $L | grep -c 'layout state is empty')"
  print -r -- "refused file: $(tail -n +$N $L | grep -c 'pane-grid: layout file .* refused')"
  print -r -- "toast: $(tail -n +$N $L | grep -c '\$.ui.toast (pane-grid)')"
  print -r -- "publish: $(tail -n +$N $L | grep -c 'pane-grid: layout revision=')"
fi
