#!/bin/zsh -f
# norm-bar.zsh <묶음> <A> <B> <id...>: usage-gauge 막대 자리 정규화 뒤 대조. 막대 문자(<bar>, █, ░)와 그 사이의 │ 를 한 토큰으로 접는다.
# 이유: 막대는 실제 사용량을 그려서 실행 시각에 따라 너비가 0 이 되기도 한다(그때 <bar> 하나가 사라진다).
J=/Users/uhd/.claude/jobs/2d2d4469/tmp; G=$1 A=$2 B=$3; shift 3
n(){ python3 -c 'import re,sys
for l in open(sys.argv[1]):
    l=re.sub(r"[█░]+","<bar>",l)
    l=re.sub(r"(<bar>|│)*<bar>(<bar>|│)*","<BARS>",l)
    print(l,end="")' $1 }
for id in "$@"; do
  if diff <(n $J/out/$G/$A/$id.txt) <(n $J/out/$G/$B/$id.txt) > /dev/null; then print "$id SAME-after-bar-norm"; else print "$id DIFF-after-bar-norm"; diff <(n $J/out/$G/$A/$id.txt) <(n $J/out/$G/$B/$id.txt) | head -20 | sed 's/^/    /'; fi
done
