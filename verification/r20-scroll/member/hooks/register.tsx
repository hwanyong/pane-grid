import type { EngineInterface, Register } from 'claude-code'

// 규약 mod 역할의 시험 mod.
// R21: host(pane-grid-r20-host) 의 배치에 자기 칸이 있으면 자기 pane 을 닫고, 없으면 연다.
//      배치 변화는 render 밖에서 state.set hook 으로 받는다. 이 mod 는 그 값의 주인이 아니다.
// R20: grid 칸에 30줄을 그린다. 스크롤은 host 가 한다.
// 모든 줄을 debug log 에 `r20m: ...` 로 남긴다.
const ACTIVE_CWD = '/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid'
const NAME = 'pane-grid-r20-member'
const PANE = 'r20m'
const HOST_LAYOUT = { plugin: 'pane-grid-r20-host', key: 'layout' } as const
const LINES = 30
const run = { isActive: false }

const log = ($: EngineInterface, text: string) => $.ui.log(`r20m: ${text} t=${Date.now()}`, { to: 'debug' })

const hasCell = (layout: any) => layout?.cells?.includes(NAME) ?? false

const readLayout = async ($: EngineInterface) => {
  const read: any = await $.state.get(HOST_LAYOUT as never)
  return read.value
}

const place = async ($: EngineInterface, layout: any, why: string) => {
  const isOpen = (await $.ui.panes()).some(pane => pane.id == PANE)
  const isWanted = !hasCell(layout)
  log($, `place ${why} hasCell=${!isWanted} isOpen=${isOpen}`)
  if (isWanted && !isOpen) log($, `open isPlaced=${(await $.ui.open({ id: PANE, title: 'R20 member' })).isPlaced}`)
  if (!isWanted && isOpen) {
    await $.ui.close({ id: PANE })
    log($, 'close')
  }
  const after = (await $.ui.panes()).map(pane => `${pane.id}:shown=${pane.isShown}`).join(',')
  log($, `panes after ${why}: [${after}]`)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    run.isActive = e.cwd == ACTIVE_CWD
    if (!run.isActive) return next(e)
    await place($, await readLayout($), 'session.start')
    return next(e)
  })

  on('state.set', { plugin: 'pane-grid-r20-host', key: 'layout' }, async ($, e, next) => {
    const result = await next(e)
    const value: any = e.value
    log($, `state.set seen version=${value?.version} cells=${value?.cells?.join('|')}`)
    if (run.isActive) await place($, value, 'state.set')
    return result
  }).catch(($, e, next) => {
    log($, `state.set hook error ${JSON.stringify(next.error)}`)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Text } = $.ui.resolve(e)
    log($, 'render own')
    return <Text>R20 member own pane</Text>
  })

  on('ui.render', { component: 'Pane', requestId: 'r20grid' }, async ($, e, next) => {
    const layout = await readLayout($)
    if (!hasCell(layout)) return next(e)
    const below = await next(e)
    log($, `render grid version=${layout.version}`)
    const { Box, Text } = $.ui.resolve(e)
    const lines = Array.from({ length: LINES }, (_, index) => <Text>member line {String(index + 1).padStart(2, '0')}</Text>)
    return (
      <Box flexDirection="column">
        {below}
        <Box key={`cell:${NAME}`} flexDirection="column">{lines}</Box>
      </Box>
    )
  })
}
