// k12 scratch: base(dd6cda9) 의 register.tsx 안 함수 본문(그대로 옮김)과 tgt(2d2d846) 의 옮긴 함수를 같은 입력으로 돌려 대조한다.
// 실행: npx -y tsx /Users/uhd/.claude/jobs/2d2d4469/tmp/scratch/eq.mts
const B = '/Users/uhd/.claude/jobs/2d2d4469/tmp/base'
const T = '/Users/uhd/.claude/jobs/2d2d4469/tmp/tgt'
const bt = await import(`${B}/hooks/tree.ts`)
const tt = await import(`${T}/hooks/tree.ts`)
const pa = await import(`${T}/hooks/pane-area.ts`)
const rk = await import(`${T}/hooks/render-keys.ts`)
const gl = await import(`${T}/hooks/glyphs.ts`)
const bpg = await import(`${B}/skills/add-pane-grid-cell/pane-grid.ts`)
const tpg = await import(`${T}/skills/add-pane-grid-cell/pane-grid.ts`)
const { apply } = await import(`${T}/hooks/actions.ts`)
const { defaultTabs } = await import(`${T}/hooks/layout-file.ts`)

let fails = 0
const eq = (name: string, a: unknown, b: unknown) => {
  const sa = JSON.stringify(a), sb = JSON.stringify(b)
  if (sa != sb) { fails++; if (fails < 15) console.log('DIFF', name, sa, sb) }
}

// ---- base 의 상수 · 함수(dd6cda9 register.tsx 에서 그대로) ----
const TOOLBAR_ROWS = 2, RULE_ROWS = 1, HEADER_ROWS = RULE_ROWS + TOOLBAR_ROWS + RULE_ROWS, CELL_CHROME_ROWS = 1
const bGridRect = (m: any) => ({ x: 0, y: 0, width: m.columns, height: Math.max(m.rows - HEADER_ROWS, 0) })
const bContentSize = (rect: any) => ({ columns: Math.max(rect.width, 0), rows: Math.max(rect.height - CELL_CHROME_ROWS, 0) })
const bContentArea = (rect: any) => ({ column: rect.x, row: HEADER_ROWS + rect.y + CELL_CHROME_ROWS, ...bContentSize(rect) })
const mkBaseCellAt = (geometry: any) => (tab: any, measured: any, pointer: any) => {
  if (!pointer) return tab.zoomed ?? tab.active
  const area = bGridRect(measured)
  const row = pointer.row - HEADER_ROWS
  const rects: any[] = tab.zoomed ? [[tab.zoomed, area]] : [...geometry(tab.root, area)]
  const hit = rects.find(([, rect]) => pointer.column >= rect.x && pointer.column < rect.x + rect.width && row >= rect.y && row < rect.y + rect.height)
  return hit?.[0]
}
const mkBasePlacements = (geometry: any, cellsOf: any, measuredMap: Map<string, any>) => (tabs: any[]) => {
  const placed: Record<string, any> = {}
  for (const tab of tabs) {
    const measured = measuredMap.get(tab.name)
    const rects = measured ? geometry(tab.root, bGridRect(measured)) : new Map()
    for (const cell of cellsOf(tab.root)) {
      if (!cell.plugin) continue
      const rect = measured && tab.zoomed == cell.id ? bGridRect(measured) : rects.get(cell.id)
      const isShown = !tab.zoomed || tab.zoomed == cell.id
      const area = rect && isShown ? bContentArea(rect) : { column: 0, row: 0, columns: 0, rows: 0 }
      placed[cell.plugin] = { tab: tab.name, requestId: `grid-${tab.name}`, cell: cell.id, ...area, isActive: (tab.zoomed ?? tab.active) == cell.id }
    }
  }
  return placed
}
// tgt placements(2d2d846 register.tsx 에서 그대로, paneId 만 펼침)
const tgtPlacements = (tabs: any[], sizeOf: (t: string) => any) => {
  const placed: Record<string, any> = {}
  for (const tab of tabs) {
    const measured = sizeOf(tab.name)
    const rects = measured ? pa.visibleRects(tab, pa.gridRect(measured)) : new Map()
    for (const cell of tt.cellsOf(tab.root)) {
      if (!cell.plugin) continue
      const rect = rects.get(cell.id)
      const area = rect ? pa.contentArea(rect) : { column: 0, row: 0, columns: 0, rows: 0 }
      placed[cell.plugin] = { tab: tab.name, requestId: `grid-${tab.name}`, cell: cell.id, ...area, isActive: pa.activeOf(tab) == cell.id }
    }
  }
  return placed
}
// base pressWords · keys
const PLACE_KEY = 'place:', HOTKEY_KEY = 'hotkey:'
const BTOOLBAR: any = { v: { label: 'split-h', words: ['split', '-h'] }, s: { label: 'split-v', words: ['split', '-v'] }, o: { label: 'next', words: ['next'] }, z: { label: 'zoom', words: ['zoom'] }, x: { label: 'kill', words: ['kill'] }, w: { label: 'swap', words: ['swap'] }, b: { label: 'break', words: ['break'] }, c: { label: 'new tab', words: ['new'] }, k: { label: 'close tab', words: ['close'] }, q: { label: 'list', words: ['list'] } }
const BHOTKEYS = bpg.TOOLBAR_KEYS.map((key: string) => ({ key, ...BTOOLBAR[key] }))
const bPressWords = (element: string) => {
  if (element.startsWith(PLACE_KEY)) { const [cell, plugin] = element.slice(PLACE_KEY.length).split(':'); return cell && plugin ? ['place', plugin, cell] : undefined }
  if (element.startsWith(HOTKEY_KEY)) return BHOTKEYS.find((item: any) => item.key == element.slice(HOTKEY_KEY.length))?.words
  return undefined
}
const bParseDivider = (element: string) => {
  const [path, index] = element.slice('divider:'.length).split(':')
  return path && index != undefined && Number.isInteger(Number(index)) ? { path, index: Number(index) } : undefined
}
const bPress = /^(place|hotkey):/

