// 비교용 임시 스크립트(시험 파일 아님): 위아래 [98,1,1] 노드의 둘째 분할선을 끌 때 base 와 tgt 의 moveDivider 결과.
const J = '/Users/uhd/.claude/jobs/2d2d4469/tmp'
const B = await import(`${J}/base/hooks/tree.ts`)
const T = await import(`${J}/tgt/hooks/tree.ts`)
const node = { kind: 'column', children: [98, 1, 1].map((size, i) => ({ node: { kind: 'cell', id: `c${i + 1}` }, size })) }
for (const len of [30, 36, 38, 40, 41, 43, 45, 50, 52]) {
  const d = B.splitRects(node, { x: 0, y: 0, width: 75, height: len }).dividers.map((x: any) => x.start)
  const at = (d[1] ?? 0) - 3
  console.log(len, 'dividers', JSON.stringify(d), 'base', B.describe(B.moveDivider(node, len, 1, at)), 'tgt', T.describe(T.moveDivider(node, len, 1, at)))
}
