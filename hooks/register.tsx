import { update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderNode } from 'claude-code'
import type { GridLayout, GridNode, GridPlacement, GridScroll, GridShown, GridTab } from '../types'
import { apply, checkOutcome } from './actions'
import { defaultTabs, parseLayoutFile, serializeLayoutFile } from './layout-file'
import { cellsOf, childRects, findCell, geometry } from './tree'
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
// 칸 테두리 위아래 2행과 제목 1행, 좌우 테두리 2열.
const CELL_CHROME_ROWS = 3
const CELL_CHROME_COLUMNS = 2
const SHOWN_POLL_MS = 1000
// 규약 mod 가 칸에 그린 Box 의 key 머리말. 뒤에 mod 이름이 온다(docs/grid-and-tabs.md §3.3).
const CELL_KEY = 'cell:'
const ACTIVE_COLOR = 'green'

// docs/grid-and-tabs.md §2.3 결정 10. 이름 바꾸기(`r`)는 이름 입력이 필요해 slash 명령으로만 한다.
const HOTKEYS: { key: string; label: string; words: string[] }[] = [
  { key: 'v', label: 'split-h', words: ['split', '-h'] },
  { key: 's', label: 'split-v', words: ['split', '-v'] },
  { key: 'o', label: 'next', words: ['next'] },
  { key: 'z', label: 'zoom', words: ['zoom'] },
  { key: 'x', label: 'kill', words: ['kill'] },
  { key: 'w', label: 'swap', words: ['swap'] },
  { key: 'b', label: 'break', words: ['break'] },
  { key: 'c', label: 'new tab', words: ['new'] },
  { key: 'k', label: 'close tab', words: ['close'] },
  { key: 'q', label: 'list', words: ['list'] },
]

type Measured = { columns: number; rows: number }

// 모듈 변수는 다시 불러오면 처음 값으로 돌아간다. 그려진 것은 모두 $.state 에서 읽고, 여기에는 다시 계산할 수 있는 것만 둔다.
const run = {
  home: '',
  // 파일이 형식에 맞지 않아 기본 배치로 시작했으면 그 원문. 처음 저장할 때 INVALID_COPY 로 옮겨 남긴다.
  invalidText: undefined as string | undefined,
  // slash 명령이 다룰 탭. 보이는 grid 탭이 있으면 그것, 없으면 마지막으로 보였던 탭.
  current: '',
  measured: new Map<string, Measured>(),
}

const log = ($: EngineInterface, text: string) => $.ui.log(`pane-grid: ${text}`, { to: 'debug' })

const paneId = (tab: string) => `${PANE_PREFIX}${tab}`
const tabOf = (requestId: string) => requestId.slice(PANE_PREFIX.length)
const titleOf = (tab: GridTab) => (tab.zoomed ? `${tab.name} [Z]` : tab.name)

const readLayout = async ($: EngineInterface): Promise<GridLayout | undefined> => (await $.state.get(LAYOUT)).value

// 칸 내용 크기. 탭을 아직 그리지 않았으면 0 이다.
const placements = (tabs: GridTab[]): Record<string, GridPlacement> => {
  const placed: Record<string, GridPlacement> = {}
  for (const tab of tabs) {
    const measured = run.measured.get(tab.name)
    const rects = measured ? geometry(tab.root, gridRect(measured)) : new Map<string, Rect>()
    for (const cell of cellsOf(tab.root)) {
      if (!cell.plugin) continue
      const rect = rects.get(cell.id)
      const isShown = !tab.zoomed || tab.zoomed == cell.id
      const size = rect && isShown ? contentSize(rect) : { columns: 0, rows: 0 }
      placed[cell.plugin] = { tab: tab.name, requestId: paneId(tab.name), cell: cell.id, ...size }
    }
  }
  return placed
}

const gridRect = (measured: Measured): Rect => ({ x: 0, y: 0, width: measured.columns, height: Math.max(measured.rows - TOOLBAR_ROWS, 0) })

const contentSize = (rect: Rect) => ({
  columns: Math.max(rect.width - CELL_CHROME_COLUMNS, 0),
  rows: Math.max(rect.height - CELL_CHROME_ROWS, 0),
})

const publish = async ($: EngineInterface, tabs: GridTab[]) => {
  const placed = placements(tabs)
  const layout = await update($, LAYOUT, (current): GridLayout => ({ version: 1, revision: (current?.revision ?? 0) + 1, tabs, placed }))
  log($, `layout revision=${layout.revision} tabs=${tabs.map(tab => tab.name).join(',')} placed=${Object.keys(placed).join(',')}`)
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
  const layout = await readLayout($)
  if (!layout) return 'pane-grid has not loaded its layout yet'
  const outcome = apply(layout.tabs, await currentTab($, layout.tabs), words)
  const broken = checkOutcome(outcome)
  if (broken) return `refused: ${broken}`
  run.current = outcome.current
  if (outcome.isChanged) {
    await publish($, outcome.tabs)
    await persist($, outcome.tabs)
    await syncPanes($, outcome.tabs)
  }
  if (outcome.focus) {
    const tab = outcome.tabs.find(item => item.name == outcome.focus)
    if (tab) await $.ui.open({ id: paneId(tab.name), title: titleOf(tab), focus: true })
  }
  log($, `action ${words.join(' ')}: ${outcome.text.split('\n')[0]}`)
  return outcome.text
}