// ---- 상수 ----
eq('HOTKEYS', BHOTKEYS, rk.HOTKEYS)
eq('glyph', ['│', '─'].map(c => c.codePointAt(0)), [gl.VERTICAL, gl.HORIZONTAL].map((c: string) => c.codePointAt(0)))
eq('pane-area consts', [2, 1, 4, 1], [pa.TOOLBAR_ROWS, pa.RULE_ROWS, pa.HEADER_ROWS, pa.CELL_CHROME_ROWS])
eq('keys', ['cell:', 'hotkey:', 'activate:', 'divider:', 'measure:'], [rk.CELL_KEY, rk.HOTKEY_KEY, rk.ACTIVATE_KEY, rk.DIVIDER_KEY, rk.MEASURE_KEY])
eq('pg consts', ['slot:', 'choices:', ':active', 'none:', 'place:', 9, 1], [tpg.SLOT_KEY, tpg.CHOICES_KEY, tpg.ACTIVE_SUFFIX, tpg.NONE_KEY, tpg.PLACE_KEY, tpg.CHOICE_HOTKEYS, tpg.GRID_VERSION])
eq('dividerKey', 'divider:0.1.2:3', rk.dividerKey('0.1.2', 3))
console.log('PRESS_KEY', String(rk.PRESS_KEY))

// ---- 문자열 판정 ----
const elems = ['place:c1:usage-gauge', 'place:c1', 'place::x', 'place:', 'place:c1:a:b', 'hotkey:v', 'hotkey:q', 'hotkey:r', 'hotkey:', 'hotkey:vv', 'placex:a:b', 'Place:c1:x', 'xplace:c1:a', 'hotkeys:v', 'activate:c1', 'divider:0:1', '']
for (const e of elems) { eq(`press ${e}`, bPress.test(e), rk.PRESS_KEY.test(e)); eq(`words ${e}`, bPressWords(e), rk.pressWords(e)) }
const dels = ['divider:0:1', 'divider:0.1:2', 'divider::1', 'divider:0:', 'divider:0', 'divider:0:x', 'divider:0:1.5', 'divider:0:-1', 'divider:0:1:2', 'divider:0: ', 'divider:0:1e2', 'divider:0:0x10']
for (const e of dels) eq(`divider ${e}`, bParseDivider(e), rk.parseDividerKey(e))

// ---- 무작위 배치: cellAt · placements ----
let seed = 12345
const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n }
const verbs = [['split', '-h'], ['split', '-v'], ['next'], ['zoom'], ['kill'], ['swap'], ['resize', '30'], ['layout', 'tiled'], ['layout', 'main-vertical'], ['place', 'pa'], ['place', 'pb'], ['place', 'pc'], ['place', '-'], ['new'], ['break']]
const pluginsOf = (tabs: any[]) => tabs.flatMap((t: any) => tt.cellsOf(t.root))
for (let trial = 0; trial < 400; trial++) {
  let tabs = defaultTabs(); let cur = 'main'
  const steps = 1 + rnd(12)
  for (let i = 0; i < steps; i++) {
    const o = apply(tabs, cur, verbs[rnd(verbs.length)])
    if ((o as any).tabs) { tabs = (o as any).tabs; cur = (o as any).current ?? cur }
  }
  // zoomed != active 상태(손으로 고친 파일)도 넣는다
  if (rnd(3) == 0) tabs = tabs.map((t: any) => { const ids = tt.cellsOf(t.root).map((c: any) => c.id); return { ...t, zoomed: ids[rnd(ids.length)] } })
  const sizes = new Map<string, any>()
  for (const t of tabs) if (rnd(4) != 0) sizes.set(t.name, { columns: 20 + rnd(150), rows: 5 + rnd(50) })
  const bp = mkBasePlacements(tt.geometry, tt.cellsOf, sizes)(tabs)
  const tp = tgtPlacements(tabs, n => sizes.get(n))
  eq(`placements#${trial}`, bp, tp)
  const bp0 = mkBasePlacements(bt.geometry, bt.cellsOf, sizes)(tabs)
  if (JSON.stringify(bp0) != JSON.stringify(bp)) console.log('note: base tree geometry differs from tgt tree geometry at trial', trial)
  const bc = mkBaseCellAt(tt.geometry)
  for (const t of tabs) {
    const m = sizes.get(t.name) ?? { columns: 80, rows: 30 }
    eq(`cellAt nopointer#${trial}`, bc(t, m, undefined), pa.cellAt(t, m, undefined))
    for (let k = 0; k < 40; k++) {
      const p = { column: rnd(m.columns + 4) - 2, row: rnd(m.rows + 6) - 2 }
      eq(`cellAt#${trial}`, bc(t, m, p), pa.cellAt(t, m, p))
    }
  }
}
console.log('fails', fails)
