#!/bin/zsh -f
# 묶음 D(저장): k10 4절 §2 D 의 T66~T80, T77a~T77g, T103, T104, T105, T115 와 표 밖 행 T117(F49 · F50 · F59).
# 사용: zsh D.zsh <TREE> [행 id ...]   (TREE = base | tgt | broke 등. lib.zsh 가 $J/$TREE 를 REPO 로 쓴다. 행 id 를 주면 그 행만 돌린다)
# claude 는 한 번에 하나만 띄운다. T71a~T71d 만 대화형 세션 두 개(a · b)를 함께 띄운다.
# 정규화에서 지운 것:
#   - $H(격리 HOME)의 절대 경로는 `$H`, $J 는 `$J`, job 이름 2d2d4469 는 `JOB` 으로 바꾼다(두 트리가 같은 경로를 쓰지만 증거를 읽기 쉽게).
#   - debug log 줄 머리의 시각(plog 가 지운다), `mtimeMs <수>` 의 수는 `N` 으로(실행마다 바뀐다).
#   - 대화형 화면은 grid pane(오른쪽, 문자 index 95 부터) 줄과 대화 영역의 마지막 `⎿` 출력(이어지는 줄을 붙여 한 줄로)만 남긴다.
#     왼쪽 대화 영역의 로고 · 모델 · spinner · 토큰 수 · 시각은 버린다.
#   - T76 · T117b 의 실제 HOME 값은 `$REALHOME` 으로 바꾼다.
TREE=${1:?TREE}; shift
ONLY=( "$@" )
GROUP=D; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
want(){ [ ${#ONLY} -eq 0 ] && return 0; local x; for x in "$@"; do (( ${ONLY[(Ie)$x]} )) && return 0; done; return 1 }

REAL=/Users/uhd/.claude/pane-grid
nz(){ sed -E -e "s#$H#\$H#g" -e "s#$J#\$J#g" -e 's/2d2d4469/JOB/g' -e "s#/Users/uhd#\$REALHOME#g" \
  -e 's/(mtimeMs )[0-9.]+/\1N/g' -e 's/ -> [0-9]+(\.[0-9]+)?\)/ -> N)/g' -e 's/ in [0-9.]+ms//g' }
pg(){ plog "pane-grid: ($1)" ${2:-$LOG/p.log} | sed -E 's/.*\$\.ui\.log \(to debug\): //' }
sha(){ shasum -a 256 "$1" 2>/dev/null | cut -c1-64 || print NOFILE }
lsp(){ ls ${1:-$H/.claude/pane-grid/projects} 2>/dev/null | tr '\n' ' '; print }
realstate(){ print -r -- "real layout.json sha256 $(sha $REAL/layout.json)"; print -r -- "real projects: $(lsp $REAL/projects)" }
# 대화 영역의 마지막 `⎿` 출력. 다음 줄로 넘어간 부분을 이어 붙인다.
lastout(){ cap | python3 -c 'import sys
L=[l[:94].rstrip() for l in sys.stdin.read().split("\n")]
idx=[i for i,l in enumerate(L) if "⎿" in l]
if not idx: print("NO-OUTPUT"); sys.exit()
i=idx[-1]; out=[L[i].split("⎿",1)[1].strip()]
for l in L[i+1:]:
    s=l.strip()
    if not s or s.startswith(("❯","─","⏺","✻","⎿")): break
    out.append(s)
print(" ".join(out))' }
# grid pane 줄(오른쪽). 끝의 빈 줄은 버린다.
gp(){ cap | python3 -c 'import sys
ls=[]
for l in sys.stdin.read().split("\n"):
    ls.append(l[95:].rstrip() if len(l)>95 and l[94]=="│" else "")
while ls and ls[-1]=="": ls.pop()
print("\n".join(ls))' }
nfail(){ print -r -- "failed hooks: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/$S.log)" }
mark(){ MT=$(toasts | wc -l); ML=$(wc -l < $LOG/$S.log) }
newt(){ toasts | tail -n +$((MT+1)) }
newlog(){ tail -n +$((ML+1)) $LOG/$S.log }
kb(){ local r=$(loc 'q: list' | cut -d' ' -f2); click 166 $r }
start(){ S=$1; local d=$2; shift 2; up $S $d "$@"; sleep 3 }
t66state(){ reset $F2; g split -h >/dev/null }

mkdir -p $J/out/D
print -r -- "$(date -u +%FT%TZ) D $TREE start; $(realstate | tr '\n' ' ')" >> $J/out/D/sha-log.txt

# claude 가 --debug-file 에 덧붙이므로 실행마다 p.log 를 지운다(lib 의 g · gc 를 감싼다).
functions[g0]=$functions[g]; functions[gc0]=$functions[gc]
g(){ rm -f $LOG/p.log; g0 "$@" }
gc(){ rm -f $LOG/p.log; gc0 "$@" }

setup $PROJ/sub $H/proj-b
mkdir -p $OUT

# ---------------- claude -p 행 ----------------
if want T66 T67 T68 T69 T70 T117a; then
  reset $F2
  { b=$(sha $H/.claude/pane-grid/layout.json)
    print -r -- "-- g split -h"; g split -h
    print -r -- "-- log project"; pg 'project '
    print -r -- "-- project file $(pdir $PROJ)"; pl
    print -r -- "-- global sha256 same: $([ "$b" = "$(sha $H/.claude/pane-grid/layout.json)" ] && print yes || print no)"
  } 2>&1 | nz > $OUT/T66.txt
fi
if want T67; then
  git -C $PROJ worktree add -q $H/proj-wt 2>&1; trust $H/proj-wt
  {
    print -r -- "-- DIR=proj-wt g list"; DIR=$H/proj-wt g list; pg 'project '
    print -r -- "-- DIR=proj/sub g list"; DIR=$PROJ/sub g list; pg 'project '
    print -r -- "-- projects: $(lsp)"
  } 2>&1 | nz > $OUT/T67.txt
fi
if want T68; then
  mkdir -p $H/plain
  { print -r -- "-- DIR=plain g split -h"; DIR=$H/plain g split -h; pg 'project '
    print -r -- "-- projects: $(lsp)"
    print -r -- "-- plain file"; pl $H/plain
  } 2>&1 | nz > $OUT/T68.txt
fi
if want T69 T70 T117a; then
  mkdir -p $H/proj-b; git -C $H/proj-b init -q
  { print -r -- "-- DIR=proj-b g list"; DIR=$H/proj-b g list; pg 'project ' } 2>&1 | nz > $OUT/T69.txt
fi
if want T104; then
  mkdir -p "$H/my proj"
  { print -r -- "-- DIR='my proj' g split -h"; DIR="$H/my proj" g split -h; pg 'project '
    print -r -- "-- projects: $(lsp)"
    rp="$(cd "$H/my proj" && pwd -P)"
    print -r -- "-- expected dir: my-proj-$(printf %s "$rp" | shasum -a 256 | cut -c1-16)"
  } 2>&1 | nz > $OUT/T104.txt
fi
if want T105; then
  mkdir -p $H/sm; print 'gitdir: /nonexistent' > $H/sm/.git
  { print -r -- "-- DIR=sm g list"; DIR=$H/sm g list; pg 'project |not resolved'
    print -r -- "-- other pane-grid log lines"; pg 'layout file|.*failed' } 2>&1 | nz > $OUT/T105.txt
fi

# ---------------- 대화형: /cd (T70, T117a) ----------------
if want T70 T117a; then
  trust $H/proj-b
  start t70 $H/proj-b $REPO
  mark
  say "/cd $PROJ"; sleep 3
  { print -r -- "-- /cd out: $(lastout)"
    print -r -- "-- toasts"; newt
    say '/grid list'; sleep 1
    print -r -- "-- /grid list: $(lastout)"
    print -r -- "-- log project"; pg 'project |not resolved' $LOG/t70.log
    nfail } 2>&1 | nz > $OUT/T70.txt
  if want T117a T70; then
    mark
    # /cd 와 split 을 사이를 두지 않고 차례로 넣는다(1초 poll 이 프로젝트를 다시 정하기 전에 split 이 올 수 있다).
    r=$(loc '^❯' | cut -d' ' -f2); click 4 $r
    T send-keys -t $S -l "/cd $H/proj-b"; sleep 0.4; T send-keys -t $S Enter; sleep 0.2
    T send-keys -t $S -l '/grid split -h'; sleep 0.4; T send-keys -t $S Enter; sleep 5
    { print -r -- "-- last out: $(lastout)"
      print -r -- "-- toasts"; newt
      print -r -- "-- new log (project · action · changed)"; newlog | grep -o 'pane-grid: \(project\|action\|.*changed by\|not resolved\|the session moved\).*'
      print -r -- "-- proj-b file"; pl $H/proj-b
      print -r -- "-- proj file"; pl $PROJ
      nfail } 2>&1 | nz > $OUT/T117a.txt
  fi
  down
fi

# ---------------- 대화형: 두 세션 (T71a~T71d) ----------------
if want T71a T71b T71c T71d; then
  t66state
  start a $PROJ $REPO
  start b $PROJ/sub $REPO
  S=b mark; MTb=$MT; MLb=$ML
  { S=a say '/grid split -v'; print -r -- "-- a split -v: $(S=a lastout)"
    S=b say '/grid split -v'; print -r -- "-- b split -v: $(S=b lastout)"
    print -r -- "-- b log changed"; S=b newlog | grep -o 'pane-grid: .*changed by another session.*' | sed 's/^pane-grid: //'
    S=b say '/grid list'; print -r -- "-- b list: $(S=b lastout)"
    S=b say '/grid split -v'; print -r -- "-- b split -v again: $(S=b lastout)"
    print -r -- "-- file"; pl
  } 2>&1 | nz > $OUT/T71a.txt
  { S=a say '/grid reload'; print -r -- "-- a reload: $(S=a lastout)"
    S=a say '/grid split -h'; print -r -- "-- a split -h: $(S=a lastout)"
    S=b mark; S=b kb; S=b key v; sleep 2
    print -r -- "-- b toasts"; S=b newt
    print -r -- "-- b log"; S=b newlog | grep -o 'pane-grid: \(action\|.*changed by\).*'
    print -r -- "-- file"; pl
    print -r -- "-- b pane"; S=b gp
  } 2>&1 | nz > $OUT/T71b.txt
  { S=a say '/grid reload'; print -r -- "-- a reload: $(S=a lastout)"
    S=a say '/grid split -h'; print -r -- "-- a split -h: $(S=a lastout)"
    S=b mark
    set -- $(S=b loc 'c2 -'); print -r -- "-- b c2 title at: $1 $2"; S=b drag $(($1-1)) $(($2+5)) -6 0; sleep 2
    print -r -- "-- b toasts"; S=b newt
    print -r -- "-- b log"; S=b newlog | grep -o 'pane-grid: \(action\|.*changed by\).*'
    print -r -- "-- file"; pl
    print -r -- "-- b pane"; S=b gp
  } 2>&1 | nz > $OUT/T71c.txt
  { rm -f $(pdir $PROJ)/layout.json
    S=b mark
    S=b say '/grid split -h'; print -r -- "-- b split -h: $(S=b lastout)"
    print -r -- "-- b log"; S=b newlog | grep -o 'pane-grid: \(action\|.*changed by\).*'
    print -r -- "-- file"; pl
    print -r -- "-- failed: a $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/a.log) b $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/b.log)"
  } 2>&1 | nz > $OUT/T71d.txt
  S=a down; S=b down
fi

# ---------------- claude -p: 깨진 파일 (T77a~e, g) ----------------
P=$(pdir $PROJ)
if want T77a; then t66state; print 'not json' > $P/layout.json
  { g list; print -r -- "-- log"; pg 'layout file' } 2>&1 | nz > $OUT/T77a.txt; fi
if want T77b; then t66state; print -r -- '{"version":2,"tabs":[]}' > $P/layout.json
  { g list; print -r -- "-- log"; pg 'layout file' } 2>&1 | nz > $OUT/T77b.txt; fi
if want T77c; then t66state; print -r -- "${F2/\"c2\"/\"c1\"}" > $P/layout.json
  { print -r -- "-- file: $(cat $P/layout.json)"; g list; print -r -- "-- log"; pg 'layout file' } 2>&1 | nz > $OUT/T77c.txt; fi
if want T77d; then
  t66state
  V1='[]'; V2='{"version":1,"tabs":[]}'; V3=${F1/\"main\"/\"Main\"}
  V4='{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":100}]},"active":"c1"}]}'
  V5=${F2/\"id\":\"c2\"/\"id\":\"c2\",\"plugin\":\"Bad Name\"}
  { for v in $V1 $V2 $V3 $V4 $V5; do print -r -- "$v" > $P/layout.json; print -r -- "-- file: $v"; g list; pg 'layout file'; done } 2>&1 | nz > $OUT/T77d.txt
fi
if want T77e; then t66state; print 'not json' > $P/layout.json
  { print -r -- "-- g split -h"; g split -h; pg 'layout file|kept'
    print -r -- "-- invalid: $(cat $P/layout.invalid.json 2>/dev/null || print NOFILE)"
    print -r -- "-- g list"; g list
    print -r -- "-- file"; pl } 2>&1 | nz > $OUT/T77e.txt; fi
if want T77g; then t66state
  print -r -- '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"}},{"node":{"kind":"cell","id":"c2"},"size":3}]},"active":"zz"}]}' > $P/layout.json
  { g list; pg 'layout file' } 2>&1 | nz > $OUT/T77g.txt; fi

# ---------------- 대화형: T77f, T78, T79, T80 ----------------
if want T77f; then t66state; print 'not json' > $P/layout.json
  start t77f $PROJ $REPO
  { print -r -- "-- toasts"; toasts; print -r -- "-- pane"; gp; nfail } 2>&1 | nz > $OUT/T77f.txt
  down; fi
if want T78; then t66state
  start t78 $PROJ $REPO; mark
  say '/clear'; sleep 2
  { print -r -- "-- log after /clear"; newlog | grep -o 'pane-grid: \(layout .*\|action .*\)' | head -4
    print -r -- "-- pane"; gp
    say '/grid list'; print -r -- "-- list: $(lastout)"; nfail } 2>&1 | nz > $OUT/T78.txt
  down; fi
if want T79; then t66state
  start t79 $PROJ $REPO $PQ; mark
  { print -r -- "-- shown pane before: $(grep -o 'ui.open [a-z-]* [a-z-]*' $LOG/t79.log | tail -1)"
    say '/clear'; sleep 3
    print -r -- "-- log after /clear"; newlog | grep -o 'pane-grid: \(layout .*\)' | head -4
    nfail } 2>&1 | nz > $OUT/T79.txt
  down; fi
if want T80; then reset $F2
  start t80a $PROJ $REPO
  for c in '/grid split -h usage-gauge' '/grid resize 30' '/grid new notes' '/grid select main' '/grid zoom'; do say "$c"; done
  say '/grid list'; before=$(lastout)
  sleep 1; down
  start t80b $PROJ $REPO
  say '/grid list'; after=$(lastout)
  { print -r -- "-- before: $before"; print -r -- "-- after:  $after"; print -r -- "-- same: $([ "$before" = "$after" ] && print yes || print no)"
    print -r -- "-- file"; pl; nfail } 2>&1 | nz > $OUT/T80.txt
  down; fi

# ---------------- claude -p: 설정 디렉터리 (T72~T76, T103, T115, T117b) ----------------
if want T72; then reset $F2; { g reload } 2>&1 | nz > $OUT/T72.txt; fi
CFE=$JOB/cfg-empty; CFO=$JOB/cfg-own
if want T73 T74; then reset $F2; rm -rf $CFE; mkdir -p $CFE
  { print -r -- "-- reload"; gc $CFE reload; print -r -- "-- list"; gc $CFE list } 2>&1 | nz > $OUT/T73.txt
  b=$(sha $H/.claude/pane-grid/layout.json)
  { print -r -- "-- split -h"; gc $CFE split -h; pg 'project '
    print -r -- "-- reload"; gc $CFE reload
    print -r -- "-- H global sha256 same: $([ "$b" = "$(sha $H/.claude/pane-grid/layout.json)" ] && print yes || print no)"
    print -r -- "-- ls H pane-grid: $(lsp $H/.claude/pane-grid)"
    print -r -- "-- ls CFG pane-grid/projects: $(lsp $CFE/pane-grid/projects)"
    print -r -- "-- CFG file"; cat $CFE/pane-grid/projects/*/layout.json 2>/dev/null || print NOFILE
  } 2>&1 | nz > $OUT/T74.txt
fi
if want T75 T103; then rm -rf $CFO; mkdir -p $CFO/pane-grid; print -r -- "$F1" > $CFO/pane-grid/layout.json; reset $F2
  { gc $CFO list } 2>&1 | nz > $OUT/T75.txt
  { print -r -- "-- CLAUDE_CONFIG_DIR=\$CFG/ split -h"; gc $CFO/ split -h; pg 'project '
    print -r -- "-- CFG projects: $(lsp $CFO/pane-grid/projects)" } 2>&1 | nz > $OUT/T103.txt
fi
if want T76; then
  CFR=$JOB/cfg-real; rm -rf $CFR; mkdir -p $CFR
  bs=$(realstate)
  out=$( (cd $PROJ && env -u CLAUDECODE CLAUDE_CONFIG_DIR=$CFR claude -p "/grid split -h" --plugin-dir $REPO --debug-file $LOG/real.log 2>&1 | grep -v 'mcp-sdk\] SEP-') )
  as=$(realstate)
  { print -r -- "-- before"; print -r -- "$bs"
    print -r -- "-- split -h: $out"
    print -r -- "-- log"; pg 'project |layout file' $LOG/real.log
    print -r -- "-- after"; print -r -- "$as"
    print -r -- "-- same: $([ "$bs" = "$as" ] && print yes || print no)"
    print -r -- "-- written under CFG:"; (cd $CFR && find pane-grid -maxdepth 4 -name 'layout*.json' 2>/dev/null | sed -E 's/-[0-9a-f]{16}/-HEX/')
  } 2>&1 | nz > $OUT/T76.txt
fi
if want T115; then reset 'not json'
  b=$(sha $H/.claude/pane-grid/layout.json)
  { print -r -- "-- split -h"; g split -h; pg 'layout file|kept'
    print -r -- "-- invalid: $(cat $P/layout.invalid.json 2>/dev/null || print NOFILE)"
    print -r -- "-- global sha256 same: $([ "$b" = "$(sha $H/.claude/pane-grid/layout.json)" ] && print yes || print no)"
    print -r -- "-- file"; pl } 2>&1 | nz > $OUT/T115.txt
fi
if want T117b; then
  # HOME · CLAUDE_CONFIG_DIR 둘 다 없음. claude 자신은 passwd 의 홈(실제 ~/.claude)을 설정 디렉터리로 쓰므로,
  # 사용자 설정을 읽지 않게 --setting-sources project, 설치본 pane-grid 를 끄고, 세션 기록을 남기지 않는다.
  nh(){ rm -f $LOG/nh.log; (cd $PROJ && env -u HOME -u CLAUDE_CONFIG_DIR -u CLAUDECODE claude -p "/grid $*" --plugin-dir $REPO --setting-sources project --strict-mcp-config --no-session-persistence --settings '{"enabledPlugins":{"pane-grid@pane-grid":false}}' --debug-file $LOG/nh.log 2>&1 | grep -v 'mcp-sdk\] SEP-') }
  bs=$(realstate)
  { print -r -- "-- no HOME split -h: $(nh split -h)"; pg 'no file|project |command failed|start failed' $LOG/nh.log
    print -r -- "-- no HOME reload: $(nh reload)"; pg 'no file|project |command failed|start failed' $LOG/nh.log
    print -r -- "-- /.claude exists: $([ -e /.claude ] && print yes || print no)"
    print -r -- "-- real same: $([ "$bs" = "$(realstate)" ] && print yes || print no)"
  } 2>&1 | nz > $OUT/T117b.txt
  rm -rf $PROJ/rel-cfg
  { print -r -- "-- CLAUDE_CONFIG_DIR=rel-cfg split -h"; rm -f $LOG/p.log; (cd $PROJ && env -u CLAUDECODE HOME=$H CLAUDE_CONFIG_DIR=rel-cfg claude -p "/grid split -h" --plugin-dir $REPO --debug-file $LOG/p.log 2>&1 | grep -v 'mcp-sdk\] SEP-'); pg 'project '
    print -r -- "-- written: $(cd $PROJ && find rel-cfg/pane-grid -maxdepth 3 -name layout.json 2>/dev/null | sed -E 's/-[0-9a-f]{16}/-HEX/')"
  } 2>&1 | nz > $OUT/T117b-rel.txt
fi

T kill-server 2>/dev/null
print -r -- "$(date -u +%FT%TZ) D $TREE end; $(realstate | tr '\n' ' ')" >> $J/out/D/sha-log.txt
print done $TREE
