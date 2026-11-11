// 비교용 임시 스크립트(시험 파일 아님): 프로젝트 파일 내용 하나를 parseLayoutFile 로 읽고 list 와 split -h 를 돌린다.
const J = '/Users/uhd/.claude/jobs/2d2d4469/tmp'
const load = async (tree: string) => ({ a: await import(`${J}/${tree}/hooks/actions.ts`), l: await import(`${J}/${tree}/hooks/layout-file.ts`) })
const M = { base: await load('base'), tgt: await load('tgt') }
const row = (sizes: string[]) => `{"version":1,"tabs":[{"name":"main","root":{"kind":"row","children":[${sizes.map((s, i) => `{"node":{"kind":"cell","id":"c${i + 1}"},"size":${s}}`).join(',')}]},"active":"c1"}]}`
for (const sizes of [['1e308', '1e308'], ['1e999', '1'], ['99', '0.5', '0.5'], ['98', '1.5', '0.5']]) {
  for (const tree of ['base', 'tgt'] as const) {
    const m = M[tree]
    const p = m.l.parseLayoutFile(row(sizes))
    if (!p.isValid) { console.log(tree, sizes.join(','), 'invalid', p.reason); continue }
    const list = m.a.apply(p.tabs, 'main', ['list']).text
    const s = m.a.apply(p.tabs, 'main', ['split', '-h'])
    console.log(tree, sizes.join(','), '|', list, '|', m.a.apply(s.tabs, 'main', ['list']).text, '|', JSON.stringify(m.l.serializeLayoutFile(s.tabs, '/p')).match(/size[^,}]*/g)?.join(' '))
  }
}
