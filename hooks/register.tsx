import { update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderNode, Tier, TraceEntry } from 'claude-code'
import type { GridLayout, GridNode, GridPlacement, GridScroll, GridShown, GridTab } from '../types/index.d.ts'
import { apply, checkOutcome } from './actions'
import { defaultTabs, parseLayoutFile, serializeLayoutFile } from './layout-file'
import { isScrollIn, scrollsKey, TOOLBAR_KEYS } from '../skills/add-pane-grid-cell/pane-grid'
import { ROOT_PATH, cellsOf, childPath, findCell, geometry, moveDivider, rectAt, replaceAt, splitAt, splitRects } from './tree'
import type { Rect } from './tree'

// pane-grid: 탭(엔진 pane `grid-<이름>`)마다 배치 트리를 그리고, 칸에 규약 mod 가 그린 `cell:<plugin>` Box 를 놓는다.
// 설계는 docs/grid-and-tabs.md §3. 배치의 원본은 ~/.claude/pane-grid/layout.json 이고(결정 12), state 는 그 사본이다.

const LAYOUT = { plugin: 'pane-grid', key: 'layout' } as const
const SCROLL = { plugin: 'pane-grid', key: 'scroll' } as const
const SHOWN = { plugin: 'pane-grid', key: 'shown' } as const
const COMMAND = 'grid'
const PANE_PREFIX = 'grid-'
const FILE = '.claude/pane-grid/layout.json'
const INVALID_COPY = '.claude/pane-grid/layout.invalid.json'
// hotkey Button 줄. 높이를 고정해야 칸 사각형과 휠 `pointer.row` 를 맞출 수 있다.
const TOOLBAR_ROWS = 2
// 엔진의 탭 줄과 hotkey 줄 사이, hotkey 줄과 grid 사이의 고정 구분선(끌 수 없다). 각 1행이다.
const RULE_ROWS = 1
// grid 위의 행 수: 구분선 · hotkey 줄 · 구분선.
const HEADER_ROWS = RULE_ROWS + TOOLBAR_ROWS + RULE_ROWS
const VERTICAL = '│'
const HORIZONTAL = '─'
// 칸에는 테두리가 없고 제목 1행만 있다. 칸 사이는 끌어서 크기를 바꾸는 분할선 1칸이다(tree.ts DIVIDER).
const CELL_CHROME_ROWS = 1
const SHOWN_POLL_MS = 1000
// render tree 의 key 머리말(docs/grid-and-tabs.md §3.7). 규약 mod 가 pane-grid 보다 아래(뒤에 로드)에 있으면 `cell:<plugin>` Box 를
// 그려 next(e) 결과로 내고, 위(먼저 로드)에 있으면 pane-grid 가 그린 `slot:<plugin>` Box 를 채우고 `choices:<cell>` Box 에 선택지 Button 을 더한다.
const CELL_KEY = 'cell:'
const SLOT_KEY = 'slot:'
const CHOICES_KEY = 'choices:'
const ACTIVE_SUFFIX = ':active'
const NONE_KEY = 'none:'
// pane-grid 가 그리는 Button 의 key 머리말. 누름은 모두 ui.press hook 하나가 받는다(로드 순서와 무관하게 같은 입구).
const PLACE_KEY = 'place:'
const HOTKEY_KEY = 'hotkey:'
// pane-grid 의 Client(surface module) key 머리말. 누름 · 끌기는 ui.message hook 이 받는다.
const ACTIVATE_KEY = 'activate:'
const DIVIDER_KEY = 'divider:'
const MEASURE_KEY = 'measure:'
const ACTIVE_COLOR = 'green'
// trace 에서 규약 mod 를 고를 때 빼는 이름과 tier. 사람이 설치한 mod 만 빈 칸의 선택지가 된다.
const OWN_NAME = 'pane-grid'
const ENGINE_NAME = 'engine'
const INSTALLED_TIERS: readonly Tier[] = ['prepend', 'user', 'append']
// 빈 칸 선택지의 hotkey 는 활성 칸에서만 1-9 를 붙인다. 칸마다 붙이면 같은 숫자가 겹친다.
const CHOICE_HOTKEYS = 9
// slot 을 채우지 않은 놓인 mod: 불러오지 않았거나, hooks/pane-grid.ts 가 slot 을 모르는 0.3.0 이전 사본이다.
const UNFILLED_HINT = 'not loaded, or its hooks/pane-grid.ts is older than pane-grid 0.3.0'

