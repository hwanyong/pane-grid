#!/bin/zsh -f
# 묶음 E(member mod 배치, 대화형): T81~T93, T106, 그리고 표 밖 행 T118~T127(포크 mod 다섯 개 x load 순서 두 가지).
# 사용: zsh E.zsh <TREE> [행 id ...]   (TREE = base | tgt | broke 등. lib.zsh 가 $J/$TREE 를 REPO 로 쓴다. 행 id 를 주면 그 행만 돌린다)
# claude 는 한 번에 하나만 띄운다(세션마다 down 뒤 다음 세션).
# 시험용 plugin 세 개는 $J/run/E 밖의 복사본을 쓴다(setup 이 $J/run/E 를 지우므로):
#   MP = $J/member-probe-<TREE>  : verification/member-probe + 그 트리의 skills/add-pane-grid-cell/pane-grid.ts (k10 E 절)
#   SP = $J/shown-probe-<TREE>   : $J/probe-src/k12shown + 같은 pane-grid.ts. readShownTab 값을 log 에 적는다(T106)
#   NP = $J/nothing-probe-<TREE> : $J/probe-src/k12nothing. grid pane 의 ui.render 를 hook 하지만 cell: Box 를 내지 않는다(T87)
# 정규화에서 지운 것:
#   - 화면은 grid pane(오른쪽, 문자 index 95 부터) 줄만 남긴다. 왼쪽 대화 영역(로고 · 모델 · spinner · 토큰 수 · 시각)은 버리고
#     `⎿` 가 든 명령 출력 줄은 따로 마지막 한 줄만 남긴다.
#   - grid pane 의 칸 제목 줄(region 6번째 줄) 아래에서, 제목에 mod 이름이 있는 칸(제목이 `-` 가 아닌 칸)의 열 범위 안 숫자를 `N` 으로 바꾼다.
#     member mod 가 그리는 사용량 · 시각 · 경과 시간이 실행마다 바뀌기 때문이다. 빈 칸(choices 의 hotkey 숫자)은 그대로 둔다.
#     같은 범위의 막대 글자 `█` 를 `░` 로 바꾼다. usage-gauge 막대의 채운 길이가 실제 사용량을 따라 실행마다 바뀌기 때문이다
#     (2026-11-11 첫 대조에서 base 와 tgt 사이 막대가 한 칸 늘어 DIFF 가 났다).
#   - T92 의 prompt 위 band 는 숫자 전부를 `N` 으로, `█` 를 `░` 로 바꾼다(usage-gauge 의 사용량).
#   - debug log 줄 머리의 시각, `in <수>ms` · `settled in <수>ms`, 경로 속 job 이름(2d2d4469)은 지운다. mod 의 log 줄은 sort -u 로 차례를 지운다.
TREE=${1:?TREE}; shift
ONLY=( "$@" )
GROUP=E; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh

# ---- 시험용 plugin 복사본
MP=$J/member-probe-$TREE; SP=$J/shown-probe-$TREE; NP=$J/nothing-probe-$TREE
rm -rf $MP $SP $NP
cp -R $REPO/verification/member-probe $MP && cp $REPO/skills/add-pane-grid-cell/pane-grid.ts $MP/hooks/pane-grid.ts
cp -R $J/probe-src/k12shown $SP && cp $REPO/skills/add-pane-grid-cell/pane-grid.ts $SP/hooks/pane-grid.ts
cp -R $J/probe-src/k12nothing $NP

