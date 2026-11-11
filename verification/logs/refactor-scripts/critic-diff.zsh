#!/bin/zsh
# 완결성 비평: base 와 tgt 의 증거 파일 바이트가 다른 id 를 낸다. 읽기만 한다.
cd /Users/uhd/.claude/jobs/2d2d4469/tmp/out || exit 1
for grp in AB C1 C2 D E F R X; do
  for f in $grp/base/*.txt; do
    n=${f:t}
    if [[ ! -f $grp/tgt/$n ]]; then echo "ONLYBASE $grp $n"; continue; fi
    cmp -s $f $grp/tgt/$n || echo "DIFF $grp ${n%.txt}"
  done
  for f in $grp/tgt/*.txt; do
    n=${f:t}
    [[ -f $grp/base/$n ]] || echo "ONLYTGT $grp $n"
  done
done