// docs/grid-and-tabs.md §2.3 결정 10. 이름 바꾸기(`r`)는 이름 입력이 필요해 slash 명령으로만 한다.
// 글자는 읽기 모듈의 TOOLBAR_KEYS 가 갖고(규약 mod 가 그 글자를 피한다), 여기서는 글자마다 이름과 명령을 붙인다.
const TOOLBAR: Record<(typeof TOOLBAR_KEYS)[number], { label: string; words: string[] }> = {
  v: { label: 'split-h', words: ['split', '-h'] },
  s: { label: 'split-v', words: ['split', '-v'] },
  o: { label: 'next', words: ['next'] },
  z: { label: 'zoom', words: ['zoom'] },
  x: { label: 'kill', words: ['kill'] },
  w: { label: 'swap', words: ['swap'] },
  b: { label: 'break', words: ['break'] },
  c: { label: 'new tab', words: ['new'] },
  k: { label: 'close tab', words: ['close'] },
  q: { label: 'list', words: ['list'] },
}
const HOTKEYS = TOOLBAR_KEYS.map(key => ({ key, ...TOOLBAR[key] }))

type Measured = { columns: number; rows: number }

// 모듈 변수는 다시 불러오면 처음 값으로 돌아간다. 그려진 것은 모두 $.state 에서 읽고, 여기에는 다시 계산할 수 있는 것만 둔다.
const run = {
  home: '',
  // 파일이 형식에 맞지 않아 기본 배치로 시작했으면 그 원문. 처음 저장할 때 INVALID_COPY 로 옮겨 남긴다.
  invalidText: undefined as string | undefined,
  // slash 명령이 다룰 탭. 보이는 grid 탭이 있으면 그것, 없으면 마지막으로 보였던 탭.
  current: '',
  measured: new Map<string, Measured>(),
  // 칸 안의 `scrolls:<plugin>` Box 로 자기 행을 스스로 스크롤한다고 알린 아래 규약 mod. render 마다 다시 모은다.
  scrolling: new Set<string>(),
}

const noop = () => {}

const log = ($: EngineInterface, text: string) => $.ui.log(`pane-grid: ${text}`, { to: 'debug' })

const paneId = (tab: string) => `${PANE_PREFIX}${tab}`
const tabOf = (requestId: string) => requestId.slice(PANE_PREFIX.length)
const titleOf = (tab: GridTab) => (tab.zoomed ? `${tab.name} [Z]` : tab.name)

const readLayout = async ($: EngineInterface): Promise<GridLayout | undefined> => (await $.state.get(LAYOUT)).value

// 칸 내용 자리와 크기. 탭을 아직 그리지 않았거나 다른 칸을 zoom 해 가려졌으면 0 이다. zoom 한 칸은 grid 전체에 그린다.
const placements = (tabs: GridTab[]): Record<string, GridPlacement> => {
  const placed: Record<string, GridPlacement> = {}
  for (const tab of tabs) {
    const measured = run.measured.get(tab.name)
    const rects = measured ? geometry(tab.root, gridRect(measured)) : new Map<string, Rect>()
    for (const cell of cellsOf(tab.root)) {
      if (!cell.plugin) continue
      const rect = measured && tab.zoomed == cell.id ? gridRect(measured) : rects.get(cell.id)
      const isShown = !tab.zoomed || tab.zoomed == cell.id
      const area = rect && isShown ? contentArea(rect) : { column: 0, row: 0, columns: 0, rows: 0 }
      placed[cell.plugin] = { tab: tab.name, requestId: paneId(tab.name), cell: cell.id, ...area, isActive: (tab.zoomed ?? tab.active) == cell.id }
    }
  }
  return placed
}

