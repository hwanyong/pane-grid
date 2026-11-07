import type { EngineInterface, Register } from 'claude-code'

// pane-grid 역할의 시험 mod.
// R11: member 가 grid render 중에 이 mod 의 state 를 읽으면, 이 mod 가 그 값을 다시 쓸 때 grid 가 다시 그려지는가.
//      이 mod 의 render 는 state 를 읽지 않는다. 다시 그려지면 그 원인은 member 의 구독이다.
// R17: 배치 두 벌을 엔진 pane 두 개(r11grid-a · r11grid-b)로 열고 focus 로 번갈아 보일 때, 다시 보인 pane 이 다시 그려지는가.
// 모든 줄을 debug log 에 `r11h: ...` 로 남긴다.
const ACTIVE_CWD = '/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid'
const LAYOUT = { plugin: 'pane-grid-r11-host', key: 'layout' } as const
const MEMBER = 'pane-grid-r11-member'
const GRIDS = [{ id: 'r11grid-a', title: 'Grid A' }, { id: 'r11grid-b', title: 'Grid B' }]
const TICK_MS = 3000
const LAST_TICK = 12
const run = { isActive: false, tick: 0, version: 0 }

const log = ($: EngineInterface, text: string) => $.ui.log(`r11h: ${text} t=${Date.now()}`, { to: 'debug' })

const writeLayout = async ($: EngineInterface) => {
  run.version += 1
  const value = { version: run.version, cells: { 'r11grid-a': [MEMBER], 'r11grid-b': [MEMBER] } }
  const result = await $.state.set(LAYOUT as never, value as never)
  log($, `state.set version=${run.version} isSet=${result.isSet}`)
}

const show = async ($: EngineInterface, index: number) => {
  const grid = GRIDS[index]
  const opened = await $.ui.open({ id: grid.id, title: grid.title, focus: true })
  log($, `open ${grid.id} focus isPlaced=${opened.isPlaced}`)
}

const step = async ($: EngineInterface) => {
  run.tick += 1
  if (run.tick == 1) await show($, 0)
  if (run.tick == 3) await writeLayout($)
  if (run.tick == 5) await show($, 1)
  if (run.tick == 7) await writeLayout($)
  if (run.tick == 9) await show($, 0)
  const panes = (await $.ui.panes()).map(pane => `${pane.id}:shown=${pane.isShown}`).join(',')
  log($, `tick=${run.tick} ${panes}`)
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
    await writeLayout($)
    for (const grid of GRIDS) await $.ui.open({ id: grid.id, title: grid.title })
    const timer = $.clock.every(TICK_MS, async () => {
      await step($)
      if (run.tick >= LAST_TICK) timer.cancel()
    })
    return next(e)
  })

  // R13: host(목록 맨 위)가 다른 mod 의 Button press 를 보는가.
  on('ui.press', async ($, e, next) => {
    log($, `press seen plugin=${e.plugin} element=${e.element} requestId=${e.requestId}`)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: /^r11grid-/ }, async ($, e, next) => {
    const below = await next(e)
    const cells: any[] = []
    collectCells(below, cells)
    log($, `render ${e.requestId} cells=${cells.length} tick=${run.tick}`)
    const { Box, Text } = $.ui.resolve(e)
    const title = GRIDS.find(grid => grid.id == e.requestId)?.title ?? e.requestId
    return (
      <Box flexDirection="column">
        <Text bold>{title} (host tick {run.tick})</Text>
        <Box flexDirection="row" gap={1}>
          {cells.length == 0 ? <Text dimColor>no cells</Text> : cells.map(cell => <Box borderStyle="single" width="50%">{cell}</Box>)}
        </Box>
      </Box>
    )
  }).catch(($, e, next) => {
    log($, `render error ${JSON.stringify(next.error)}`)
    return next(e)
  })
}