const reload = async ($: EngineInterface) => {
  const tabs = await loadFile($)
  await publish($, tabs)
  await syncPanes($, tabs)
  return `loaded ${tabs.length} tab(s) from ~/${FILE}`
}

const watchShown = async ($: EngineInterface) => {
  const pane = (await $.ui.panes()).find(item => item.isShown && item.id.startsWith(PANE_PREFIX))
  const shown: GridShown = pane ? tabOf(pane.id) : null
  if (shown) run.current = shown
  const held = await $.state.get(SHOWN)
  if (held.version == 0 || held.value != shown) await $.state.set(SHOWN, shown)
}

// 규약 mod 가 그린 칸: key 가 `cell:<plugin>` 인 Box.
const collectCells = (node: RenderNode, out: Map<string, RenderElement>): void => {
  if (typeof node == 'string') return
  const props: Record<string, unknown> | undefined = 'props' in node ? node.props : undefined
  const key = props?.key
  if (typeof key == 'string' && key.startsWith(CELL_KEY)) return void out.set(key.slice(CELL_KEY.length), node)
  if ('children' in node) for (const child of node.children ?? []) collectCells(child, out)
}

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

  on('ui.scroll', { component: 'Pane', requestId: /^grid-/ }, async ($, e) => {
    const layout = await readLayout($)
    const tab = layout?.tabs.find(item => item.name == tabOf(e.requestId))
    const measured = run.measured.get(tabOf(e.requestId))
    if (!tab || !measured) return {}
    const id = cellAt(tab, measured, e.pointer)
    if (!id) return {}
    await update($, SCROLL, scroll => ({ ...scroll, [id]: Math.max((scroll?.[id] ?? 0) + e.by, 0) }))
    return {}
  }).catch(($, e, next) => {
    log($, `scroll failed: ${JSON.stringify(next.error)}`)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const layout = await readLayout($)
    const tab = layout?.tabs.find(item => item.name == tabOf(e.requestId))
    if (!tab) return next(e)
    const scroll: GridScroll = (await $.state.get(SCROLL)).value ?? {}
    const below = await next(e)
    const cells = new Map<string, RenderElement>()
    collectCells(below, cells)
    const measured = { columns: e.props.bodyColumns, rows: e.props.scroll.bodyRows }
    const before = run.measured.get(tab.name)
    if (!before || before.columns != measured.columns || before.rows != measured.rows) {
      run.measured.set(tab.name, measured)
      $.clock.after(0, () => void publishPlacements($))
    }
    const { Box, Text, Button } = $.ui.resolve(e)

    const activate = (id: string) => () => void runAction($, ['select-cell', id])
    const press = (words: string[]) => async () => $.ui.toast(`pane-grid: ${(await runAction($, words)).split('\n')[0]}`)

    const drawCell = (id: string, rect: Rect): RenderElement => {
      const cell = findCell(tab.root, id)
      const isActive = id == tab.active
      const size = contentSize(rect)
      const content = cell?.plugin ? cells.get(cell.plugin) : undefined
      const empty = cell?.plugin
        ? <Text dimColor>{cell.plugin} draws nothing here</Text>
        : <Text dimColor>{'empty: /grid place <plugin>'}</Text>
      return (
        <Box key={`cellbox:${id}`} width={rect.width} height={rect.height} flexDirection="column" borderStyle="round" borderColor={isActive ? ACTIVE_COLOR : undefined} borderDimColor={!isActive}>
          <Button key={`title:${id}`} plain label={`${id} ${cell?.plugin ?? '-'}`} dimColor={!isActive} onPress={activate(id)} />
          <Box width={size.columns} height={size.rows} overflow="hidden" flexDirection="column">
            <Box marginTop={-(scroll[id] ?? 0)} flexShrink={0} flexDirection="column">{content ?? empty}</Box>
          </Box>
        </Box>
      )
    }

    const drawNode = (node: GridNode, rect: Rect): RenderElement => {
      if (node.kind == 'cell') return drawCell(node.id, rect)
      return (
        <Box flexDirection={node.kind} width={rect.width} height={rect.height}>
          {childRects(node, rect).map(part => drawNode(part.node, part.rect))}
        </Box>
      )
    }

    const area = gridRect(measured)
    const grid = tab.zoomed ? drawCell(tab.zoomed, area) : drawNode(tab.root, area)
    return (
      <Box flexDirection="column">
        <Box height={TOOLBAR_ROWS} flexWrap="wrap" columnGap={1} overflow="hidden">
          {HOTKEYS.map(item => <Button key={`hotkey:${item.key}`} plain hotkey={item.key} label={item.label} onPress={press(item.words)} />)}
        </Box>
        {grid}
      </Box>
    )
  }).catch(($, e, next) => {
    log($, `render failed: ${JSON.stringify(next.error)}`)
    return next(e)
  })
}

// 휠이면 `pointer` 가 가리키는 칸, 페이지 키면 활성 칸(tmux 의 활성 pane). 칸 밖이면 undefined.
const cellAt = (tab: GridTab, measured: Measured, pointer: { column: number; row: number } | undefined) => {
  if (!pointer) return tab.zoomed ?? tab.active
  const area = gridRect(measured)
  const row = pointer.row - TOOLBAR_ROWS
  const rects: [string, Rect][] = tab.zoomed ? [[tab.zoomed, area]] : [...geometry(tab.root, area)]
  const hit = rects.find(([, rect]) => pointer.column >= rect.x && pointer.column < rect.x + rect.width && row >= rect.y && row < rect.y + rect.height)
  return hit?.[0]
}
