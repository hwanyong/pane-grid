import { test } from 'claude-code/testing'

const props = { title: 't', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} } as const
const childA = {
  name: 'child-a',
  register(on: any) {
    on('ui.render', { component: 'Pane', requestId: 'a' }, ($: any, e: any) => {
      const { Box, Text, Button } = $.ui.resolve(e)
      return <Box><Text>hello from a</Text><Button key="go" label="go" onPress={() => $.ui.log('child-a onPress ran')} /></Box>
    })
  },
}

test('proxy press', { plugins: [childA] }, async ($, on) => {
  const logs: string[] = []
  on('ui.log', (_: any, e: any) => { logs.push(e.text); return { value: undefined } })
  on('ui.render', ($: any, e: any) => { const { Box } = $.ui.resolve(e); return <Box /> })
  const ua = await $.ui.mount({ plugin: 'child-a', surface: 'terminal', component: 'Pane', requestId: 'a', props })
  const ui = await $.ui.mount({ plugin: 'pane-grid-probe-press-proxy', surface: 'terminal', component: 'Pane', requestId: 'grid', props })
  try { await ui.press({ key: 'proxy' }); console.log('PRESS OK') } catch (err) { console.log('PRESS ERR', String(err)) }
  console.log('LOGS', logs.join(' | '))
  await ui.unmount(); await ua.unmount()
})
