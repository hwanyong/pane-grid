import type { Register } from 'claude-code'

// R2: 탭 뒤에 있는(보이지 않는) pane 도 render 가 호출되는가.
// R3: 이 mod 의 $.ui.invalidate('ui.render') 가 다른 mod 의 pane 도 다시 그리게 하는가.
// 이 mod 의 pane 'r2' 를 focus 없이 열고 2초마다 tick 을 올린 뒤 invalidate 한다.
// tick 6 에 focus 로 다시 열어 'r2' 를 보이는 pane 으로 바꾼다.
// 모든 Pane render 를 debug log 에 `r2: render id=<requestId> tick=<n>` 으로 남긴다.
const ACTIVE_CWD = '/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid'
const PANE = 'r2'
const FOCUS_TICK = 6
const LAST_TICK = 15
const run = { isActive: false, tick: 0 }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    run.isActive = e.cwd == ACTIVE_CWD
    if (!run.isActive) return next(e)
    const opened = await $.ui.open({ id: PANE, title: 'R2' })
    $.ui.log(`r2: opened isPlaced=${opened.isPlaced}`, { to: 'debug' })
    const timer = $.clock.every(2000, async () => {
      run.tick += 1
      if (run.tick == FOCUS_TICK) await $.ui.open({ id: PANE, title: 'R2', focus: true })
      const panes = await $.ui.panes()
      const shown = panes.map(pane => `${pane.id}:shown=${pane.isShown}`).join(',')
      $.ui.log(`r2: tick=${run.tick} t=${Date.now()} ${shown}`, { to: 'debug' })
      $.ui.invalidate('ui.render')
      if (run.tick >= LAST_TICK) timer.cancel()
    })
    return next(e)
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (!run.isActive) return next(e)
    $.ui.log(`r2: render id=${e.requestId} tick=${run.tick} t=${Date.now()}`, { to: 'debug' })
    if (e.requestId != PANE) return next(e)
    const { Text } = $.ui.resolve(e)
    return <Text>R2 tick {run.tick}</Text>
  })
}
