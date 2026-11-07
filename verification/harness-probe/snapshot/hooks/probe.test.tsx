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

for (const ids of ['b', 'ab']) {
  test('snapshot ' + ids, { plugins: [childA, childB] }, async ($, on) => {
    const logs: string[] = []
    on('ui.log', (_: any, e: any) => { logs.push(e.text); return { value: undefined } })
    on('ui.render', ($: any, e: any) => { const { Text } = $.ui.resolve(e); return <Text>engine {e.requestId}</Text> })
    for (const id of ['a', 'b']) {
      const u = await $.ui.mount({ plugin: 'child-' + id, surface: 'terminal', component: 'Pane', requestId: id, props })
      await u.unmount()
    }
    const ui = await $.ui.mount({ plugin: 'pane-grid-probe-snapshot', surface: 'terminal', component: 'Pane', requestId: 'grid-' + ids, props })
    console.log('[' + ids + '] GRID TEXTS', JSON.stringify((await ui.findAll({ type: 'Text' })).map((t: any) => t.text)))
    console.log('[' + ids + '] LOGS', logs.join(' | '))
    await ui.unmount()
  })
}
