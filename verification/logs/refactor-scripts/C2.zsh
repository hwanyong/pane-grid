#!/bin/zsh -f
# 묶음 C2: k10 4절 C 의 T59a~T59c, T60~T63, T64a~T64d, T65a~T65e, T101, T102. 대화형(tmux, lib 의 up).
# 사용: zsh C2.zsh <TREE>   (TREE = base | tgt | broke …)
# 휠 위(SGR 64)는 휠 아래 바로 뒤의 첫 번은 엔진에 전달되지 않았다(log 에 ui.scroll 줄이 없다, 2026-11-11 base 실행). 그래서 두 번 보낸다.
#   pane-grid 는 0 아래로 내려가지 않게 자르므로(Math.max(…, 0)) 둘 다 전달돼도 결과는 같다.
# 정규화(매번 바뀌어 지우는 것):
#   - 화면은 grid pane 쪽(첫 줄의 `│` 오른쪽)만 쓴다. 왼쪽 대화 영역에는 spinner · 시각 · 토큰 수가 나온다.
#   - 명령 응답은 화면의 `⎿  pane-grid: …` 줄을 `│` 앞에서 자르고 줄 끝 공백을 지운다.
#   - usage-gauge 칸의 수치(사용률 %, 남은 시간)는 실행마다 바뀌므로 숫자를 `#` 으로 바꾼다(ug 함수). 그 밖의 줄은 그대로 둔다.
#   - debug log 줄은 시각 머리말을 지운다(`grep -o` 로 본문만).
#   - 프로젝트 파일 JSON 은 revision 이 없으므로 그대로 쓴다.
TREE=${1:?TREE}
GROUP=C2; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
S=t; TL=$LOG/t.log

