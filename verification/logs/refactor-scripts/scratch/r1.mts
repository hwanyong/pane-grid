// 비교용 임시 스크립트(시험 파일 아님): base 와 tgt 의 tree.ts · actions.ts · layout-file.ts 를 같은 입력으로 부른다.
const J = '/Users/uhd/.claude/jobs/2d2d4469/tmp'
const B = { t: await import(J + '/base/hooks/tree.ts'), a: await import(J + '/base/hooks/actions.ts'), l: await import(J + '/base/hooks/layout-file.ts') }
const T = { t: await import(J + '/tgt/hooks/tree.ts'), a: await import(J + '/tgt/hooks/actions.ts'), l: await import(J + '/tgt/hooks/layout-file.ts') }
const show = (label: string, f: (m: any) => any) => {
  let b, t
  try { b = JSON.stringify(f(B)) } catch (e: any) { b = 'THROW ' + e.message }
  try { t = JSON.stringify(f(T)) } catch (e: any) { t = 'THROW ' + e.message }
  console.log((b == t ? 'SAME ' : 'DIFF ') + label + '\n  base ' + b + (b == t ? '' : '\n  tgt  ' + t))
}
const c = (id: string, plugin?: string) => (plugin ? { kind: 'cell', id, plugin } : { kind: 'cell', id })
const ch = (sizes: number[]) => sizes.map((s, i) => ({ node: c('c' + (i + 1)), size: s }))
for (const s of [[50, 50], [1, 99, 0], [99, 0.5, 0.5], [98.5, 0.5, 0.5, 0.5], [99.5, 0.5], [1e308, 1e308], [Infinity, 1], [NaN, 1], [-1, 5], [0, 0], [33, 33, 34], [1, 1, 1], [] as number[]])
  show('normalize ' + JSON.stringify(s), m => m.t.normalize(ch(s)).map((x: any) => x.size))
const many = Array.from({ length: 150 }, (_, i) => (i == 0 ? 100 : 0.1))
show('normalize 150 children', m => { const n = m.t.normalize(ch(many)); return [n.slice(0, 3).map((x: any) => x.size), n.at(-1).size, n.reduce((a: number, x: any) => a + x.size, 0)] })
const F2r = { kind: 'row', children: ch([50, 50]) }
const T1r = { kind: 'row', children: [{ node: c('c1'), size: 25 }, { node: c('c3'), size: 25 }, { node: c('c2'), size: 50 }] }
for (const sh of [1, 35, 99, 0, 100, 50.5]) show('resize T1 c3 ' + sh, m => m.t.describe(m.t.resize(T1r, 'c3', sh)))
const four = { kind: 'row', children: ch([25, 25, 25, 25]) }
const five = { kind: 'column', children: ch([20, 20, 20, 20, 20]) }
for (const p of ['even-horizontal', 'even-vertical', 'main-vertical', 'main-horizontal', 'tiled', 'bogus'])
  for (const r of [F2r, T1r, four, five, c('c1')]) show('preset ' + p + ' ' + (r as any).kind, m => m.t.describe(m.t.preset(r, p)))
show('swap', m => m.t.swap({ kind: 'row', children: [{ node: c('c1', 'x'), size: 30 }, { node: { kind: 'column', children: [{ node: c('c2'), size: 40 }, { node: c('c3'), size: 60 }] }, size: 70 }] }, 'c1', 'c3'))
// moveDivider
const md = (sizes: number[], length: number, index: number, at: number) => show(`moveDivider ${JSON.stringify(sizes)} len=${length} i=${index} at=${at}`, m => m.t.describe(m.t.moveDivider({ kind: 'row', children: ch(sizes) }, length, index, at)))
md([50, 50], 75, 0, -100); md([50, 50], 75, 0, 200); md([50, 50], 75, 0, 30)
md([98, 1.5, 0.5], 75, 1, 0); md([98, 1.5, 0.5], 75, 1, 100); md([98, 1, 1], 75, 1, 74)
md([50, 50], 1, 0, 0); md([50, 50], 2, 0, 0); md([50, 50], 3, 0, 5); md([34, 33, 33], 3, 0, 1); md([34, 33, 33], 3, 1, 0)
for (const [sz, len] of [[[98, 1.5, 0.5], 75], [[50, 50], 1], [[34, 33, 33], 3]] as [number[], number][])
  show(`splitRects ${JSON.stringify(sz)} ${len}`, m => m.t.splitRects({ kind: 'row', children: ch(sz) }, { x: 0, y: 0, width: len, height: 10 }).dividers.map((d: any) => [d.index, d.start]))
