#!/bin/zsh -f
# R.zsh <TREE>: R 묶음. k11 이 재현하지 못한 결함 F47 · F51 · F54 · F63 의 결함 창을 headless SDK 세션으로 만든다.
#   방법: `claude -p --input-format stream-json --output-format stream-json` 을 격리 HOME 으로 띄우고(lib.zsh setup),
#   SDK control request(ui_attach · ui_render · ui_message · ui_scroll · ui_panes)와 user 메시지 `/clear` 를 보낸다
#   (scripts/R-sdk.py, steps 는 scripts/R-steps/gen.py 가 만든다). 창이 있는 앱 · tmux 는 쓰지 않는다. claude 는 한 번에 하나.
#   F47 은 트리 사본($J/run/R/copy)의 loadFile 에 3초 지연을 넣어 진행 중인 load 를 길게 둔다(scripts/R-steps/patch.py).
#   원본 트리($J/base · $J/tgt)는 고치지 않는다.
# 출력: $J/out/R/<TREE>/R-F47.txt · R-F51.txt · R-F54.txt · R-F63.txt.
# 정규화(지운 것): log 줄 앞 ISO 시각, 경로의 $J/run/R 머리말(<JOB>), SDK request_id, initialize 응답 본문(명령 목록 · 계정),
#   ui_render 의 tree 전체(칸 상자 너비 · marginTop · cell: · divider Client key 만 남김, scripts/R-norm.py),
#   k8member readPlacement 줄의 tab · requestId · isActive 와 필드 이름.
TREE=${1:?TREE}
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
O=$J/out/R/$TREE
python3 -I $J/scripts/R-steps/gen.py || exit 1

run_f47(){
  print -r -- '# R-F47: /clear 뒤 겹친 ensureLayout (global layout.json 무효, 사본 loadFile 3초 지연)'
  zsh $J/scripts/R-f47.zsh $TREE
  print -r -- ''
  print -r -- '# R-F47 (지연 없는 원래 트리, 같은 steps)'
  zsh $J/scripts/R-f47.zsh $TREE nodelay | sed -n '/## counts after/,$p'
}
run_f51(){
  print -r -- '# R-F51: 다른 세션이 t2 를 t3 으로 바꾼 뒤 t2 의 비활성 칸 c3 activate'
  zsh $J/scripts/R-f51.zsh $TREE
  print -r -- ''
  print -r -- '# R-F51 (사본에 activateCell 이 고른 탭 목록 log 를 넣은 판)'
  zsh $J/scripts/R-f51.zsh $TREE log51 | sed -n '/## log/,/## project file/p' | grep -E 'F51probe|ui.open pane-grid grid-t2'
}
run_f54(){
  print -r -- '# R-F54: desktop 100x40 와 mobile 50x30 이 grid-main 을 번갈아 그린다(member-probe 로 placed 를 읽는다)'
  zsh $J/scripts/R-run.zsh $TREE f54 '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1","plugin":"usage-gauge"},"size":50},{"node":{"kind":"cell","id":"c2","plugin":"filetree"},"size":50}]},"active":"c1"}]}' probe
}
run_f63(){
  print -r -- '# R-F63: 크기 변경 render 뒤 measure 보고 전의 휠(c2 에 스스로 스크롤하는 시험 member r-scroller)'
  zsh $J/scripts/R-run.zsh $TREE f63 '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2","plugin":"r-scroller"},"size":50}]},"active":"c1"}]}' scroller
}
mkdir -p $O
run_f47 > $O/R-F47.txt 2>&1
run_f51 > $O/R-F51.txt 2>&1
run_f54 > $O/R-F54.txt 2>&1
run_f63 > $O/R-F63.txt 2>&1
GROUP=R TREE=$TREE source $J/lib.zsh; T kill-server 2>/dev/null
print -r -- "R $TREE done: $(ls $O | tr '\n' ' ')"
