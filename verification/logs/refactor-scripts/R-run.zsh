# R-run.zsh <TREE> <steps 이름> <layout JSON> [scroller]: R 묶음 공용 실행. setup 뒤 global layout.json 을 쓰고 SDK steps 를 보낸다.
#   scroller 가 있으면 scripts/R-scroller 를 $JOB/scroller 로 복사하고 그 트리의 pane-grid.ts 를 넣어 두 번째 --plugin-dir 로 붙인다.
#   REPO_OVERRIDE 가 있으면 --plugin-dir 첫 폴더를 그것으로 바꾼다(지연을 넣은 사본. setup 이 $JOB 을 지우므로 사본은 PRE 에서 만든다).
#   stdout: 정규화한 응답(R-norm.py) 뒤 '## log' 와 pane-grid · rscroller · k8member log 줄(시각 머리말 제거),
#   '## project file' 과 프로젝트 layout 파일 JSON(project 필드의 절대 경로는 <JOB> 로).
#   PRE 가 있으면 SDK 실행 앞에 eval 한다(프로젝트 파일을 미리 쓰는 시나리오).
cd /Users/uhd/.claude/jobs/2d2d4469/tmp
GROUP=R TREE=${1:?TREE} source lib.zsh
STEPS=$2; LAY=$3
setup; reset "$LAY"
[[ -n $PRE ]] && eval "$PRE"
DIRS=${REPO_OVERRIDE:-$REPO}
if [[ $4 == probe ]]; then
  mkdir -p $JOB/probe; cp -R $REPO/verification/member-probe/. $JOB/probe/; cp $REPO/skills/add-pane-grid-cell/pane-grid.ts $JOB/probe/hooks/pane-grid.ts
  DIRS="$DIRS,$JOB/probe"
elif [[ -n $4 ]]; then
  mkdir -p $JOB/scroller; cp -R scripts/R-scroller/. $JOB/scroller/; cp $REPO/skills/add-pane-grid-cell/pane-grid.ts $JOB/scroller/hooks/pane-grid.ts
  DIRS="$DIRS,$JOB/scroller"
fi
python3 -I scripts/R-sdk.py $DIRS $H $PROJ $LOG/sdk.log scripts/R-steps/$STEPS.json > $LOG/sdk.out
python3 -I scripts/R-norm.py < $LOG/sdk.out
print -r -- '## log'
# 지운 것: 줄 앞 시각(ISO), 절대 경로의 JOB 머리말은 <JOB> 로.
grep -o -E '(pane-grid: (layout revision|F51probe|action|scroll|layout state|layout file|kept|refused|message|render|press|command)[^"]*|rscroller: .{0,200}|k8member: readPlacement .*|\$\.ui\.toast \(pane-grid\): [^"]*|ui\.(open|close) pane-grid [^"]{0,60})' $LOG/sdk.log | sed "s#$JOB#<JOB>#g" | sed -E 's/"tab":"main","requestId":"grid-main",//g; s/,"isActive":(true|false)//g; s/"(column|row|columns|rows)"://g' | cut -c1-260
print -r -- '## project file'
pl | sed "s#$JOB#<JOB>#g"
