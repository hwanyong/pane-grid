#!/bin/zsh
# build.py 의 render() 를 실패하는 Chrome 으로 돌려 base 와 tgt 의 stderr · 종료 코드 · 남은 파일을 대조한다.
# 사용: zsh buildpy_fail.zsh <TREE> <MODE>
#   TREE: base | tgt (J/<TREE>/docs/images/build.py 를 사본으로 복사해 돌린다. 원본은 고치지 않는다)
#   MODE: fail    = 종료 코드 3, stderr 'fake chrome: GPU init failed'
#         nopng   = 종료 코드 0 인데 PNG 를 만들지 않음
#         missing = CHROME 경로에 실행 파일이 없음
# 지운 것: python traceback 의 사본 경로(W 를 <W> 로 바꾼다).
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
TREE=$1 MODE=$2
W=$J/scratch/bp/$TREE-$MODE
rm -rf $W; mkdir -p $W
case $MODE in
  fail) print -r -- $'#!/bin/sh\necho "fake chrome: GPU init failed" >&2\nexit 3' > $W/chrome ;;
  nopng) print -r -- $'#!/bin/sh\nexit 0' > $W/chrome ;;
  missing) : ;;
esac
[[ -f $W/chrome ]] && chmod +x $W/chrome
sed "s|^CHROME = .*|CHROME = \"$W/chrome\"|" $J/$TREE/docs/images/build.py > $W/build.py
# 이전 산출물: 표식 글자만 든 SVG · PNG
for n in pane-structure pane-lifecycle; do print OLD-SVG > $W/$n.svg; print OLD-PNG > $W/$n.png; done
python3 -I $W/build.py > $W/stdout 2> $W/stderr; code=$?
print "exit=$code"
print -- "--stdout"; sed "s|$W|<W>|g" $W/stdout
print -- "--stderr(last 3)"; sed "s|$W|<W>|g" $W/stderr | tail -3
print -- "--files"
for f in $W/*.svg $W/*.png; do
  c=$(head -c 7 $f)
  print "${f:t} $([[ $c == OLD-* ]] && print old || print new)"
done