const gridRect = (measured: Measured): Rect => ({ x: 0, y: 0, width: measured.columns, height: Math.max(measured.rows - HEADER_ROWS, 0) })

const contentSize = (rect: Rect) => ({
  columns: Math.max(rect.width, 0),
  rows: Math.max(rect.height - CELL_CHROME_ROWS, 0),
})

// 칸 내용의 왼쪽 위를 pane 본문 좌표(`UiScrollPointer` 와 같은 좌표)로 더한다. 위에 구분선 · hotkey 줄 · 칸 제목이 있다.
const contentArea = (rect: Rect) => ({ column: rect.x, row: HEADER_ROWS + rect.y + CELL_CHROME_ROWS, ...contentSize(rect) })

// 칸 id 마다 놓인 mod. 탭을 모두 본다(칸 id 는 탭을 통틀어 하나뿐이다).
const occupants = (tabs: GridTab[]) => new Map(tabs.flatMap(tab => cellsOf(tab.root)).map(cell => [cell.id, cell.plugin ?? ''] as const))

// 놓인 mod 가 바뀌었거나 없어진 칸의 스크롤 행 수를 지운다. 새 mod 는 맨 위부터 그려지고, 자기 행을 스스로 스크롤하는 mod 의
// 칸은 pane-grid 의 marginTop 이 0 으로 남는다.
const dropStaleScroll = async ($: EngineInterface, before: GridTab[], after: GridTab[]) => {
  const was = occupants(before)
  const now = occupants(after)
  const scroll: GridScroll = (await $.state.get(SCROLL)).value ?? {}
  const stale = Object.keys(scroll).filter(id => was.get(id) != now.get(id) || !now.has(id))
  if (stale.length == 0) return
  await update($, SCROLL, current => Object.fromEntries(Object.entries(current ?? {}).filter(([id]) => !stale.includes(id))))
  log($, `scroll reset for ${stale.join(',')}`)
}

const publish = async ($: EngineInterface, tabs: GridTab[]) => {
  await dropStaleScroll($, (await readLayout($))?.tabs ?? [], tabs)
  const placed = placements(tabs)
  const layout = await update($, LAYOUT, (current): GridLayout => ({ version: 1, revision: (current?.revision ?? 0) + 1, tabs, placed }))
  log($, `layout revision=${layout.revision} tabs=${tabs.map(tab => tab.name).join(',')} placed=${Object.keys(placed).join(',')}`)
  return layout
}

// 탭 크기를 잰 뒤 칸 크기가 바뀌었을 때만 다시 쓴다. render 중에는 쓸 수 없으므로 render 가 끝난 뒤 부른다.
const publishPlacements = async ($: EngineInterface) => {
  const layout = await readLayout($)
  if (!layout) return
  const placed = placements(layout.tabs)
  if (JSON.stringify(placed) == JSON.stringify(layout.placed)) return
  await publish($, layout.tabs)
}

const persist = async ($: EngineInterface, tabs: GridTab[]) => {
  if (run.invalidText != undefined) {
    await $.fs.write(`${run.home}/${INVALID_COPY}`, run.invalidText)
    log($, `kept the invalid layout file as ${INVALID_COPY}`)
    run.invalidText = undefined
  }
  await $.fs.write(`${run.home}/${FILE}`, serializeLayoutFile(tabs))
}

const loadFile = async ($: EngineInterface): Promise<GridTab[]> => {
  const path = `${run.home}/${FILE}`
  if (!(await $.fs.exists(path))) return defaultTabs()
  const text = await $.fs.read(path)
  const parsed = parseLayoutFile(text)
  if (parsed.isValid) return parsed.tabs
  run.invalidText = text
  log($, `layout file refused: ${parsed.reason}`)
  $.ui.toast(`pane-grid: ~/${FILE} is not a valid layout (${parsed.reason}); using one empty tab`)
  return defaultTabs()
}

