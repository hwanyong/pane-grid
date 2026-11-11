#!/bin/zsh -f
# T116 ①: tgt 의 ui.press element matcher(PRESS_KEY, hooks/render-keys.ts)를 tsx 로 import 해 RegExp 의 source · flags 를 찍고,
# base 의 정규식 리터럴(/^(place|hotkey):/, base hooks/register.tsx:455)과 같은 문자열 여덟 개에 대한 test 결과를 나란히 낸다.
# 사용: zsh C1-T116re.zsh → $J/out/C1/T116-regex.txt (tsx 가 낸 npm notice 줄은 버린다)
J=/Users/uhd/.claude/jobs/2d2d4469/tmp
mkdir -p $J/run/C1re && cd $J/run/C1re
npx -y tsx -e "import('$J/tgt/hooks/render-keys.ts').then(m=>{const r=m.PRESS_KEY; const b=/^(place|hotkey):/;
console.log('tgt PRESS_KEY source='+JSON.stringify(r.source)+' flags='+JSON.stringify(r.flags)+' instanceof RegExp='+(r instanceof RegExp));
console.log('base literal source='+JSON.stringify(b.source)+' flags='+JSON.stringify(b.flags));
for (const s of ['place:c1:usage-gauge','hotkey:v','hotkey:q','activate:c1','divider:0:0','measure:main','mode','q1','choices:c1','xplace:c1']) console.log(s.padEnd(22)+' tgt='+r.test(s)+' base='+b.test(s))})" 2>&1 | grep -v '^npm notice' > $J/out/C1/T116-regex.txt
cat $J/out/C1/T116-regex.txt
