import type { EngineInterface, Register } from 'claude-code'

// pane-grid 역할의 시험 mod.
// R20: 칸마다 스크롤. 위 줄은 이 mod 의 30줄을 absolute 칸과 음수 marginTop 칸에 같은 offset 으로 그리고,
//      SPACER_ROWS 줄 아래 줄은 왼쪽에 이 mod 의 30줄 absolute 칸, 오른쪽에 member 칸(음수 marginTop)을 높이 CELL_ROWS · overflow hidden 으로 그리고,
//      내용을 position absolute · top -offset 으로 민다. ui.scroll hook 이 pointer 로 칸을 고르고 offset 을 state 에 쓴 뒤
//      next 없이 {} 를 반환해 pane 창을 움직이지 않게 한다.
// R21: tick 2 에 배치에 member 칸을 넣고 tick 40 에 뺀다. member 가 자기 pane 을 닫고 다시 여는지는 member 의 로그가 보인다.
// 모든 줄을 debug log 에 `r20h: ...` 로 남긴다.
const ACTIVE_CWD = '/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid'
const LAYOUT = { plugin: 'pane-grid-r20-host', key: 'layout' } as const
const MEMBER = 'pane-grid-r20-member'
const GRID = 'r20grid'
const CELL_ROWS = 6
const SPACER_ROWS = 6
const LINES = 30
const TICK_MS = 3000
const LAST_TICK = 44
const run = { isActive: false, tick: 0, columns: 0 }

type Layout = { version: number; cells: string[]; offsets: Record<string, number> }

const log = ($: EngineInterface, text: string) => $.ui.log(`r20h: ${text} t=${Date.now()}`, { to: 'debug' })

const readLayout = async ($: EngineInterface): Promise<Layout> => {
  const read: any = await $.state.get(LAYOUT as never)
  return read.value ?? { version: 0, cells: [], offsets: {} }
}

const writeLayout = async ($: EngineInterface, change: (layout: Layout) => Layout) => {
  const layout = await readLayout($)
  const value = { ...change(layout), version: layout.version + 1 }
  const result = await $.state.set(LAYOUT as never, value as never)
  log($, `state.set version=${value.version} cells=${value.cells.join('|')} offsets=${JSON.stringify(value.offsets)} isSet=${result.isSet}`)
}

const step = async ($: EngineInterface) => {
  run.tick += 1
  if (run.tick == 1) {
    const opened = await $.ui.open({ id: GRID, title: 'R20 grid', focus: true })
    log($, `open ${GRID} focus isPlaced=${opened.isPlaced}`)
  }
  if (run.tick == 2) await writeLayout($, layout => ({ ...layout, cells: [MEMBER] }))
  if (run.tick == 40) await writeLayout($, layout => ({ ...layout, cells: [] }))
}

const collectCells = (node: any, out: any[]) => {
  if (!node || typeof node != 'object') return
  const key = node.props?.key
  if (typeof key == 'string' && key.startsWith('cell:')) return void out.push(node)
  for (const child of node.children ?? []) collectCells(child, out)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    run.isActive = e.cwd == ACTIVE_CWD
    if (!run.isActive) return next(e)
    await $.ui.open({ id: GRID, title: 'R20 grid' })
    const timer = $.clock.every(TICK_MS, async () => {
      await step($)
      if (run.tick >= LAST_TICK) timer.cancel()
    })
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: GRID }, async ($, e, next) => {
    const below = await next(e)
    const cells: any[] = []
    collectCells(below, cells)
    const layout = await readLayout($)
    run.columns = e.props.bodyColumns
    log($, `render cells=${cells.length} bodyColumns=${e.props.bodyColumns} scroll=${JSON.stringify(e.props.scroll)} offsets=${JSON.stringify(layout.offsets)}`)
    const { Box, Text } = $.ui.resolve(e)
    const own = Array.from({ length: LINES }, (_, index) => <Text>host line {String(index + 1).padStart(2, '0')}</Text>)
    const offsetOf = (id: string) => layout.offsets[id] ?? 0
    const cellWindow = (id: string, content: any) => (
      <Box key={`win:${id}`} width="50%" height={CELL_ROWS} borderStyle="single" overflow="hidden" position="relative">
        <Box position="absolute" top={-offsetOf(id)} flexDirection="column">{content}</Box>
      </Box>
    )
    // 대조 칸: 같은 offset 을 position absolute 대신 음수 marginTop 으로 민다.
    const marginWindow = (id: string, content: any) => (
      <Box key={`margin:${id}`} width="50%" height={CELL_ROWS} borderStyle="single" overflow="hidden" flexDirection="column">
        <Box marginTop={-offsetOf(id)} flexDirection="column" flexShrink={0}>{content}</Box>
      </Box>
    )
    const spacer = Array.from({ length: SPACER_ROWS }, (_, index) => <Text key={`gap:${index}`}>gap {index + 1}</Text>)
    return (
      <Box flexDirection="column">
        <Text bold>R20 grid tick {run.tick} v{layout.version} offsets {JSON.stringify(layout.offsets)}</Text>
        <Box flexDirection="row">
          {cellWindow('host', own)}
          {marginWindow('host', own)}
        </Box>
        {spacer}
        <Box flexDirection="row">
          {cellWindow('host', own)}
          {cells.length == 0 ? <Text dimColor>no member cell</Text> : marginWindow('member', cells)}
        </Box>
        <Text>below the cells</Text>
      </Box>
    )
  }).catch(($, e, next) => {
    log($, `render error ${JSON.stringify(next.error)}`)
    return next(e)
  })

  on('ui.scroll', { component: 'Pane', requestId: GRID }, async ($, e) => {
    const column = e.pointer?.column
    const id = column == undefined || column < run.columns / 2 ? 'host' : 'member'
    log($, `scroll by=${e.by} offset=${e.offset} bodyRows=${e.bodyRows} contentRows=${e.contentRows} pointer=${JSON.stringify(e.pointer)} origin=${e.origin.kind} cell=${id}`)
    const visible = CELL_ROWS - 2
    await writeLayout($, layout => {
      const offset = Math.min(Math.max((layout.offsets[id] ?? 0) + e.by, 0), LINES - visible)
      return { ...layout, offsets: { ...layout.offsets, [id]: offset } }
    })
    return {}
  }).catch(($, e, next) => {
    log($, `scroll error ${JSON.stringify(next.error)}`)
    return next(e)
  })
}