// 엔진 pane 으로 여는 것: 탭마다 pane id 와 title. 이 값이 같으면 syncPanes 가 할 일이 없다.
const paneSpec = (tabs: GridTab[]) => tabs.map(tab => `${paneId(tab.name)}\t${titleOf(tab)}`).join('\n')

// 탭 목록과 엔진 pane 을 맞춘다. 같은 id 를 다시 열면 title 만 바뀐다.
const syncPanes = async ($: EngineInterface, tabs: GridTab[]) => {
  const ids = new Set(tabs.map(tab => paneId(tab.name)))
  for (const pane of await $.ui.panes()) {
    if (pane.id.startsWith(PANE_PREFIX) && !ids.has(pane.id)) await $.ui.close({ id: pane.id })
  }
  for (const tab of tabs) await $.ui.open({ id: paneId(tab.name), title: titleOf(tab) })
}

const currentTab = async ($: EngineInterface, tabs: GridTab[]) => {
  const shown = (await $.state.get(SHOWN)).value
  const name = shown ?? run.current
  return tabs.some(tab => tab.name == name) ? name : tabs[0]?.name ?? name
}

// slash 명령과 hotkey 의 공통 입구.
const runAction = async ($: EngineInterface, words: string[]) => {
  const layout = await ensureLayout($)
  const outcome = apply(layout.tabs, await currentTab($, layout.tabs), words)
  const broken = checkOutcome(outcome)
  if (broken) return `refused: ${broken}`
  run.current = outcome.current
  if (outcome.isChanged) {
    await publish($, outcome.tabs)
    await persist($, outcome.tabs)
    // 활성 칸 · 칸 나누기 · 크기처럼 탭 목록과 title 이 그대로인 동작에서는 pane 을 다시 열지 않는다.
    if (paneSpec(outcome.tabs) != paneSpec(layout.tabs)) await syncPanes($, outcome.tabs)
  }
  if (outcome.focus) {
    const tab = outcome.tabs.find(item => item.name == outcome.focus)
    if (tab) await $.ui.open({ id: paneId(tab.name), title: titleOf(tab), focus: true })
  }
  log($, `action ${words.join(' ')}: ${outcome.text.split('\n')[0]}`)
  return outcome.text
}

// 칸을 눌러 활성으로 한다. pane 에 키보드를 주어 hotkey 가 곧바로 그 pane 에서 눌리게 한다.
const activateCell = async ($: EngineInterface, tabName: string, id: string) => {
  await runAction($, ['select-cell', id])
  const layout = await readLayout($)
  const tab = layout?.tabs.find(item => item.name == tabName)
  if (tab) await $.ui.open({ id: paneId(tab.name), title: titleOf(tab), focus: true })
}

// 분할선을 끄는 동안은 state 만 바꾸고, 놓았을 때(isFinal) 파일에 쓴다.
const dragDivider = async ($: EngineInterface, tabName: string, path: string, index: number, at: number, isFinal: boolean) => {
  const layout = await readLayout($)
  const tab = layout?.tabs.find(item => item.name == tabName)
  const measured = run.measured.get(tabName)
  if (!layout || !tab || !measured || tab.zoomed) return
  const node = splitAt(tab.root, path)
  const rect = rectAt(tab.root, path, gridRect(measured))
  if (!node || !rect) return
  const moved = moveDivider(node, node.kind == 'row' ? rect.width : rect.height, index, at)
  const tabs = moved === node ? layout.tabs : layout.tabs.map(item => (item.name == tabName ? { ...item, root: replaceAt(item.root, path, moved) } : item))
  if (moved !== node) await publish($, tabs)
  if (isFinal) await persist($, tabs)
}

// 원본 파일을 읽어 state 사본과 엔진 pane 을 다시 만든다. 쓴 값을 돌려준다: 한 dispatch 의 $.state.get 은 모두 같은 시점을 읽어
// 방금 쓴 값을 다시 읽지 못한다.
const loadLayout = async ($: EngineInterface) => {
  const tabs = await loadFile($)
  const layout = await publish($, tabs)
  await syncPanes($, tabs)
  return layout
}

