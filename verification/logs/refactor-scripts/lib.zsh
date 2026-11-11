# k12 공용 시험 함수. k10 4절 §1.3 을 묶음마다 따로 쓰도록 매개변수로 바꾼 것.
# 사용: GROUP=<묶음 이름> TREE=<base|tgt> source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
#   - REPO 는 TREE 로 정한다. base = main dd6cda9 의 git archive, tgt = k11-refactor 2d2d846 의 git archive(둘 다 로컬 디스크).
#   - JOB(= $J/run/$GROUP)은 base 와 tgt 가 같은 경로를 쓴다. 그래서 프로젝트 디렉터리 hash 가 두 쪽에서 같다.
#     한 묶음 안에서 base 와 tgt 는 차례로 돌린다(setup 이 JOB 을 지우고 다시 만든다).
#   - 출력은 OUT(= $J/out/$GROUP/$TREE)에 남긴다.
#   - tmux 소켓은 묶음마다 pgt-$GROUP 이다.
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
: ${GROUP:?GROUP} ${TREE:?TREE}
REPO=$J/$TREE
JOB=$J/run/$GROUP
OUT=$J/out/$GROUP/$TREE
H=$JOB/home; PROJ=$H/proj; LOG=$JOB/logs
UG=/Users/uhd/.claude/plugins/cache/usage-gauge/usage-gauge/0.4.0
PQ=/Users/uhd/.claude/plugins/cache/pending-questions/pending-questions/0.3.0
FT=/Users/uhd/LOCAL/01-01_Projects/plugin-filetree
FD=/Users/uhd/LOCAL/01-01_Projects/plugin-flightdeck
IN=/Users/uhd/LOCAL/01-01_Projects/plugin-inbox
MD=/Users/uhd/LOCAL/01-01_Projects/plugin-hamzafer-mods/mods/md-preview
TB=/Users/uhd/LOCAL/01-01_Projects/plugin-terminal-browser/claude-code-plugin
F1='{"version":1,"tabs":[{"name":"main","root":{"kind":"cell","id":"c1"},"active":"c1"}]}'
F2='{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2"},"size":50}]},"active":"c1"}]}'

