// base 와 tgt 의 layout-file.ts 순수 함수를 같은 입력으로 돌려 대조한다.
const B = await import('../base/hooks/layout-file.ts')
const T = await import('../tgt/hooks/layout-file.ts')
const cell = (id: unknown, plugin?: unknown) => (plugin === undefined ? { kind: 'cell', id } : { kind: 'cell', id, plugin })
const file = (tabs: unknown) => JSON.stringify({ version: 1, project: '/p', tabs })
const row = (...kids: unknown[]) => ({ kind: 'row', children: kids })
const inf = (a: string, b: string) => `{"version":1,"project":"/p","tabs":[{"name":"a","active":"c1","root":{"kind":"row","children":[{"node":{"kind":"cell","id":"c1"},"size":${a}},{"node":{"kind":"cell","id":"c2"},"size":${b}}]}}]}`
const inputs: Record<string, string> = {
  ok1: file([{ name: 'main', active: 'c1', root: cell('c1') }]),
  ok2: file([{ name: 'main', active: 'c1', root: row({ node: cell('c1', 'usage-gauge'), size: 30 }, { node: cell('c2'), size: 70 }) }]),
  badId: file([{ name: 'main', active: 'C1', root: cell('C1') }]),
  numId: file([{ name: 'main', active: 'c1', root: cell(5) }]),
  badPlugin: file([{ name: 'main', active: 'c1', root: cell('c1', 'Foo') }]),
  numPlugin: file([{ name: 'main', active: 'c1', root: cell('c1', 3) }]),
  nullPlugin: file([{ name: 'main', active: 'c1', root: cell('c1', null) }]),
  badName: file([{ name: 'Main', active: 'c1', root: cell('c1') }]),
  numName: file([{ name: 7, active: 'c1', root: cell('c1') }]),
  dupName: file([{ name: 'a', active: 'c1', root: cell('c1') }, { name: 'a', active: 'c2', root: cell('c2') }]),
  dupId: file([{ name: 'a', active: 'c1', root: cell('c1') }, { name: 'b', active: 'c1', root: cell('c1') }]),
  dupPlugin: file([{ name: 'a', active: 'c1', root: row({ node: cell('c1', 'x'), size: 50 }, { node: cell('c2', 'x'), size: 50 }) }]),
  nestedBad: file([{ name: 'a', active: 'c1', root: row({ node: cell('c1'), size: 50 }, { node: row({ node: cell('c2'), size: 1 }, { node: cell('BAD'), size: 1 }), size: 50 }) }]),
  activeId: file([{ name: 'a', active: 'c1', root: row({ node: cell('c1', 'x'), size: 50 }, { node: cell('active'), size: 50 }) }]),
  sizeStr: file([{ name: 'a', active: 'c1', root: row({ node: cell('c1'), size: '30' }, { node: cell('c2'), size: 70 }) }]),
  sizeNeg: file([{ name: 'a', active: 'c1', root: row({ node: cell('c1'), size: -5 }, { node: cell('c2'), size: 70 }) }]),
  sizeZero: file([{ name: 'a', active: 'c1', root: row({ node: cell('c1'), size: 0 }, { node: cell('c2'), size: 0 }) }]),
  sizeInf: inf('1e999', '30'),
  sizeNegInf: inf('-1e999', '30'),
  sizeBothInf: inf('1e999', '1e999'),
  sizeHuge: inf('1e308', '30'),
  notJson: '{',
  noTabs: '{"version":1}',
  ver2: file([]).replace('"version":1', '"version":2'),
}
for (const [name, text] of Object.entries(inputs)) {
  const b = JSON.stringify(B.parseLayoutFile(text))
  const t = JSON.stringify(T.parseLayoutFile(text))
  console.log(b == t ? 'SAME' : 'DIFF', name, b == t ? b.slice(0, 200) : `\n  base ${b}\n  tgt  ${t}`)
}
for (const p of ['/Users/x/LOCAL/01-01_Projects/plugin-pane-grid', '/', '', '/a b/한글 dir', '/x/y/']) console.log('dirName', JSON.stringify(p), await T.dirName(p))
// checkTabs (tgt) 와 checkUnique (base, 내보내지 않았으면 undefined)
console.log('base exports', Object.keys(B).join(','), '| tgt exports', Object.keys(T).join(','))
