#!/bin/zsh -f
# 묶음 X 중 claude 를 띄우지 않는 시나리오(skill 문서 · plugin.json 은 X-cli.zsh, 여기는 SKILL.md · build.py · SVG · 문서 앵커).
# 사용: zsh X-static.zsh <TREE>
# 정규화에서 지운 것: build.py 사본 경로를 <W> 로(buildpy_fail.zsh 가 한다), Chrome 의 --user-data-dir 임시 경로를 <tmp> 로, doc_anchors.py 의 `== <트리>` 머리줄. 그 밖에는 시각 · pid 가 없다.
TREE=${1:?TREE}
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
REPO=$J/$TREE; OUT=$J/out/X/$TREE; mkdir -p $OUT
S=$REPO/skills/add-pane-grid-cell

# X8: skill 이 member mod 에 적용하는 절차(SKILL.md 39행 근처)와 member 사본이 내보내는 이름
{ print "TOOLBAR_KEYS lines in SKILL.md: $(/usr/bin/grep -c 'TOOLBAR_KEYS' $S/SKILL.md)"
  print -- '--Keep sentence'; /usr/bin/grep -o 'Keep `GRID_VERSION`[^:]*' $S/SKILL.md || print NONE
  print "export lines in pane-grid.ts: $(/usr/bin/grep -c '^export' $S/pane-grid.ts)"
  print -- '--exported names'; /usr/bin/grep -o -E '^export (const|function|type|interface) [A-Za-z_]+' $S/pane-grid.ts | awk '{print $3}' | sort; } > $OUT/X8.txt

# X22 · X23 · X24: build.py 의 render() 를 실패하는 Chrome 으로(종료 코드 3 · PNG 없이 0 · 실행 파일 없음)
zsh $J/scratch/buildpy_fail.zsh $TREE fail 2>&1 | sed -E 's|--user-data-dir=[^'"'"']*|--user-data-dir=<tmp>|' > $OUT/X22.txt
zsh $J/scratch/buildpy_fail.zsh $TREE nopng > $OUT/X23.txt 2>&1
zsh $J/scratch/buildpy_fail.zsh $TREE missing > $OUT/X24.txt 2>&1

# X25: 생성 SVG 와 커밋된 SVG · PNG
python3 -I $J/scratch/x25.py $TREE > $OUT/X25.txt 2>&1

# X26: 문서가 `hooks/<파일>` 의 `<이름>` 으로 가리키는 식별자가 그 파일에 있는가
python3 -I $J/scratch/doc_anchors.py | awk -v t="== $TREE" '/^== /{p=($0==t); next} p' > $OUT/X26.txt
exit 0