# rp: grid pane 쪽 화면. 첫 줄에서 `│` 의 열을 찾아 그 오른쪽만, 줄 끝 공백 제거, 숫자 마스크는 하지 않는다.
rp(){ cap | python3 -c 'import sys
ls=sys.stdin.read().split("\n")
b=ls[0].find("│")
for l in ls: print(l[b+1:].rstrip() if b>=0 else l.rstrip())' }
# ug: usage-gauge 가 그리는 수치를 가린다(숫자 → #, 사용률 막대 █░ → <bar>. 실제 사용량이라 실행마다 바뀐다). 칸 제목과 선택지 줄의 c1 · c2 는 남긴다.
ug(){ python3 -c 'import sys,re
for l in sys.stdin.read().split("\n"):
    print(re.sub(r"[\u2588\u2591]+", "<bar>", re.sub(r"(?<![c])\d+(\.\d+)?", "#", l)))' }
# resp: 화면의 명령 응답 줄(마지막 n 개)
resp(){ cap | grep -o '⎿  pane-grid: .*' | sed -E 's/ *│.*$//; s/ +$//' | tail -${1:-1} }
mark(){ M=$(wc -l < $TL 2>/dev/null || print 0) }
# since <정규식>: mark 뒤 log 에 생긴 줄 중 맞는 것의 본문
since(){ tail -n +$((M+1)) $TL | grep -o -E "$1" }
newtoast(){ since '\$.ui.toast \(pane-grid\): .*' }
nfail(){ grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $TL }
o(){ print -r -- "$*" >> $OUT/$ID.txt }
row(){ ID=$1; : > $OUT/$ID.txt }
SN=0
# start: 앞 세션의 log 를 t-<번호>.log 로 남기고 새 세션을 띄운다.
start(){ T kill-server 2>/dev/null; SN=$((SN+1)); [ -f $TL ] && mv $TL $LOG/t-prev-$SN.log; up t $PROJ $REPO "$@"; }
# want <세션 번호>: ONLY 가 비었거나 그 번호를 담으면 참
want(){ [ -z "$ONLY" ] || [[ " $ONLY " == *" $1 "* ]] }
# fdate: filetree 의 수정 시각 열(실행마다 다르다)을 가린다
fdate(){ sed -E 's/[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}/YYYY-MM-DD hh:mm/g' }
# 탭 줄: grid pane 첫 줄의 탭 이름들(✕ 앞)
tabs1(){ rp | head -1 | sed -E 's/✕$//; s/ +$//; s/^ +//' }
# kb: hotkey 줄 오른쪽 끝 빈 자리를 눌러 pane 에 키보드를 준다(record.py:336-349)
kb(){ set -- $(loc 'k: close tab q: list'); click 165 $2 }
title_rows(){ rp | python3 -c 'import sys,re
for n,l in enumerate(sys.stdin.read().split("\n")):
    for m in re.finditer(r"c[0-9]+ (-|[a-z][a-z0-9_.-]*)", l):
        print(f"row={n+1} col={m.start()+1} {m.group(0)}")' }

# eng: mark 뒤 엔진이 낸 ui.scroll 줄의 by 값. 휠 · 페이지 키가 전달됐는지를 행 파일에 남긴다.
eng(){ o "engine: $(since 'ui.scroll Pane grid-main \(person\) by -?[0-9]+' | sed 's/.* by /by /' | tr '\n' ' ')" }
mkdir -p $OUT; [ -z "$ONLY" ] && rm -f $OUT/*.txt(N)
setup
SHA0=$(shasum -a 256 /Users/uhd/.claude/pane-grid/layout.json)

if want 1; then
############ 세션 1: pane-grid 만, F2 → T59a, T59b
reset $F2; start
say '/grid reload'; say '/grid new'; sleep 1
row T59a
say '/grid select main'; say '/grid zoom'; sleep 1
o "zoom resp: $(resp)"; o "tabs: $(tabs1)"
say '/grid zoom'; sleep 1
o "unzoom resp: $(resp)"; o "tabs: $(tabs1)"
o "failed=$(nfail)"

row T59b
set -- $(loc ' w2 '); click $(($1+1)) $2; sleep 2
o "after click w2 tabs: $(tabs1)"
say '/grid list'; o "list: $(resp)"; o "     $(cap | grep -A1 '⎿  pane-grid: ' | tail -1 | sed -E 's/ *│.*$//; s/^ +//')"
set -- $(loc ' main '); click $(($1+1)) $2; sleep 2
o "after click main tabs: $(tabs1)"
say '/grid list'; o "list: $(resp)"; o "     $(cap | grep -A1 '⎿  pane-grid: ' | tail -1 | sed -E 's/ *│.*$//; s/^ +//')"
o "failed=$(nfail)"
down

fi
if want 2; then
############ 세션 2: pane-grid 다음 pending-questions → T59c
reset $F2; start $PQ
row T59c
o "tabs before: $(tabs1)"
o "built: $(grep -o 'built for [a-z,-]*' $TL | head -1)"
say '/grid list'; o "list: $(resp)"
o "failed=$(nfail)"
down

fi
if want 3; then
############ 세션 3: usage-gauge, pending-questions → T60, T61, T63, T62
reset $F2; start $UG $PQ
say '/grid select main'; sleep 1
row T60; rp | sed -n '2,12p' >> $OUT/T60.txt; o "failed=$(nfail)"
row T61
kb; mark; key 2; sleep 1
o "toast: $(newtoast)"; rp | sed -n '6,12p' | ug >> $OUT/T61.txt; o "failed=$(nfail)"
row T63
# c2 의 빈 행을 눌러 c2 를 활성으로(T57a 의 방법). 활성이 된 뒤 그 칸의 숫자 키.
set -- $(loc 'c2 -'); mark; click $1 $(($2+6)); o "select: $(since 'pane-grid: action .*')"
rp | sed -n '6,12p' | ug >> $OUT/T63.txt
mark; key 2; sleep 1
o "toast: $(newtoast)"; rp | sed -n '6,12p' | ug >> $OUT/T63.txt; o "failed=$(nfail)"
row T62
# 이제 c1 이 빈 칸이고 비활성이다. c1 안의 `pending-questions` Button 을 두 번 누른다.
set -- $(loc '\│ *pending-questions'); x=$(( $1 + $(cap | sed -n "${2}p" | python3 -c 'import sys;l=sys.stdin.read();i=l.find("│");print(l.find("pending-questions",i)-i)') ))
mark; click $x $2; o "1st press: $(since 'pane-grid: action .*|\$.ui.toast \(pane-grid\): .*' | tr '\n' ' ')"
mark; click $x $2; o "2nd press: $(since 'pane-grid: action .*|\$.ui.toast \(pane-grid\): .*' | tr '\n' ' ')"
rp | sed -n '6,12p' | ug >> $OUT/T62.txt; o "failed=$(nfail)"
down

fi
if want 4; then
############ 세션 4: pane-grid 만 → T64a, T64c, T64d, T64b
reset $F2; start
row T64a
o "before: $(title_rows | tr '\n' ' ')"
set -- $(loc 'c2 -'); drag $(($1-1)) $(($2+5)) -6 0
o "after: $(title_rows | tr '\n' ' ')"; o "file: $(pl)"; o "failed=$(nfail)"
row T64c
say '/grid split -v'; sleep 1; o "resp: $(resp)"
o "before: $(title_rows | tr '\n' ' ')"
set -- $(loc 'c3 -'); drag $(($1+2)) $(($2-1)) 0 3
o "after: $(title_rows | tr '\n' ' ')"; o "file: $(pl)"; o "failed=$(nfail)"
row T64d
# 왼쪽으로 100칸은 SGR 좌표가 0 이하가 되므로 화면 1열까지(dx = 1 - 열) 끈다.
set -- $(loc 'c2 -'); c=$(($1-1)); drag $c $(($2+5)) $((1-c)) 0
o "after: $(title_rows | tr '\n' ' ')"; o "file: $(pl)"; o "failed=$(nfail)"
row T64b
reset $F2; say '/grid reload'; sleep 1; o "reload: $(resp)"
set -- $(loc 'c2 -'); c=$(($1-1)); r=$(($2+5))
mark
T send-keys -t t -l $'\e[<0;'"$c;$r"'M'; sleep 0.4
for k in 1 2 3; do T send-keys -t t -l $'\e[<32;'"$((c-2*k));$r"'M'; sleep 0.35; done
sleep 0.5
o "moving: revision lines=$(since 'layout revision=' | wc -l | tr -d ' ') file=$(ls $(pdir $PROJ) 2>/dev/null | tr '\n' ' ')"
o "moving divider color: $(cape | sed -n "${r}p" | python3 -c 'import sys,re;l=sys.stdin.read();print(sorted(set(re.findall(r"\x1b\[[0-9;]*m(?=│)",l))))')"
T send-keys -t t -l $'\e[<0;'"$((c-6));$r"'m'; sleep 1.5
o "released: file=$(ls $(pdir $PROJ) 2>/dev/null | tr '\n' ' ')"; o "file: $(pl)"
o "after: $(title_rows | tr '\n' ' ')"; o "failed=$(nfail)"
down

fi
if want 5; then
############ 세션 5: 위아래 c1:5 c2:95, 활성 c2, usage-gauge · pending-questions → T65a, T65b, T65c, T65d
FC='{"version":1,"tabs":[{"name":"main","root":{"kind":"column","children":[{"node":{"kind":"cell","id":"c1"},"size":5},{"node":{"kind":"cell","id":"c2"},"size":95}]},"active":"c2"}]}'
reset $FC; start $UG $PQ
say '/grid select main'; sleep 1
row T65a
W(){ wheel "$@"; sleep 0.5; wheel "$@"; sleep 1.2 }   # 같은 자리에 두 번(방향이 바뀐 첫 휠이 전달되지 않을 때를 덮는다)
rp | sed -n '1,10p' >> $OUT/T65a.txt; o "--- wheel down on c1 content"
set -- $(loc 'c1 -'); C1C=$1; C1R=$2
mark; wheel $(($C1C+2)) $(($C1R+1)); sleep 1.2; eng
rp | sed -n '1,10p' >> $OUT/T65a.txt; o "--- wheel up x2"
mark; W $(($C1C+2)) $(($C1R+1)) 64; eng
rp | sed -n '1,10p' >> $OUT/T65a.txt; o "failed=$(nfail)"
row T65b
o "--- wheel down x2 on c1 last row"
mark; W $(($C1C+2)) $(($C1R+1)); eng; rp | sed -n '5,10p' >> $OUT/T65b.txt
o "--- wheel up x2 on c1"
mark; W $(($C1C+2)) $(($C1R+1)) 64; eng
o "--- wheel down x2 on c2 title row"
set -- $(loc 'c2 -'); C2C=$1; C2R=$2
mark; W $(($C2C+2)) $C2R; eng; rp | sed -n '5,12p' >> $OUT/T65b.txt
o "--- wheel up x2 on c2 title row"
mark; W $(($C2C+2)) $C2R 64; eng; rp | sed -n '5,12p' >> $OUT/T65b.txt
o "--- wheel down x2 on each hotkey row"
set -- $(loc 'v: split-h'); mark; W $(($1+2)) $2; W $(($1+2)) $(($2+1)); eng; rp | sed -n '5,12p' >> $OUT/T65b.txt
o "failed=$(nfail)"
row T65c
set -- $(loc 'c1 -'); mark; click $(($1+2)) $2; o "select: $(since 'pane-grid: action .*')"
mark; T send-keys -t t NPage; sleep 1.5
eng  # 시간(ms)과 「without next() N more times」 요약 줄은 실행마다 달라 by 값만 남긴다
rp | sed -n '5,10p' >> $OUT/T65c.txt
mark; T send-keys -t t PPage; sleep 1.5
eng
rp | sed -n '5,10p' >> $OUT/T65c.txt; o "failed=$(nfail)"
row T65d
set -- $(loc 'c1 -'); wheel $(($1+2)) $(($2+1)); sleep 1.2
rp | sed -n '5,8p' >> $OUT/T65d.txt
mark; say '/grid place usage-gauge c1'; sleep 1
o "resp: $(resp)"; o "log: $(since 'pane-grid: scroll reset for .*')"
rp | sed -n '5,8p' | ug >> $OUT/T65d.txt; o "failed=$(nfail)"
down

fi
if want 6; then
############ 세션 6: filetree(포크 pane-grid-cell) → T65e, T102
reset $F2
# filetree 목록이 칸보다 길어야 자기 행 스크롤이 보인다. 파일 40개를 만든다(이름 f01 ~ f40).
for i in {01..40}; do : > $PROJ/f$i.txt; done
start $FT
say '/grid select main'; mark; say '/grid place filetree c2'; sleep 3
row T65e
o "resp: $(resp)"; o "built: $(grep -o 'built for [a-z,-]*' $TL | head -1)"
rp | sed -n '5,16p' | fdate >> $OUT/T65e.txt
set -- $(loc 'c2 filetree'); C2C=$1; C2R=$2
o "--- wheel down x3 on filetree list row"
mark; for k in 1 2 3; do wheel $(($C2C+4)) $(($C2R+10)); done; sleep 1.5; eng
rp | sed -n '5,16p' | fdate >> $OUT/T65e.txt; o "pane-grid scroll lines: $(since 'pane-grid: .*scroll.*' | tr '\n' ' ')"
o "--- wheel down x3 on c2 title row"
mark; for k in 1 2 3; do wheel $(($C2C+4)) $C2R; done; sleep 1.5; eng
rp | sed -n '5,16p' | fdate >> $OUT/T65e.txt; o "pane-grid scroll lines: $(since 'pane-grid: .*scroll.*' | tr '\n' ' ')"
o "scroll failed: $(grep -c 'scroll failed' $TL)"; o "failed=$(nfail)"
row T102
# c1 을 눌러 활성으로 한 뒤 NPage: filetree 칸(c2)이 활성이 아니므로 pane-grid 가 {} 를 반환해야 한다.
set -- $(loc 'c1 -'); mark; click $(($1+4)) $(($2+5)); o "select: $(since 'pane-grid: action .*')"
mark; T send-keys -t t NPage; sleep 1.5; o "--- NPage with c1 active"; eng
rp | sed -n '5,16p' | fdate >> $OUT/T102.txt
# c2 의 제목 행을 눌러 c2 를 활성으로(목록 행을 누르면 filetree 가 그 행을 연다), 이어 NPage.
mark; click $(($C2C+4)) $C2R; o "select: $(since 'pane-grid: action .*')"
mark; T send-keys -t t NPage; sleep 1.5; o "--- NPage with c2(filetree) active"; eng
rp | sed -n '5,16p' | fdate >> $OUT/T102.txt
mark; T send-keys -t t PPage; sleep 1.5; o "--- PPage with c2(filetree) active"; eng
rp | sed -n '5,16p' | fdate >> $OUT/T102.txt
o "failed=$(nfail)"
down

fi
if want 7; then
############ 세션 7: grid-ready mod 열한 개 → T101
MODS=( /Users/uhd/.claude/plugins/cache/claude-code-filetree/filetree/0.9.0
  /Users/uhd/.claude/plugins/cache/claude-code-mods/md-preview/0.1.10
  /Users/uhd/.claude/plugins/cache/claude-flightdeck/flightdeck/0.6.1
  /Users/uhd/.claude/plugins/cache/inbox/inbox/0.3.0
  $PQ
  /Users/uhd/.claude/plugins/cache/skill-kanban/uhd-kanban/0.14.0
  /Users/uhd/.claude/plugins/cache/terminal-browser/terminal-browser/0.0.2
  $UG
  $J/$TREE/verification/r1-order
  $J/$TREE/verification/r2-hidden-tab
  $J/$TREE/verification/harness-probe/snapshot )
reset $F2; rm -f $PROJ/f*.txt; start $MODS; sleep 6
say '/grid select main'; sleep 2
row T101
o "built: $(grep -o 'built for [a-z0-9,-]*' $TL | head -1)"
rp | sed -n '5,20p' >> $OUT/T101.txt; o "failed=$(nfail)"
down
fi
T kill-server 2>/dev/null

SHA1=$(shasum -a 256 /Users/uhd/.claude/pane-grid/layout.json)
print "sha before: $SHA0"; print "sha after:  $SHA1"