const reload = async ($: EngineInterface) => `loaded ${(await loadLayout($)).tabs.length} tab(s) from ~/${FILE}`

// $.state 는 세션 id 마다 따로 있다. /clear 는 같은 프로세스를 새 세션 id 로 이어 가고 session.start 를 다시 부르지 않으므로
// (SessionEndInput.reason), 그 뒤에는 layout 사본이 비어 있다. 비어 있으면 원본 파일에서 다시 만든다. render 중에는 쓸 수 없으므로
// render hook 은 이것을 render 가 끝난 뒤 부른다.
const ensureLayout = async ($: EngineInterface): Promise<GridLayout> => {
  const layout = await readLayout($)
  if (layout) return layout
  log($, 'layout state is empty (a /clear starts a new session state); loading the layout file again')
  return loadLayout($)
}

const watchShown = async ($: EngineInterface) => {
  // grid 탭이 가려져 있으면 render hook 이 불리지 않는다. 규약 mod 는 layout 이 비면 자기 pane 으로 돌아가므로 여기서도 되살린다.
  await ensureLayout($)
  const pane = (await $.ui.panes()).find(item => item.isShown && item.id.startsWith(PANE_PREFIX))
  const shown: GridShown = pane ? tabOf(pane.id) : null
  if (shown) run.current = shown
  const held = await $.state.get(SHOWN)
  if (held.version == 0 || held.value != shown) await $.state.set(SHOWN, shown)
}

// Box 아래에 key 가 `key` 인 노드가 있는가.
const holdsKey = (node: RenderNode, key: string): boolean => {
  if (typeof node == 'string') return false
  const props: Record<string, unknown> | undefined = 'props' in node ? node.props : undefined
  if (props?.key == key) return true
  return 'children' in node && (node.children ?? []).some(child => holdsKey(child, key))
}

// 규약 mod 가 그린 칸: key 가 `cell:<plugin>` 인 Box.
const collectCells = (node: RenderNode, out: Map<string, RenderElement>): void => {
  if (typeof node == 'string') return
  const props: Record<string, unknown> | undefined = 'props' in node ? node.props : undefined
  const key = props?.key
  if (typeof key == 'string' && key.startsWith(CELL_KEY)) return void out.set(key.slice(CELL_KEY.length), node)
  if ('children' in node) for (const child of node.children ?? []) collectCells(child, out)
}

