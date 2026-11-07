import type { Register } from 'claude-code'

const PANE = 'click-probe'
const run = { active: 'a', presses: 0 }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    void $.ui.open({ id: PANE, title: 'click probe' })
    return next(e)
  })

  on('ui.message', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const data = e.data as { cell?: string; type?: string }
    $.ui.log(`CLICKPROBE message ${e.element} ${JSON.stringify(e.data)}`, { to: 'debug' })
    if (data.type == 'down' && data.cell && data.cell != run.active) {
      run.active = data.cell
      await $.ui.invalidate('ui.render')
      await $.ui.open({ id: PANE, title: 'click probe', focus: true })
    }
    return next(e)
  })

  on('ui.scroll', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    $.ui.log(`CLICKPROBE scroll ${e.by} ${JSON.stringify(e.pointer ?? null)}`, { to: 'debug' })
    return next(e)
  })

  on('ui.press', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    $.ui.log(`CLICKPROBE press ${e.element}`, { to: 'debug' })
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Client } = $.ui.resolve(e)
    if (e.surface != 'terminal') return <Text>terminal only</Text>
    const cell = (id: string) => (
      <Box key={`cell-${id}`} width={40} height={8} flexDirection="column" position="relative">
        <Text color={run.active == id ? 'green' : undefined}>{`cell ${id}${run.active == id ? ' (active)' : ''}`}</Text>
        <Text>member text line</Text>
        <Button key={`btn-${id}`} label={`member button ${id}`} onPress={() => void $.ui.log(`CLICKPROBE onPress btn-${id}`, { to: 'debug' })} />
        {run.active != id ? <Box position="absolute" top={0} left={0} width={40} height={8}><Client key={`catch-${id}`} module="./catcher.tsx" props={{ cell: id }} width={40} height={8} /></Box> : null}
      </Box>
    )
    return (
      <Box flexDirection="column">
        <Box><Button key="hot-h" plain hotkey="h" label="hotkey h" onPress={() => void $.ui.log('CLICKPROBE onPress hot-h', { to: 'debug' })} /></Box>
        <Box flexDirection="row">{cell('a')}<Text>│</Text>{cell('b')}</Box>
      </Box>
    )
  })
}
