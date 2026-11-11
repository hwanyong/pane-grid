// 비교용 임시 스크립트(시험 파일 아님): `g` 한 번(프로세스 하나)을 흉내 낸다. 파일을 읽어(parseLayoutFile) apply · checkOutcome 뒤
// isChanged 면 serializeLayoutFile 로 쓴다. register.tsx 의 act 와 같은 차례. 출력은 명령 응답과 파일을 썼는지.
const J = '/Users/uhd/.claude/jobs/2d2d4469/tmp'
const load = async (tree: string) => ({ a: await import(`${J}/${tree}/hooks/actions.ts`), l: await import(`${J}/${tree}/hooks/layout-file.ts`) })
const M = { base: await load('base'), tgt: await load('tgt') }
const F1 = '{"version":1,"tabs":[{"name":"main","root":{"kind":"cell","id":"c1"},"active":"c1"}]}'
const F2 = '{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":50},{"node":{"kind":"cell","id":"c2"},"size":50}]},"active":"c1"}]}'
const run = (m: any, global: string, steps: string[]) => {
  let file: string | undefined
  const lines: string[] = []
  for (const step of steps) {
    const parsed = m.l.parseLayoutFile(file ?? global)
    const tabs = parsed.isValid ? parsed.tabs : m.l.defaultTabs()
    const out = m.a.apply(tabs, tabs[0].name, step.split(' ').filter(Boolean))
    const broken = m.a.checkOutcome(out)
    if (broken) { lines.push(`${step} => refused: ${broken}`); continue }
    if (out.isChanged) file = m.l.serializeLayoutFile(out.tabs, '/p')
    lines.push(`${step} => ${out.text.split('\n')[0]} [${out.isChanged ? 'write' : 'nowrite'}]`)
  }
  lines.push(`file: ${file ? JSON.stringify(JSON.parse(file).tabs) : 'NOFILE'}`)
  return lines.join('\n  ')
}
const cases: [string, string, string[]][] = [
  ['T56', F1, ['resize 50', 'layout tiled', 'list']],
  ['F2 layout even-horizontal', F2, ['layout even-horizontal', 'list']],
  ['F1 next', F1, ['next', 'list']],
  ['F2 select-cell c1', F2, ['select-cell c1', 'list']],
  ['F2 resize 50', F2, ['resize 50', 'list']],
  ['F2 place ug twice', F2, ['place usage-gauge', 'place usage-gauge', 'list']],
  ['F2 place - on empty', F2, ['place -', 'list']],
  ['zoom place other', F2, ['zoom', 'place usage-gauge c2', 'list']],
  ['zoom place - other', F2, ['zoom', 'place - c2', 'list']],
  ['T113b', F2, ['zoom', 'place usage-gauge', 'swap', 'resize 30', 'list']],
  ['split -h Foo', F2, ['split -h Foo', 'list']],
  ['split -v Bad.Name', F2, ['split -v A', 'list']],
  ['place Foo c2', F2, ['place Foo c2', 'list']],
  ['T17', F2, ['split -h', 'resize 99', 'list', 'list']],
  ['kill nested', F2, ['select-cell c2', 'split -v', 'select-cell c3', 'kill', 'list']],
  ['break nested', F2, ['select-cell c2', 'split -v', 'break', 'list']],
  ['kill first', F2, ['kill', 'list']],
  ['help', F2, ['help']],
  ['resize bad', F2, ['resize 0', 'resize 100', 'resize 1', 'resize 99', 'list']],
]
for (const [name, global, steps] of cases) {
  const b = run(M.base, global, steps)
  const t = run(M.tgt, global, steps)
  console.log(`${b == t ? 'SAME' : 'DIFF'} ${name}\n  base ${b}${b == t ? '' : `\n  tgt  ${t}`}`)
}
const help = (m: any) => m.a.apply(m.l.defaultTabs(), 'main', ['help']).text
console.log('help text identical:', help(M.base) == help(M.tgt), JSON.stringify(help(M.tgt).split('\n')[7]))