// grid pane 의 ui.render 에 hook 을 건 mod: 규약 mod 는 놓이지 않았어도 이 hook 을 걸고 있으므로 next.trace 에 이름이 남는다.
const gridReady = (trace: readonly TraceEntry[]) => [
  ...new Set(trace.filter(entry => INSTALLED_TIERS.includes(entry.tier) && entry.plugin != OWN_NAME && entry.plugin != ENGINE_NAME).map(entry => entry.plugin)),
].sort()

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    run.home = String((await $.env.get('HOME')) ?? '')
    await $.command.register({ name: COMMAND, description: 'pane-grid: split panes into a grid of mods, tmux style', argumentHint: '<split|kill|next|place|swap|zoom|resize|layout|new|select|rename|close|break|list|reload|help>' })
    await reload($)
    $.clock.every(SHOWN_POLL_MS, () => void watchShown($))
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const words = e.args.trim().split(/\s+/).filter(Boolean)
    if (words[0] == 'reload') return { text: await reload($) }
    return { text: await runAction($, words) }
  }).catch(($, e, next) => {
    log($, `command failed: ${JSON.stringify(next.error)}`)
    return next.called ? next(e) : { text: 'pane-grid: the command failed; see the debug log' }
  })

  on('ui.scroll', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const layout = await readLayout($)
    const tab = layout?.tabs.find(item => item.name == tabOf(e.requestId))
    const measured = run.measured.get(tabOf(e.requestId))
    if (!tab || !measured) return {}
    const id = cellAt(tab, measured, e.pointer)
    if (!id) return {}
    // 자기 행을 스스로 스크롤하는 아래 규약 mod 의 칸: 그 mod 의 ui.scroll hook 에 넘긴다. 칸 제목 줄의 휠은 버린다.
    const plugin = findCell(tab.root, id)?.plugin
    if (plugin && run.scrolling.has(plugin)) return isScrollIn(layout?.placed[plugin], e) ? next(e) : {}
    await update($, SCROLL, scroll => ({ ...scroll, [id]: Math.max((scroll?.[id] ?? 0) + e.by, 0) }))
    return {}
  }).catch(($, e, next) => {
    log($, `scroll failed: ${JSON.stringify(next.error)}`)
    return next(e)
  })

  // grid pane 의 Button 누름. 규약 mod 가 pane-grid 위에 있어도 아래에 있어도 같은 hook 이 받는다.
  // 동작은 chain 이 끝난 뒤에 한다. 탭을 닫는 동작(k · break 등)은 이 pane 을 닫고, 그 뒤의 next(e) 는 chain 맨 아래의
  // Button onPress 를 handle 로 부르는데 pane 과 함께 그 handle 이 없어져 `no handler is held under handle` 로 실패했다.
  on('ui.press', { component: 'Pane', requestId: /^grid-/, element: /^(place|hotkey):/ }, async ($, e, next) => {
    const pressed = await next(e)
    const words = pressWords(e.element)
    if (words) {
      const text = await runAction($, words)
      $.ui.toast(`pane-grid: ${text.split('\n')[0]}`)
    }
    return pressed
  }).catch(($, e, next) => {
    log($, `press failed: ${JSON.stringify(next.error)}`)
    return next.called ? next(e) : { element: e.element }
  })

  // 칸 누름(activate:<cell>)과 분할선 끌기(divider:<path>:<index>). data 는 surface module 이 보낸 것이므로 형식을 검사한다.
  on('ui.message', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const tabName = tabOf(e.requestId)
    const data = typeof e.data == 'object' && e.data != null ? (e.data as Record<string, unknown>) : {}
    if (e.element.startsWith(MEASURE_KEY) && Number.isInteger(data.columns) && Number.isInteger(data.rows)) await publishPlacements($)
    if (e.element.startsWith(ACTIVATE_KEY) && data.activate == true) await activateCell($, tabName, e.element.slice(ACTIVATE_KEY.length))
    if (e.element.startsWith(DIVIDER_KEY) && typeof data.at == 'number' && Number.isInteger(data.at)) {
      const [path, index] = e.element.slice(DIVIDER_KEY.length).split(':')
      if (path && index != undefined && Number.isInteger(Number(index))) await dragDivider($, tabName, path, Number(index), data.at, data.isFinal == true)
    }
    return next(e)
  }).catch(($, e, next) => {
    log($, `message failed: ${JSON.stringify(next.error)}`)
    return next.called ? next(e) : {}
  })

  on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const layout = await readLayout($)
    if (!layout) $.clock.after(0, () => void ensureLayout($))
    const tab = layout?.tabs.find(item => item.name == tabOf(e.requestId))
    if (!tab) return next(e)
    const scroll: GridScroll = (await $.state.get(SCROLL)).value ?? {}
    const below = await next(e)
    const cells = new Map<string, RenderElement>()
    collectCells(below, cells)
    for (const [plugin, cell] of cells) {
      if (holdsKey(cell, scrollsKey(plugin))) run.scrolling.add(plugin)
      else run.scrolling.delete(plugin)
    }
    const ready = gridReady(next.trace)
    const placedIn = new Map((layout?.tabs ?? []).flatMap(item => cellsOf(item.root)).flatMap(cell => (cell.plugin ? [[cell.plugin, cell.id] as const] : [])))
    const measured = { columns: e.props.bodyColumns, rows: e.props.scroll.bodyRows }
    const before = run.measured.get(tab.name)
    const isResized = !before || before.columns != measured.columns || before.rows != measured.rows
    run.measured.set(tab.name, measured)
    const { Box, Text, Button } = $.ui.resolve(e)
    // Client(surface module)는 terminal · desktop 의 표에만 있다. 다른 surface 에서는 분할선을 글자로 그리고, 칸 누름은 덮지 않는다.
    // Client 는 `h('Client', { module: './<name>.tsx', … })` 로 적는다. plugin directory 의 검증은 Client 요소를 이 꼴(또는 `<Client module=… />`)로만 읽고,
    // 표에서 꺼낸 Client 를 값으로 쓰면(조건 · 대입) 차단한다(MOD_IMPORT_DYNAMIC_COMPUTED). 그래서 그릴지는 surface 로 가른다.
    const hasClient = e.surface == 'terminal' || e.surface == 'desktop'
    // 잰 크기는 measure Client 가 ui.message 로 돌려보내 그 hook 이 칸 크기를 쓴다. Client 가 없는 surface 에서는 render 가 끝난 뒤 쓴다.
    if (isResized && !hasClient) $.clock.after(0, () => void publishPlacements($))

    // 빈 칸: pane-grid 아래의 규약 mod(trace) 를 Button 으로 늘어놓는다. 위의 규약 mod 는 이 `choices:` Box 에 자기 Button 을 더한다.
    // 누름은 ui.press hook 이 받아 그 칸에 놓고(다른 칸에 있던 것은 옮긴다) 그 칸을 활성으로 한다.
    const drawChoices = (id: string, isActive: boolean): RenderElement => (
      <Box key={`${CHOICES_KEY}${id}${isActive ? ACTIVE_SUFFIX : ''}`} flexDirection="column">
        <Text dimColor>empty. place a mod here:</Text>
        {ready.map((plugin, index) => {
          const from = placedIn.get(plugin)
          const label = from ? `${plugin} (move from ${from})` : plugin
          const hotkey = isActive && index < CHOICE_HOTKEYS ? String(index + 1) : undefined
          return <Button key={`${PLACE_KEY}${id}:${plugin}`} plain label={label} hotkey={hotkey} onPress={noop} />
        })}
        {ready.length == 0 ? <Box key={`${NONE_KEY}${id}`}><Text dimColor>no grid-ready mod is loaded</Text></Box> : null}
      </Box>
    )

    // 놓인 칸: `slot:` Box 안에 아래 규약 mod 의 `cell:` Box 를 넣는다. 위의 규약 mod 는 이 Box 의 children 을 자기 칸으로 바꾼다.
    const drawSlot = (plugin: string): RenderElement => {
      const content = cells.get(plugin)
      const note = ready.includes(plugin) ? `${plugin} draws nothing here` : `${plugin} is ${UNFILLED_HINT}`
      return <Box key={`${SLOT_KEY}${plugin}`} flexDirection="column">{content ?? <Text dimColor>{note}</Text>}</Box>
    }

    // 칸: 제목 1행과 내용. 활성이 아닌 칸에는 그 칸 전체를 덮는 activate Client 를 마지막에 그려(위에 칠해진다) 어디를 눌러도 활성이 되게 한다.
    const drawCell = (id: string, rect: Rect): RenderElement => {
      const cell = findCell(tab.root, id)
      const isActive = id == tab.active
      const size = contentSize(rect)
      const title = `${id} ${cell?.plugin ?? '-'}`
      return (
        <Box key={`cellbox:${id}`} width={rect.width} height={rect.height} flexDirection="column" position="relative">
          {isActive ? <Text color={ACTIVE_COLOR} bold wrap="truncate">{title}</Text> : <Text dimColor wrap="truncate">{title}</Text>}
          <Box width={size.columns} height={size.rows} overflow="hidden" flexDirection="column">
            <Box marginTop={-(scroll[id] ?? 0)} flexShrink={0} flexDirection="column">{cell?.plugin ? drawSlot(cell.plugin) : drawChoices(id, isActive)}</Box>
          </Box>
          {isActive || !hasClient ? null : (
            <Box position="absolute" top={0} left={0} width={rect.width} height={rect.height}>
              {h('Client', { key: `${ACTIVATE_KEY}${id}`, module: './activate.tsx', props: null, width: rect.width, height: rect.height })}
            </Box>
          )}
        </Box>
      )
    }

    const drawDivider = (kind: 'row' | 'column', path: string, index: number, start: number, rect: Rect): RenderNode | null | undefined => {
      const key = `${DIVIDER_KEY}${path}:${index}`
      if (hasClient) return h('Client', { key, module: './divider.tsx', props: { kind, start, length: kind == 'row' ? rect.height : rect.width }, width: rect.width, height: rect.height })
      const line = kind == 'row' ? Array.from({ length: rect.height }, () => VERTICAL).join('\n') : HORIZONTAL.repeat(rect.width)
      return <Box key={key} width={rect.width} height={rect.height}><Text dimColor>{line}</Text></Box>
    }

    // 나눈 노드: 자식 사이마다 분할선을 끼운다.
    const drawNode = (node: GridNode, rect: Rect, path: string): RenderElement => {
      if (node.kind == 'cell') return drawCell(node.id, rect)
      const { parts, dividers } = splitRects(node, rect)
      return (
        <Box flexDirection={node.kind} width={rect.width} height={rect.height}>
          {parts.flatMap((part, index) => {
            const divider = dividers[index]
            const drawn = drawNode(part.node, part.rect, childPath(path, index))
            return divider ? [drawn, drawDivider(node.kind, path, divider.index, divider.start, divider.rect)] : [drawn]
          })}
        </Box>
      )
    }

    // 고정 구분선. 분할선과 같은 글자로 그리지만 Client 가 아니므로 끌 수 없다.
    const drawRule = () => <Box width={measured.columns} height={RULE_ROWS}><Text dimColor wrap="truncate">{HORIZONTAL.repeat(measured.columns)}</Text></Box>

    const area = gridRect(measured)
    const grid = tab.zoomed ? drawCell(tab.zoomed, area) : drawNode(tab.root, area, ROOT_PATH)
    return (
      <Box flexDirection="column">
        {drawRule()}
        <Box height={TOOLBAR_ROWS} flexWrap="wrap" columnGap={1} overflow="hidden">
          {HOTKEYS.map(item => <Button key={`${HOTKEY_KEY}${item.key}`} plain hotkey={item.key} label={item.label} onPress={noop} />)}
        </Box>
        {drawRule()}
        {grid}
        {hasClient ? h('Client', { key: `${MEASURE_KEY}${tab.name}`, module: './measure.tsx', props: measured, width: 0, height: 0 }) : null}
      </Box>
    )
  }).catch(($, e, next) => {
    log($, `render failed: ${JSON.stringify(next.error)}`)
    return next(e)
  })
}

