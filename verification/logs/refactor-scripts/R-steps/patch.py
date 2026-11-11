#!/usr/bin/env python3 -I
# patch.py <원본 트리> <사본 폴더> <mode ...>: 트리를 사본으로 복사하고 hooks/register.tsx 에 시험용 지연 · log 를 넣는다.
# 원본(/Users/uhd/.claude/jobs/2d2d4469/tmp/base · tgt)은 고치지 않는다. 바꿀 자리를 못 찾으면 종료 코드 1 로 끝난다.
#   delay47: loadFile 의 파일 읽기 앞에 `await $.clock.sleep(3000)` (F47 결함 창을 3초로 넓힌다. base · tgt 같은 줄)
#   log51:   activateCell 이 focus 할 탭을 고른 값(탭 이름 목록)을 debug log 에 `F51probe` 로 적는다
import shutil, sys

src, dst, *modes = sys.argv[1:]
shutil.copytree(src, dst, ignore=shutil.ignore_patterns('node_modules'))
p = f'{dst}/hooks/register.tsx'
s = open(p).read()

def sub(old, new):
    global s
    if s.count(old) != 1:
        print(f'patch.py: {old!r} found {s.count(old)} times in {p}', file=sys.stderr)
        sys.exit(1)
    s = s.replace(old, new)

for mode in modes:
    if mode == 'delay47':
        sub('  const text = await $.fs.read(path)\n', '  await $.clock.sleep(3000)\n  const text = await $.fs.read(path)\n')
    elif mode == 'log51':
        if 'const { tabs } = await runAction($, [\'select-cell\', id], tabName)' in s:
            sub("  const tab = tabs.find(item => item.name == tabName)\n  if (tab) await $.ui.open",
                "  const tab = tabs.find(item => item.name == tabName)\n  log($, `F51probe tabs=${tabs.map(item => item.name).join(',')}`)\n  if (tab) await $.ui.open")
        else:
            sub("  const layout = await readLayout($)\n  const tab = layout?.tabs.find(item => item.name == tabName)\n  if (tab) await $.ui.open",
                "  const layout = await readLayout($)\n  const tab = layout?.tabs.find(item => item.name == tabName)\n  log($, `F51probe tabs=${(layout?.tabs ?? []).map(item => item.name).join(',')}`)\n  if (tab) await $.ui.open")
    else:
        print(f'patch.py: unknown mode {mode}', file=sys.stderr)
        sys.exit(1)
open(p, 'w').write(s)
