#!/bin/zsh -f
# 묶음 F(정적 확인과 외부 계약). 세션을 띄우지 않는다.
# 사용: zsh F.zsh <TREE>   (TREE = base | tgt | broke ... ; $J/<TREE> 의 트리를 읽는다)
# 행: T107 tsc · T108 plugin validate · T108p ui.press element matcher 를 같은 입력 12개로 실행 · T109 pane-grid.ts export · T110 두 파일의 상수 값 · T111 types/index.d.ts
#     F71 build.py 정상 실행 뒤 git status · F71s 만든 그림의 sha256 · F71f Chrome 이 0 이 아닌 코드로 끝날 때 · F71m Chrome 실행 파일이 없을 때
# 정규화(지운 것):
#   - 모든 출력에서 트리 경로($J/<TREE>, $RUN)를 <ROOT> 로, 임시 profile 경로(/var/folders/...)를 <TMP> 로 바꾼다.
#   - T107: npx 가 내는 `npm notice` 줄을 지운다(npm 판에 따라 바뀐다).
#   - T108: 바꾸는 것은 경로뿐이다.
#   - F71f: 가짜 Chrome 의 stderr 에 든 임시 profile 디렉터리 이름(tmpXXXX)을 <TMPDIR> 로, traceback 의 줄 번호를 <N> 으로 바꾼다.
#   - F71: build.py 가 print 하는 PNG 경로는 <ROOT> 로 바꾼 뒤 남긴다. F71s 에 SVG · PNG 의 sha256 을 따로 남긴다.
# 증거 원문(정규화 전)은 $OUT/notes/ 에 둔다. compare.zsh 는 $OUT/*.txt 만 대조한다.
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
TREE=${1:?TREE}
SRC=$J/$TREE
OUT=$J/out/F/$TREE
RUN=$J/run/F/$TREE
[ -d $SRC ] || { print "no tree $SRC"; exit 2 }
rm -rf $OUT $RUN $RUN-fail $RUN-miss
mkdir -p $OUT/notes $RUN
cp -R $SRC/. $RUN/

norm(){ sed -e "s|$RUN-fail|<ROOT>|g" -e "s|$RUN-miss|<ROOT>|g" -e "s|$RUN|<ROOT>|g" -e "s|$SRC|<ROOT>|g" -e 's|/var/folders/[^ ]*|<TMP>|g' -e 's|/private/var/folders/[^ ]*|<TMP>|g' }

# ---- T107: tsc
( cd $RUN && npx -y -p typescript tsc -p . ) > $OUT/notes/T107.raw 2>&1; rc=$?
{ grep -v '^npm notice' $OUT/notes/T107.raw | norm; print "exit $rc" } > $OUT/T107.txt

# ---- T108: claude plugin validate
claude plugin validate $RUN > $OUT/notes/T108.raw 2>&1; rc=$?
{ norm < $OUT/notes/T108.raw; print "exit $rc" } > $OUT/T108.txt

# ---- probe 준비: claude-code 런타임 stub(update 만 쓴다). 사본($RUN) 안에만 만든다.
mkdir -p $RUN/node_modules/claude-code $RUN/probe
print '{"name":"claude-code","type":"module","main":"index.js"}' > $RUN/node_modules/claude-code/package.json
cat > $RUN/node_modules/claude-code/index.js <<'EOF'
export const update = async ($, key, fn) => { ($.__calls ??= []).push(key); return fn(undefined) }
EOF

# ---- T109: pane-grid.ts 의 export. 선언 줄(텍스트)과 실행해서 얻은 이름 · 종류 · 값
cat > $RUN/probe/t109.mts <<'EOF'
const m: Record<string, unknown> = await import('../skills/add-pane-grid-cell/pane-grid.ts')
for (const k of Object.keys(m).sort()) {
  const v = m[k]
  if (typeof v == 'function') console.log(`${k}: ${(v as Function).constructor.name} length=${(v as Function).length}`)
  else console.log(`${k}: ${typeof v} ${JSON.stringify(v)}`)
}
EOF
{
  print '# declaration lines (grep ^export)'
  grep '^export' $RUN/skills/add-pane-grid-cell/pane-grid.ts
  print '# runtime exports (tsx)'
  ( cd $RUN && npx -y tsx probe/t109.mts 2>&1 ) | grep -v '^npm notice' | norm
} > $OUT/T109.txt

