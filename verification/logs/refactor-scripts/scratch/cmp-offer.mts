// base 와 tgt 의 pane-grid.ts offerChoice 를 같은 render 트리로 돌려 대조한다.
const B = await import('../base/skills/add-pane-grid-cell/pane-grid.ts')
const T = await import('../tgt/skills/add-pane-grid-cell/pane-grid.ts')
const box = (key: string, children: unknown[] = []) => ({ type: 'Box', props: { key }, children })
const btn = (c: { key: string; label: string; hotkey?: string }) => ({ type: 'Button', props: { key: c.key, label: c.label, hotkey: c.hotkey }, children: [] })
const keys = ['choices:c1:active', 'choices:c2', 'choices:active', 'choices:active:active', 'choices:a-b', 'choices:x:other', 'choices:']
for (const k of keys) {
  const tree = box('root', [box(k, [box('none:x')])])
  const b = JSON.stringify(B.offerChoice(tree as never, 'tm', undefined, btn as never))
  const t = JSON.stringify(T.offerChoice(tree as never, 'tm', undefined, btn as never))
  const pick = (s: string) => JSON.stringify(JSON.parse(s).children[0].children.map((c: { props: unknown }) => c.props))
  console.log(b == t ? 'SAME' : 'DIFF', k, b == t ? pick(b) : `\n  base ${pick(b)}\n  tgt  ${pick(t)}`)
}
// 이미 선택지가 둘 있는 활성 칸: hotkey 번호
const two = box('root', [box('choices:c1:active', [btn({ key: 'place:c1:a', label: 'a', hotkey: '1' }), btn({ key: 'place:c1:b', label: 'b', hotkey: '2' })])])
console.log('count', JSON.stringify(B.offerChoice(two as never, 'tm', { cell: 'c3' } as never, btn as never)) == JSON.stringify(T.offerChoice(two as never, 'tm', { cell: 'c3' } as never, btn as never)) ? 'SAME' : 'DIFF')
for (const name of ['GRID_VERSION', 'SLOT_KEY', 'CHOICES_KEY', 'ACTIVE_SUFFIX', 'NONE_KEY', 'PLACE_KEY', 'CHOICE_HOTKEYS']) console.log(name, JSON.stringify((B as Record<string, unknown>)[name]), JSON.stringify((T as Record<string, unknown>)[name]))
const layout = { version: 1, placed: { tm: { tab: 'main', requestId: 'grid-1', columns: 10, rows: 5 } } }
console.log('placementIn', JSON.stringify(B.placementIn(layout, 'tm')) == JSON.stringify(T.placementIn(layout, 'tm')), JSON.stringify(T.placementIn({ ...layout, version: 2 }, 'tm')))