want(){ [ ${#ONLY} -eq 0 ] && return 0; local x; for x in "$@"; do (( ${ONLY[(Ie)$x]} )) && return 0; done; return 1 }

# grid pane 영역의 줄. 끝의 빈 줄은 버린다. mod 가 놓인 칸의 숫자를 N 으로(위 정규화 설명).
gp(){ cap | python3 -c '
import sys,re
ls=[]
for l in sys.stdin.read().split("\n"):
    ls.append(l[95:].rstrip() if len(l)>95 and l[94]=="│" else "")
while ls and ls[-1]=="": ls.pop()
# 칸 제목 줄: "c<수> " 로 시작하는 첫 줄
ti=next((i for i,l in enumerate(ls) if re.match(r"c\d+ ",l)),None)
if ti is not None:
    t=ls[ti]; cuts=[0]+[m.start()+1 for m in re.finditer("│",t)]+[10**6]
    segs=[(cuts[k],cuts[k+1]) for k in range(len(cuts)-1)]
    mod=[(a,b) for a,b in segs if not re.match(r"c\d+ -",t[a:b].strip()+" ")]
    for i in range(ti+1,len(ls)):
        l=list(ls[i])
        for a,b in mod:
            for j in range(a,min(b-1,len(l))):
                if l[j].isdigit(): l[j]="N"
                elif l[j]=="█": l[j]="░"
        ls[i]="".join(l)
print("\n".join(ls))' }
# 대화 영역의 마지막 `⎿` 출력 줄
lastout(){ cap | python3 -c 'import sys
r=[l[:94].strip() for l in sys.stdin.read().split("\n") if "⎿" in l[:94]]
print(r[-1] if r else "NO-OUTPUT")' }
built(){ grep -o 'built for [a-z0-9,-]*' $LOG/$S.log | head -1 }
nfail(){ print -r -- "failed hooks: $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/$S.log)" }
norm(){ sed -E 's/^[0-9TZ:.-]+ //; s/ in [0-9.]+ms//g; s/settled [0-9.]+ms/settled/g; s/2d2d4469/JOB/g' }
probe(){ grep -o "$1.*" $LOG/$S.log | tail -1 }
probes(){ grep -o "$1.*" $LOG/$S.log }
mark(){ MT=$(toasts | wc -l); MA=$(acts | wc -l); ML=$(wc -l < $LOG/$S.log) }
newt(){ toasts | tail -n +$((MT+1)) }
newlog(){ tail -n +$((ML+1)) $LOG/$S.log }
kb(){ local r=$(loc 'q: list' | cut -d' ' -f2); click 166 $r }
# start <세션 이름> <fixture JSON> <--plugin-dir 폴더 ...>
start(){ S=$1; local fx=$2; shift 2; T kill-server 2>/dev/null; reset $fx; up $S $PROJ "$@"; sleep 3 }
fx(){ python3 -c 'import json,sys
f=json.loads(sys.argv[1]); f["tabs"][0]["root"]["children"][0]["node"]["plugin"]=sys.argv[2]
if len(sys.argv)>3: f["tabs"][0]["active"]=sys.argv[3]
print(json.dumps(f,separators=(",",":")))' "$F2" "$@" }
UGC2=$(fx usage-gauge c2)   # T81 의 fixture: c1 에 usage-gauge, 활성 c2

setup

# ---- T81 · T82: [REPO, UG, PQ]
if want T81 T82; then
start t81 $UGC2 $REPO $UG $PQ
say '/grid select main'; sleep 2
{ built; print -r -- "-- out: $(lastout)"; print -r -- '-- pane'; gp; nfail } > $OUT/T81.txt
say '/grid place pending-questions c2'; sleep 3
{ print -r -- "-- out: $(lastout)"; print -r -- '-- pane'; gp } > $OUT/T82.txt
say '/grid place - c2'; sleep 3
{ print -r -- "-- out: $(lastout)"; print -r -- '-- pane'; gp } >> $OUT/T82.txt
say '/grid select main'; sleep 2
{ print -r -- "-- out: $(lastout)"; print -r -- '-- pane'; gp; nfail } >> $OUT/T82.txt
down
fi

# ---- T83 · T84: [UG, PQ, REPO]
if want T83 T84; then
start t83 $UGC2 $UG $PQ $REPO
{ built; print -r -- '-- pane'; gp; nfail } > $OUT/T83.txt
mark; kb; key 1; sleep 2
{ print -r -- '-- toasts'; newt; print -r -- '-- pane'; gp; print -r -- '-- file'; pl; print; nfail } > $OUT/T84.txt
down
fi

# ---- T85: [UG, REPO, PQ]
if want T85; then
start t85 $UGC2 $UG $REPO $PQ
say '/grid select main'; sleep 2
{ built; print -r -- '-- pane'; gp; nfail } > $OUT/T85.txt
down
fi

# ---- T86: [REPO] 만, c1 에 usage-gauge
if want T86; then
start t86 $UGC2 $REPO
{ built; print -r -- '-- pane'; gp; nfail } > $OUT/T86.txt
down
fi

# ---- T87: [REPO, NP], c1 에 k12nothing
if want T87; then
start t87 $(fx k12nothing c2) $REPO $NP
say '/grid select main'; sleep 2
{ built; print -r -- '-- pane'; gp; nfail } > $OUT/T87.txt
down
fi

# ---- T88 · T89: [REPO, UG, MP]
if want T88 T89; then
start t88 $UGC2 $REPO $UG $MP
say '/grid select main'; sleep 3
{ built; print -r -- '-- first'; probes 'k8member: readPlacement' | head -1; print -r -- '-- last'; probe 'k8member: readPlacement'; nfail } > $OUT/T88.txt
{ say '/grid select-cell c1'; sleep 3; print -r -- "-- select-cell c1: $(lastout)"; probe 'k8member: readPlacement'
  say '/grid place usage-gauge c2'; sleep 3; print -r -- "-- place usage-gauge c2: $(lastout)"; probe 'k8member: readPlacement'
  say '/grid resize 30'; sleep 3; print -r -- "-- resize 30: $(lastout)"; probe 'k8member: readPlacement'
  print -r -- '-- pane'; gp; nfail } > $OUT/T89.txt
down
fi

# ---- T90: [REPO, UG, MP], zoom
if want T90; then
start t90 $UGC2 $REPO $UG $MP
say '/grid select main'; sleep 3
{ say '/grid zoom'; sleep 3; print -r -- "-- zoom(c2): $(lastout)"; probe 'k8member: readPlacement'
  say '/grid zoom'; sleep 3; print -r -- "-- zoom again: $(lastout)"; probe 'k8member: readPlacement'
  say '/grid select-cell c1'; sleep 3; print -r -- "-- select-cell c1: $(lastout)"; probe 'k8member: readPlacement'
  say '/grid zoom'; sleep 3; print -r -- "-- zoom(c1): $(lastout)"; probe 'k8member: readPlacement'
  print -r -- '-- pane'; gp; nfail } > $OUT/T90.txt
down
fi

# ---- T91: [REPO, UG, MP], break
if want T91; then
start t91 $UGC2 $REPO $UG $MP
say '/grid select main'; sleep 3
{ say '/grid select-cell c1'; sleep 3; print -r -- "-- select-cell c1: $(lastout)"
  ML=$(wc -l < $LOG/$S.log)
  say '/grid break'; sleep 4; print -r -- "-- break: $(lastout)"
  print -r -- '-- readPlacement 줄(break 뒤 전부)'; newlog | grep -o 'k8member: readPlacement.*'
  print -r -- '-- pane'; gp; nfail } > $OUT/T91.txt
down
fi

# ---- T92: [UG] 만
if want T92; then
start t92 $UGC2 $UG
{ built; print -r -- "grid pane lines: $(cap | python3 -c 'import sys;print(sum(1 for l in sys.stdin.read().split("\n") if len(l)>95 and l[94]=="│"))')"
  print -r -- '-- prompt 위 4줄(숫자 N)'
  cap | python3 -c 'import sys,re
ls=sys.stdin.read().split("\n")
p=[i for i,l in enumerate(ls) if l.startswith("❯")]
i=p[-1] if p else len(ls)
# prompt 위 가로선 줄을 건너뛰고 그 위 4줄
j=i-1
while j>0 and set(ls[j].strip())<=set("─"): j-=1
for l in ls[max(0,j-3):j+1]: print(re.sub(r"\d","N",l.rstrip()).replace("█","░"))'
  nfail } > $OUT/T92.txt
down
fi

# ---- T93: Client 가 없는 surface. 실행하지 못함(아래 기록만 남긴다)
if want T93; then
print -r -- 'NOT RUN: e.surface 가 terminal · desktop 이 아닌 surface 를 창 없이 띄우는 방법이 없다(k10 표 T93)' > $OUT/T93.txt
fi

# ---- T106: readShownTab. [REPO, SP] 에서 처음 값, /grid new w2 뒤, /grid select main 뒤. 이어 [SP] 만.
if want T106; then
start t106 $F2 $REPO $SP
{ built; print -r -- '-- start'; probe 'k12shown: readShownTab'
  say '/grid new w2'; sleep 3; print -r -- "-- new w2: $(lastout)"; probe 'k12shown: readShownTab'
  say '/grid select main'; sleep 3; print -r -- "-- select main: $(lastout)"; probe 'k12shown: readShownTab'
  print -r -- '-- 전부'; probes 'k12shown: readShownTab'; nfail } > $OUT/T106.txt
down
start t106b $F2 $SP
{ print -r -- '-- pane-grid 없이'; built; probes 'k12shown: readShownTab'; nfail } >> $OUT/T106.txt
down
fi

# ---- T118~T127: 포크 mod 다섯 개 x load 순서 두 가지. c1 에 그 mod(F2, 활성 c1).
fork(){ local id=$1 dir=$2 order=$3 name=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["name"])' $2/.claude-plugin/plugin.json)
  want $id || return 0
  if [ $order = A ]; then start $id:l $(fx $name) $REPO $dir; else start $id:l $(fx $name) $dir $REPO; fi
  sleep 8
  { print -r -- "mod $name order $order"; built
    print -r -- "-- tab bar before select: $(gp | head -1)"
    say '/grid select main'; sleep 4
    print -r -- "-- out: $(lastout)"
    print -r -- '-- pane'; gp
    nfail
    print -r -- "-- $name log 줄(sort -u)"
    grep -E "ui\.(open|close) $name|\\\$\.ui\.(log|toast) \($name\)|$name.*(failed|error|Error)|\[ERROR\].*$name" $LOG/$S.log | norm | sed -E 's/[0-9]+(\.[0-9]+)?ms/Nms/g' | sort -u
    print -r -- '-- pane-grid log 줄(sort -u)'
    grep -oE 'pane-grid: (layout|project|loaded|placed|action|refused).*' $LOG/$S.log | sed -E 's/revision=[0-9]+/revision=N/' | sort -u
  } > $OUT/$id.txt
  down }
fork T118 $FT A; fork T119 $FT B
fork T120 $FD A; fork T121 $FD B
fork T122 $IN A; fork T123 $IN B
fork T124 $MD A; fork T125 $MD B
fork T126 $TB A; fork T127 $TB B

T kill-server 2>/dev/null
print -r -- "done $TREE"
