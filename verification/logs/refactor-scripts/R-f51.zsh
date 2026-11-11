# R-f51.zsh <TREE> [log51]: F51 시나리오. 프로젝트 파일에 탭 main · t2(c2|c3, 활성 c2) 를 두고 SDK steps f51 을 보낸다.
#   두 번째 인자 log51 이면 그 트리의 사본($JOB/copy)에 activateCell 이 고른 탭 목록 log 를 넣어 그 사본으로 돌린다.
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
T2='[{"name":"main","root":{"kind":"cell","id":"c1"},"active":"c1"},{"name":"t2","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c2"},"size":50},{"node":{"kind":"cell","id":"c3"},"size":50}]},"active":"c2"}]'
PRE="python3 -I scripts/R-steps/projfile.py \$H \$PROJ '$T2'"
if [[ $2 == log51 ]]; then
  PRE="$PRE; python3 -I scripts/R-steps/patch.py \$REPO \$JOB/copy log51"
  export REPO_OVERRIDE=$J/run/R/copy
fi
PRE=$PRE zsh $J/scripts/R-run.zsh ${1:?TREE} f51 '{"version":1,"tabs":[{"name":"main","root":{"kind":"cell","id":"c1"},"active":"c1"}]}'
