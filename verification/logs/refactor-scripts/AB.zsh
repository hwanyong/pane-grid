#!/bin/zsh -f
# 묶음 AB: k10 4절 §2 A · B 의 claude -p 행(T1~T34, T36~T56, T94~T99, T112, T113).
# 사용: zsh AB.zsh <TREE>   (TREE = base | tgt | broke 등. lib.zsh 의 REPO=$J/$TREE)
# 행마다 $OUT/<id>.txt 에 명령 응답 · 뒤따르는 list · 프로젝트 파일 · log 의 refused/kept/command failed 줄 · 실패 hook 수를 쓴다.
# 정규화(지운 것): plog 가 log 줄의 시각 머리말을 지운다. 그 밖의 시각 · pid · 토큰 수는 출력에 나오지 않는다.
#   g 의 출력에서 `[mcp-sdk] SEP-` 줄은 lib 의 g 가 지운다(엔진 경고, pane-grid 와 무관).
#   JOB 경로는 base · tgt 가 같으므로 경로 · hash 는 지우지 않았다.
# 행 T97 은 도달 방법을 찾지 못해 파일을 쓰지 않는다(실행하지 못함).
TREE=${1:?TREE}
GROUP=AB; source /Users/uhd/.claude/jobs/2d2d4469/tmp/lib.zsh
setup
rm -f $OUT/*.txt(N)
# claude 의 --debug-file 은 덮어쓰지 않고 덧붙인다(2026-11-11 base 첫 실행에서 p-N.log 가 앞 실행의 줄을 담았다).
# 행마다 그 실행의 log 만 보도록 lib 의 g 를 같은 본문에 「p.log 지우기」만 더해 다시 정의한다.
g(){ GN=$((GN+1)); rm -f $LOG/p.log; (cd ${DIR:-$PROJ} && env -u CLAUDE_CONFIG_DIR -u CLAUDECODE HOME=$H claude -p "/grid $*" --plugin-dir $REPO --debug-file $LOG/p.log 2>&1 | grep -v 'mcp-sdk\] SEP-'); cp $LOG/p.log $LOG/p-$GN.log 2>/dev/null }

# row <id>: 이후 출력을 $OUT/<id>.txt 로. 행이 시작할 때의 GN 을 적어 둔다.
ROWSTART=0; CUR=""
row(){ CUR=$1; ROWSTART=$GN; : > $OUT/$1.txt; print "== $1" }
w(){ print -r -- "$*" >> $OUT/$CUR.txt }
# r <인자...>: g 를 부르고 명령과 응답을 행 파일에 적는다.
r(){ w "\$ g $*"; g "$@" >> $OUT/$CUR.txt 2>&1; w "[exit-ish done]" }
# 이 행에서 부른 g 의 log 만으로 실패 hook 수를 센다.
rowfail(){ local n=0 i; for ((i=ROWSTART+1; i<=GN; i++)); do
    [ -f $LOG/p-$i.log ] && n=$((n + $(grep -c -E 'hook skipped|(command|scroll|press|message|render) failed' $LOG/p-$i.log))); done; print $n }
# 이 행의 log 에서 pane-grid 의 refused · kept · command failed 줄(시각 머리말 제거)
rowlog(){ local i; for ((i=ROWSTART+1; i<=GN; i++)); do
    [ -f $LOG/p-$i.log ] && grep -E 'refused|kept the invalid|command failed' $LOG/p-$i.log | sed -E 's/^[0-9TZ:.-]+ //' | sed "s/^/[p$((i-ROWSTART))] /"; done }
fin(){ w "--- pl"; pl >> $OUT/$CUR.txt; w ""; w "--- log refused|kept|command failed"; rowlog >> $OUT/$CUR.txt; w "--- failed=$(rowfail)" }
lsp(){ w "--- ls $1"; ls $(pdir $PROJ) >> $OUT/$CUR.txt 2>&1 }

# ---------- A ----------
row T1;  reset $F2; r split -h; r list; fin
row T2;  reset $F2; r split -v; r list; fin
row T3;  reset $F2; r split -h usage-gauge; r list; fin
row T4;  r split -v usage-gauge; r list; fin                       # T3 뒤
row T112; r resize 30; r list; fin                                 # T4 뒤 (B 행이지만 준비가 T4 뒤)
row T5;  reset $F2; r kill; r list; fin
row T6;  reset $F2; r next; r list; r next; fin
row T7;  reset $F2; r select-cell c2; r list; fin
row T8;  reset $F2; r place usage-gauge; r list; fin
row T10; r place -; r list; fin                                    # T8 뒤
row T54; reset $F2; r place usage-gauge; w "(준비: T8 상태)"; ROWSTART=$GN; r place usage-gauge c2; r list; fin
row T9;  reset $F2; r place usage-gauge c2; r list; fin
row T11; r select-cell c1; ROWSTART=$GN; r place - c2; r list; fin   # T9 뒤 select-cell c1
row T12; reset $F2; r swap; r list; fin
row T13; reset $F2; r split -h; ROWSTART=$GN; r swap c1; r list; fin  # T1 뒤
row T14; reset $F2; r zoom; r list; r zoom; r list; fin
row T15; reset $F2; r zoom; ROWSTART=$GN; r next; fin                 # T14 의 첫 zoom 뒤
row T16; reset $F2; r resize 35; r list; fin
row T17; reset $F2; r split -h; ROWSTART=$GN; r resize 99; r list; fin  # T1 뒤
row T18; reset $F2; r split -h; ROWSTART=$GN; r layout even-horizontal; r list; fin
row T19; r layout even-vertical; r list; fin
row T20; r layout main-vertical; r list; fin
row T21; r layout main-horizontal; r list; fin
row T22; r layout tiled; r list; fin
row T23; r zoom; ROWSTART=$GN; r layout tiled; r list; fin
row T24; reset $F2; r new; r list; fin
row T25; r new notes; r list; fin                                    # T24 뒤
row T26; reset $F2; r new; ROWSTART=$GN; w "--- pl before"; pl >> $OUT/$CUR.txt; w ""; r select w2; r list; fin   # T24 뒤
row T96; reset $F2; r new; ROWSTART=$GN; r place usage-gauge c3; r select-cell c3; r list; fin   # T24 뒤
row T28; reset $F2; r new; ROWSTART=$GN; r close; r list; fin        # T24 뒤
row T27; reset $F2; r rename work; r list; fin
row T29; reset $F2; r break; r list; fin
row T30; reset $F2; r list; w "--- ls"; ls $H/.claude/pane-grid >> $OUT/$CUR.txt 2>&1; fin
row T31; reset $F2; r reload; fin
row T32; reset $F2; r split -h; ROWSTART=$GN; r reload; w "--- pdir"; print -r -- ${$(pdir $PROJ):t} >> $OUT/$CUR.txt; fin
row T33; reset $F2; r split -h; print -r -- "$F1" > $(pdir $PROJ)/layout.json; ROWSTART=$GN; r list; fin
row T34; reset $F2; r help; fin

# ---------- B ----------  (행마다 실행 전후 ls $(pdir $PROJ))
b(){ lsp before; "$@"; lsp after }
row T36; reset $F2; b r ""; fin
row T37; reset $F2; b r foo; fin
row T38; reset $F2; b eval 'r split; r split usage-gauge; r split -x'; fin
row T39; reset $F2; b r select-cell c9; fin
row T40; reset $F2; b r select-cell; fin
row T41; reset $F2; b r place usage-gauge c9; fin
row T42; reset $F2; b r place; fin
row T43; reset $F2; b eval 'r swap c9; r swap c1'; fin
row T44; reset $F2; b eval 'r resize 0; r resize 100; r resize abc; r resize 35.5; r resize'; fin
row T45; reset $F2; b eval 'r layout grid; r layout'; fin
row T46; reset $F2; b r new main; fin
row T47; reset $F2; b eval "r new 'Bad!'; r new -x; r new aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; fin
row T48; reset $F2; b eval "r rename; r rename main; r rename 'A b'"; fin
row T49; reset $F1; b r kill; fin
row T50; reset $F1; b r close; fin
row T51; reset $F1; b r break; fin
row T52; reset $F1; b r swap; fin
row T53; reset $F2; b eval 'r select zz; r select'; fin
row T55; reset '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1","plugin":"usage-gauge"},"size":50},{"node":{"kind":"cell","id":"c2","plugin":"usage-gauge"},"size":50}]},"active":"c1"}]}'; b r list; fin
row T56; reset $F1; b eval 'r resize 50; r layout tiled; r list'; fin
row T94; reset $F2; b eval 'r place Foo; r list'; fin
row T95; reset $F2; r place usage-gauge; r break; ROWSTART=$GN; b eval 'r place usage-gauge; r list'; fin
# T98: base 에서 checkOutcome 의 세 이유에 도달하는 입력은 코드에서 찾지 못했다. 같은 거부 분기를 place 가 아닌 split 으로 부른다.
row T98; reset $F2; b eval 'r split -h Foo; r list'; fin
# T99: command.run 이 throw 하게 한다. pane-grid 디렉터리를 쓰기 금지(555)로 두면 프로젝트 파일 쓰기가 EACCES 로 실패한다.
row T99; reset $F2; chmod 555 $H/.claude/pane-grid; b eval 'r split -h'; chmod 755 $H/.claude/pane-grid; r list; fin
row T113; reset $F2; r zoom; r split -h; r list; reset $F2; r zoom; r place usage-gauge; r swap; r resize 30; r list; fin

T kill-server 2>/dev/null
print "done $TREE GN=$GN total-failed=$(failed)"