# ---- T110: hooks 쪽과 pane-grid.ts 쪽이 쓰는 상수 값. 사본에 probe export 를 덧붙여 실행한다.
names=(LAYOUT SCROLL SHOWN CELL_KEY SLOT_KEY CHOICES_KEY ACTIVE_SUFFIX NONE_KEY PLACE_KEY HOTKEY_KEY ACTIVATE_KEY DIVIDER_KEY MEASURE_KEY CHOICE_HOTKEYS SCROLLS_KEY GRID_LAYOUT GRID_SHOWN GRID_VERSION)
probe_obj(){ local s='{'; for n in $names; do s+=" $n: typeof $n == 'undefined' ? '<none>' : $n,"; done; print -- "$s }" }
cp $RUN/hooks/register.tsx $RUN/hooks/register.probe.tsx
cat >> $RUN/hooks/register.probe.tsx <<EOF

export const __probe = $(probe_obj)
export const __publish = async () => {
  const \$: any = { state: { get: async () => ({ value: undefined }) }, ui: { log: async () => {} } }
  const layout: any = await publish(\$, [{ name: 'main', root: { kind: 'cell', id: 'c1' }, active: 'c1' }] as any)
  return { version: layout.version, key: \$.__calls?.at(-1) }
}
EOF
cp $RUN/skills/add-pane-grid-cell/pane-grid.ts $RUN/skills/add-pane-grid-cell/pane-grid.probe.ts
print "\nexport const __probe = $(probe_obj)" >> $RUN/skills/add-pane-grid-cell/pane-grid.probe.ts
cat > $RUN/probe/t110.mts <<'EOF'
const reg: any = await import('../hooks/register.probe.tsx')
let rk: any = {}
try { rk = await import('../hooks/render-keys.ts') } catch { rk = {} }
const pg: any = (await import('../skills/add-pane-grid-cell/pane-grid.probe.ts')).__probe
const hooksSide = (n: string) => reg.__probe[n] !== '<none>' ? reg.__probe[n] : (n in rk ? rk[n] : '<none>')
const show = (v: unknown) => JSON.stringify(v)
// 개념 이름 -> [hooks 쪽 이름, pane-grid.ts 쪽 이름]
const pairs: [string, string, string][] = [
  ['state layout', 'LAYOUT', 'GRID_LAYOUT'], ['state shown', 'SHOWN', 'GRID_SHOWN'], ['state scroll', 'SCROLL', '-'],
  ['slot:', 'SLOT_KEY', 'SLOT_KEY'], ['choices:', 'CHOICES_KEY', 'CHOICES_KEY'], [':active', 'ACTIVE_SUFFIX', 'ACTIVE_SUFFIX'],
  ['none:', 'NONE_KEY', 'NONE_KEY'], ['place:', 'PLACE_KEY', 'PLACE_KEY'], ['choice hotkeys', 'CHOICE_HOTKEYS', 'CHOICE_HOTKEYS'],
  ['cell:', 'CELL_KEY', 'CELL_KEY'], ['scrolls:', 'SCROLLS_KEY', 'SCROLLS_KEY'], ['hotkey:', 'HOTKEY_KEY', 'HOTKEY_KEY'],
  ['activate:', 'ACTIVATE_KEY', 'ACTIVATE_KEY'], ['divider:', 'DIVIDER_KEY', 'DIVIDER_KEY'], ['measure:', 'MEASURE_KEY', 'MEASURE_KEY'],
]
for (const [c, h, p] of pairs) {
  const hv = hooksSide(h), pv = p == '-' ? '<none>' : (pg[p] ?? '<none>')
  const tag = hv === '<none>' ? 'pane-grid.ts only' : pv === '<none>' ? 'hooks only' : (show(hv) == show(pv) ? 'both equal' : 'both DIFFER')
  console.log(`${c}: hooks=${show(hv)} pane-grid.ts=${show(pv)} -> ${tag}`)
}
const { version: v, key } = await reg.__publish()
console.log(`layout.version written by publish: ${show(v)} (update key ${show(key)}); pane-grid.ts GRID_VERSION=${show(pg.GRID_VERSION)} -> ${show(v) == show(pg.GRID_VERSION) ? 'equal' : 'DIFFER'}`)
// ui.press matcher: base 는 리터럴, tgt 는 PRESS_KEY. 같은 입력에서 같은 판정인지 실행으로 본다.
EOF
{
  ( cd $RUN && npx -y tsx probe/t110.mts 2>&1 ) | grep -v '^npm notice' | norm
  print -n 'register.tsx draws key `cellbox:` : '; grep -c '`cellbox:' $RUN/hooks/register.tsx
} > $OUT/T110.txt

