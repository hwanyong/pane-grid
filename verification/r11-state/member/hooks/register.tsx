import type { EngineInterface, Register } from 'claude-code'

// 규약 mod 역할의 시험 mod.
// R15: host(pane-grid-r11-host) 의 state 를 PluginState 선언 없이 읽는 코드가 로드되는가. host 가 없으면 무엇을 읽는가.
// 독립 동작: host 가 없어도 자기 pane 'r11m' 이 지금처럼 열리고 그려지는가.
// R11: 자기 state 'count' 를 4초마다 바꾸면 그것을 읽은 grid 칸 · 자기 pane 이 다시 그려지는가.
// R13: grid 안에 그린 Button 의 press 가 이 mod 에 전달되는가. ui.press hook 과 onPress 가 각각 로그를 남기고, onPress 는 count 에 100 을 더해 화면에도 보이게 한다.
// 모든 줄을 debug log 에 `r11m: ...` 로 남긴다.
const ACTIVE_CWD = '/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid'
const NAME = 'pane-grid-r11-member'
const PANE = 'r11m'
const HOST_LAYOUT = { plugin: 'pane-grid-r11-host', key: 'layout' } as const
const COUNT = { plugin: 'pane-grid-r11-member', key: 'count' } as const
const TICK_MS = 4000
const LAST_TICK = 9
const run = { isActive: false, tick: 0 }

const log = ($: EngineInterface, text: string) => $.ui.log(`r11m: ${text} t=${Date.now()}`, { to: 'debug' })

const readLayout = async ($: EngineInterface) => {
  const read: any = await $.state.get(HOST_LAYOUT as never)
  return { value: read.value, version: read.version }
}

const readCount = async ($: EngineInterface) => {
  const read: any = await $.state.get(COUNT as never)
  return read.value ?? 0
}

const addHundred = async ($: EngineInterface, where: string) => {
  log($, `onPress ${where}`)
  const count = await readCount($)
  const result = await $.state.set(COUNT as never, (count + 100) as never)
  log($, `onPress count.set ${count + 100} isSet=${result.isSet}`)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    run.isActive = e.cwd == ACTIVE_CWD
    if (!run.isActive) return next(e)
    const layout = await readLayout($)
    log($, `session.start hostLayout=${JSON.stringify(layout.value)} version=${layout.version}`)
    const opened = await $.ui.open({ id: PANE, title: 'R11 member' })
    log($, `open ${PANE} isPlaced=${opened.isPlaced}`)
    const timer = $.clock.every(TICK_MS, async () => {
      run.tick += 1
      // host 가 없을 때만: 자기 pane 을 보이는 pane 으로 바꿔, 보이는 동안 count 가 바뀌면 다시 그려지는지 본다.
      if (run.tick == 2 && layout.version == 0) {
        await $.ui.open({ id: PANE, title: 'R11 member', focus: true })
        log($, `open ${PANE} focus`)
      }
      const result = await $.state.set(COUNT as never, run.tick as never)
      log($, `count.set ${run.tick} isSet=${result.isSet}`)
      if (run.tick >= LAST_TICK) timer.cancel()
    })
    return next(e)
  })

  on('ui.press', { plugin: NAME }, async ($, e, next) => {
    log($, `press hook element=${e.element} requestId=${e.requestId} component=${e.component}`)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const count = await readCount($)
    log($, `render own count=${count}`)
    const { Box, Text, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text>R11 member own pane count {count}</Text>
        <Button key="own-go" label="own go" onPress={() => addHundred($, 'own-go')} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: /^r11grid-/ }, async ($, e, next) => {
    const layout = await readLayout($)
    const count = await readCount($)
    const cells: string[] = layout.value?.cells?.[e.requestId] ?? []
    if (!cells.includes(NAME)) {
      log($, `render grid ${e.requestId} skip layoutVersion=${layout.version}`)
      return next(e)
    }
    const below = await next(e)
    log($, `render grid ${e.requestId} layoutVersion=${layout.version} count=${count}`)
    const { Box, Text, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {below}
        <Box key={`cell:${NAME}`} flexDirection="column">
          <Text>member count {count} layout v{layout.value?.version}</Text>
          <Button key="go" label="go" onPress={() => addHundred($, `go in ${e.requestId}`)} />
        </Box>
      </Box>
    )
  }).catch(($, e, next) => {
    log($, `grid render error ${JSON.stringify(next.error)}`)
    return next(e)
  })
}
