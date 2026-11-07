import type { EngineInterface, Register } from 'claude-code'

// R19: 사람이 prompt 에서 slash 명령을 실행한 뒤 $.ui.open({ focus: true }) 가 보이는 탭을 바꾸는가.
// pane 두 개(r19a · r19b)를 열고 `/r19 <a|b> [now|later]` 를 받는다.
//   now   : command.run hook 안에서 곧바로 연다.
//   later : $.clock.after 로 300 ms 뒤에 연다(명령이 끝나 입력창이 빈 뒤).
// 모든 줄을 debug log 에 `r19: ...` 로 남긴다.
const ACTIVE_CWD = '/Users/uhd/LOCAL/01-01_Projects/plugin-pane-grid'
const COMMAND = 'r19'
const PANES = { a: { id: 'r19a', title: 'R19 A' }, b: { id: 'r19b', title: 'R19 B' } } as const
const LATER_MS = 300
const run = { isActive: false }

const log = ($: EngineInterface, text: string) => $.ui.log(`r19: ${text} t=${Date.now()}`, { to: 'debug' })

const shown = async ($: EngineInterface) => (await $.ui.panes()).map(pane => `${pane.id}:shown=${pane.isShown}`).join(',')

const show = async ($: EngineInterface, name: 'a' | 'b', when: string) => {
  const pane = PANES[name]
  const before = await shown($)
  const opened = await $.ui.open({ id: pane.id, title: pane.title, focus: true })
  log($, `open ${pane.id} focus ${when} isPlaced=${opened.isPlaced} before=[${before}] after=[${await shown($)}]`)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    run.isActive = e.cwd == ACTIVE_CWD
    if (!run.isActive) return next(e)
    await $.command.register({ name: COMMAND, description: 'R19 probe: /r19 <a|b> [now|later]', argumentHint: '<a|b> [now|later]' })
    for (const pane of Object.values(PANES)) await $.ui.open({ id: pane.id, title: pane.title })
    log($, `session.start panes=[${await shown($)}]`)
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const [target, when = 'now'] = e.args.trim().split(/\s+/)
    log($, `command.run args="${e.args}" origin=${e.origin.kind}`)
    if (target != 'a' && target != 'b') return { text: 'usage: /r19 <a|b> [now|later]' }
    if (when == 'later') {
      $.clock.after(LATER_MS, () => void show($, target, 'later'))
      return { text: `r19: open ${PANES[target].id} in ${LATER_MS} ms` }
    }
    await show($, target, 'now')
    return { text: `r19: opened ${PANES[target].id} now` }
  }).catch(($, e, next) => {
    log($, `command.run error ${JSON.stringify(next.error)}`)
    return next.called ? next(e) : { text: 'r19 failed' }
  })

  on('ui.render', { component: 'Pane', requestId: [PANES.a.id, PANES.b.id] }, async ($, e) => {
    const { Text } = $.ui.resolve(e)
    log($, `render ${e.requestId}`)
    return <Text>{e.requestId == PANES.a.id ? 'R19 pane A' : 'R19 pane B'}</Text>
  })
}