# T110 보조: ui.press 의 element matcher 를 같은 입력으로 실행해 본다(validate 출력의 element=? 차이 확인용).
cat > $RUN/probe/press.mts <<'EOF'
import { readFileSync } from 'node:fs'
const src = readFileSync('hooks/register.tsx', 'utf8')
const line = src.split('\n').find(l => l.includes("on('ui.press'")) ?? ''
const lit = line.match(/element: \/([^,]*)\/([a-z]*)/)
let re: RegExp
if (lit) re = new RegExp(lit[1]!, lit[2])
else re = (await import('../hooks/render-keys.ts')).PRESS_KEY
for (const s of ['place:c1:usage-gauge', 'hotkey:v', 'place', 'placed:x', 'hotkey', 'xhotkey:v', 'activate:c1', 'divider:0:1', 'measure:main', 'slot:x', 'choices:c1', 'Place:c1'])
  console.log(`${JSON.stringify(s)} -> ${re.test(s)}`)
EOF
grep "on('ui.press'" $RUN/hooks/register.tsx > $OUT/notes/T108-press-source.txt
( cd $RUN && npx -y tsx probe/press.mts 2>&1 ) | grep -v '^npm notice' | norm > $OUT/T108p.txt

# ---- T111: types/index.d.ts 의 선언(주석 줄 제외)과 hooks 의 import 형태
{
  print '# types/index.d.ts without comment lines'
  grep -v '^ *//' $RUN/types/index.d.ts | grep -v '^$'
  print '# export type names'
  grep -o '^export type [A-Za-z]*' $RUN/types/index.d.ts | sed 's/export type //'
  print '# imports of types/index.d.ts in hooks that are not `import type`'
  grep -h "index.d.ts'" $RUN/hooks/*.ts $RUN/hooks/*.tsx | grep -vc '^import type '
} > $OUT/T111.txt
grep -n "index.d.ts'" $RUN/hooks/*.ts $RUN/hooks/*.tsx | norm > $OUT/notes/T111-imports.txt

# ---- F71: 사본을 git init · 첫 커밋한 뒤 build.py 를 실제 Chrome 으로 돌리고 docs/images 의 git status 를 본다.
rm -rf $RUN/node_modules $RUN/probe $RUN/hooks/register.probe.tsx $RUN/skills/add-pane-grid-cell/pane-grid.probe.ts
cp -R $RUN $RUN-fail; cp -R $RUN $RUN-miss
gitinit(){ ( cd $1 && git init -q && git add -A && git -c user.name=k12 -c user.email=k12@localhost commit -qm base ) }
gitinit $RUN
( cd $RUN && python3 docs/images/build.py ) > $OUT/notes/F71.raw 2>&1; rc=$?
{
  norm < $OUT/notes/F71.raw; print "exit $rc"
  print '# git status --short docs/images'; ( cd $RUN && git status --short docs/images )
} > $OUT/F71.txt
# F71s: 만든 SVG · PNG 두 장씩의 sha256(트리 사이 그림 바이트 대조)
( cd $RUN/docs/images && shasum -a 256 pane-structure.svg pane-lifecycle.svg pane-structure.png pane-lifecycle.png ) > $OUT/F71s.txt

# F71f: CHROME 을 stderr 를 쓰고 exit 21 로 끝나는 가짜 실행 파일로 바꾼 사본(k10 F71 재현 절차와 같다).
# build.py 에는 CHROME 을 바꾸는 환경 변수 · 인자가 없으므로(14줄 상수) 사본의 build.py 한 줄을 sed 로 바꾼다.
FAKE=$J/run/F/fakechrome; print '#!/bin/sh\necho "FAKE-CHROME-STDERR: $*" | sed "s|/[^ ]*/|<P>/|g" >&2\nexit 21' > $FAKE; chmod +x $FAKE
failcase(){ # $1 사본 $2 CHROME 값 $3 id
  sed -i '' "s|^CHROME = .*|CHROME = \"$2\"|" $1/docs/images/build.py
  gitinit $1
  ( cd $1 && python3 docs/images/build.py ) > $OUT/notes/$3.raw 2>&1; rc=$?
  { norm < $OUT/notes/$3.raw | sed -e "s|$FAKE|<FAKE>|g" -e "s|<P>/tmp[a-z0-9_]*|<P>/<TMPDIR>|g" -e 's|line [0-9]*|line <N>|g'; print "exit $rc"
    print '# git status --short docs/images'; ( cd $1 && git status --short docs/images ) } > $OUT/$3.txt
}
failcase $RUN-fail $FAKE F71f
failcase $RUN-miss /nonexistent/chrome F71m
print "done $TREE"
