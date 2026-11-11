#!/bin/zsh -f
# compare.zsh <GROUP> [A=base] [B=tgt]: $J/out/<GROUP>/<A>/<id>.txt 와 <B>/<id>.txt 를 행마다 대조한다.
# 출력: 행마다 `<id> SAME` 또는 `<id> DIFF`(이어 diff -u), `<id> MISSING-<트리>`. 마지막 줄 `summary: same=<수> diff=<수> missing=<수>`.
# 종료 코드: 차이나 빠진 행이 있으면 1, 없으면 0.
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
G=$1; A=${2:-base}; B=${3:-tgt}
da=$J/out/$G/$A; db=$J/out/$G/$B
same=0; diff=0; miss=0
ids=( ${(u)$( (cd $da 2>/dev/null && ls *.txt; cd $db 2>/dev/null && ls *.txt) | sed 's/\.txt$//' | sort -V )} )
for id in $ids; do
  if [ ! -f $da/$id.txt ]; then print "$id MISSING-$A"; miss=$((miss+1)); continue; fi
  if [ ! -f $db/$id.txt ]; then print "$id MISSING-$B"; miss=$((miss+1)); continue; fi
  if cmp -s $da/$id.txt $db/$id.txt; then print "$id SAME"; same=$((same+1))
  else print "$id DIFF"; diff -u --label $A/$id --label $B/$id $da/$id.txt $db/$id.txt | sed 's/^/    /'; diff=$((diff+1)); fi
done
print "summary: same=$same diff=$diff missing=$miss"
[ $diff -eq 0 -a $miss -eq 0 ]