// Button key 를 /grid 명령의 낱말로 바꾼다. `place:<cell>:<plugin>` · `hotkey:<key>`.
const pressWords = (element: string): string[] | undefined => {
  if (element.startsWith(PLACE_KEY)) {
    const [cell, plugin] = element.slice(PLACE_KEY.length).split(':')
    return cell && plugin ? ['place', plugin, cell] : undefined
  }
  if (element.startsWith(HOTKEY_KEY)) return HOTKEYS.find(item => item.key == element.slice(HOTKEY_KEY.length))?.words
  return undefined
}

// 휠이면 `pointer` 가 가리키는 칸, 페이지 키면 활성 칸(tmux 의 활성 pane). 칸 밖이면 undefined.
const cellAt = (tab: GridTab, measured: Measured, pointer: { column: number; row: number } | undefined) => {
  if (!pointer) return tab.zoomed ?? tab.active
  const area = gridRect(measured)
  const row = pointer.row - HEADER_ROWS
  const rects: [string, Rect][] = tab.zoomed ? [[tab.zoomed, area]] : [...geometry(tab.root, area)]
  const hit = rects.find(([, rect]) => pointer.column >= rect.x && pointer.column < rect.x + rect.width && row >= rect.y && row < rect.y + rect.height)
  return hit?.[0]
}