# setup: JOB 을 지우고 HOME 격리(방법 H)를 새로 만든다. 추가 인자는 신뢰 dialog 를 건너뛸 디렉터리(생성까지 한다).
setup(){
  T kill-server 2>/dev/null
  if [ -d $H/Library ]; then rm -f $H/Library/Keychains $H/Library/Preferences; fi
  rm -rf $JOB; mkdir -p $H/Library $PROJ $LOG $H/.claude/pane-grid $OUT
  ln -s /Users/uhd/Library/Keychains $H/Library/Keychains
  ln -s /Users/uhd/Library/Preferences $H/Library/Preferences
  (cd $PROJ && git init -q . && git commit -q --allow-empty -m init)
  trust $PROJ "$@"
  printf 'set -g mouse on\nset -g status off\nset -g focus-events on\nset -g default-terminal "xterm-256color"\n' > $JOB/tmux.conf
}
# trust <디렉터리 ...>: $H/.claude.json 의 projects 에 신뢰를 적는다(없으면 만든다).
trust(){ local d; for d in "$@"; do mkdir -p "$d"; done
  python3 -c 'import json,sys,os
p=sys.argv[1]
try: c=json.load(open(p))
except Exception: c={"hasCompletedOnboarding":True,"theme":"dark","projects":{}}
for d in sys.argv[2:]:
    c.setdefault("projects",{})[os.path.realpath(d)]={"hasTrustDialogAccepted":True}
json.dump(c,open(p,"w"))' $H/.claude.json "$@" }
reset(){ rm -rf $H/.claude/pane-grid/projects; print -r -- "$1" > $H/.claude/pane-grid/layout.json }
# g <인자>: /grid 를 한 번(프로세스 하나). stdout+stderr 를 낸다. debug log 는 $LOG/p.log 에 새로 쓰고 $LOG/p-<번호>.log 로 복사한다.
GN=0
g(){ GN=$((GN+1)); (cd ${DIR:-$PROJ} && env -u CLAUDE_CONFIG_DIR -u CLAUDECODE HOME=$H claude -p "/grid $*" --plugin-dir $REPO --debug-file $LOG/p.log 2>&1 | grep -v 'mcp-sdk\] SEP-'); cp $LOG/p.log $LOG/p-$GN.log 2>/dev/null }
# gc <CFG> <인자>: 방법 C(CLAUDE_CONFIG_DIR) 로 /grid 한 번.
gc(){ local cfg=$1; shift; GN=$((GN+1)); (cd ${DIR:-$PROJ} && env -u CLAUDECODE HOME=$H CLAUDE_CONFIG_DIR=$cfg claude -p "/grid $*" --plugin-dir $REPO --debug-file $LOG/p.log 2>&1 | grep -v 'mcp-sdk\] SEP-'); cp $LOG/p.log $LOG/p-$GN.log 2>/dev/null }
pdir(){ local p="$(cd $1 && pwd -P)"; print -r -- "$H/.claude/pane-grid/projects/${p:t}-$(printf %s "$p" | shasum -a 256 | cut -c1-16)" }
# pl: 프로젝트 파일 내용(없으면 NOFILE)
pl(){ cat $(pdir ${1:-$PROJ})/layout.json 2>/dev/null || print NOFILE }
# plog <정규식> [log]: pane-grid 가 적은 줄 중 정규식에 맞는 것(시각 머리말 제거)
plog(){ grep -E "$1" ${2:-$LOG/p.log} | sed -E 's/^[0-9TZ:.-]+ //' }
failed(){ cat ${1:-$LOG}/*.log 2>/dev/null | grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' }

T(){ tmux -L pgt-$GROUP "$@" }
# up <세션> <시작 디렉터리> <--plugin-dir 폴더 ...>
up(){ local s=$1 d=$2; shift 2; local dirs=""; for x in "$@"; do dirs="$dirs --plugin-dir $x"; done
  T -f $JOB/tmux.conf new-session -d -s $s -x 170 -y 45 -c $d "env -u CLAUDE_CONFIG_DIR -u CLAUDECODE HOME=$H DISABLE_AUTOUPDATER=1 LANG=en_US.UTF-8 zsh -f"; sleep 1
  T send-keys -t $s -l "claude --setting-sources project --strict-mcp-config --model haiku$dirs --debug-file $LOG/$s.log"; T send-keys -t $s Enter; sleep 14 }
cap(){ T capture-pane -p -t ${S:-t} }
cape(){ T capture-pane -e -p -t ${S:-t} }
loc(){ cap | python3 -c 'import sys,re
for n,l in enumerate(sys.stdin.read().split("\n")):
    m=re.search(sys.argv[1],l)
    if m: print(m.start()+1,n+1); break' "$1" }
click(){ T send-keys -t ${S:-t} -l $'\e[<0;'"$1;$2"'M'; sleep 0.3; T send-keys -t ${S:-t} -l $'\e[<0;'"$1;$2"'m'; sleep 1.2 }
drag(){ T send-keys -t ${S:-t} -l $'\e[<0;'"$1;$2"'M'; sleep 0.4
  for k in 1 2 3; do T send-keys -t ${S:-t} -l $'\e[<32;'"$(($1+$3*k/3));$(($2+$4*k/3))"'M'; sleep 0.35; done
  T send-keys -t ${S:-t} -l $'\e[<0;'"$(($1+$3));$(($2+$4))"'m'; sleep 1.2 }
wheel(){ T send-keys -t ${S:-t} -l $'\e[<'"${3:-65};$1;$2"'M'; sleep 0.3 }
say(){ local r=$(loc '^❯' | cut -d' ' -f2); click 4 $r; T send-keys -t ${S:-t} -l "$1"; sleep 1; T send-keys -t ${S:-t} Enter; sleep 2 }
key(){ T send-keys -t ${S:-t} -l "$1"; sleep 1.5 }
down(){ T send-keys -t ${S:-t} -l '/exit'; sleep 0.5; T send-keys -t ${S:-t} Enter; sleep 2; T kill-session -t ${S:-t} 2>/dev/null }
# toasts/acts [log]: pane-grid toast · action 줄
toasts(){ grep -o '\$.ui.toast (pane-grid): .*' ${1:-$LOG/${S:-t}.log} }
acts(){ grep -o 'pane-grid: action .*' ${1:-$LOG/${S:-t}.log} }
