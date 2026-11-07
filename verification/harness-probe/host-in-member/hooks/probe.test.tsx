import { test } from 'claude-code/testing'

const props = { title: 't', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} } as const
const childA = {
  name: 'child-a',
  register(on: any) {
    on('ui.render', { component: 'Pane', requestId: 'a' }, ($: any, e: any) => {
      const { Box, Text, Button } = $.ui.resolve(e)
      return <Box><Text>hello from a</Text><Button key="go" label="go" onPress={() => $.ui.log('pressed a')} /></Box>
    })
  },
}
const childB = {
  name: 'child-b',
  register(on: any) {
    on('ui.render', { component: 'Pane', requestId: 'b' }, ($: any, e: any) => {
      const { Box, Text } = $.ui.resolve(e)
      return <Box><Text>hello from b</Text></Box>
    })
  },
}

test('grid drawn inside member pane a', { plugins: [childA, childB] }, async ($, on) => {
  const logs: string[] = []
  on('ui.log', (_: any, e: any) => { logs.push(e.text); return { value: undefined } })
  on('ui.render', ($: any, e: any) => { const { Text } = $.ui.resolve(e); return <Text>engine {e.requestId}</Text> })
  const ub = await $.ui.mount({ plugin: 'child-b', surface: 'terminal', component: 'Pane', requestId: 'b', props })
  await ub.unmount()
  const ua = await $.ui.mount({ plugin: 'child-a', surface: 'terminal', component: 'Pane', requestId: 'a', props })
  console.log('PANE a TEXTS', JSON.stringify((await ua.findAll({ type: 'Text' })).map((t: any) => t.text)))
  try { await ua.press({ key: 'go', plugin: 'child-a' }); console.log('PRESS OK') } catch (err) { console.log('PRESS ERR', String(err)) }
  console.log('LOGS', logs.join(' | '))
  await ua.unmount()
})
