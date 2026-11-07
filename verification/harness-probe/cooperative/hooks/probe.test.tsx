import { expect, test } from 'claude-code/testing'

const props = { title: 't', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} } as const

// 자식 mod: 자기 pane 'a' 와 컨테이너의 'grid' 칸 slot:a 를 같은 함수로 그린다
const childA = {
  name: 'child-a',
  register(on: any) {
    on('ui.render', { component: 'Pane', requestId: 'grid' }, async ($: any, e: any, next: any) => {
      const tree: any = await next(e)
      const { Box, Text, Button } = $.ui.resolve(e)
      const mine = <Box key="cell:child-a"><Text>hello from a</Text><Button key="go" label="go" onPress={() => $.ui.log('pressed a')} /></Box>
      let filled = false
      const fill = (n: any): any => {
        if (!n || typeof n !== 'object') return n
        if (n.props?.key === 'slot:child-a') { filled = true; return { ...n, children: [mine] } }
        return n.children ? { ...n, children: n.children.map(fill) } : n
      }
      const out = fill(tree)
      return filled ? out : <Box flexDirection="column">{tree}{mine}</Box>
    }).catch(($: any, e: any, next: any) => { $.ui.log('A ERR ' + JSON.stringify(next.error)); return next(e) })
  },
}

test('child fills its slot in the grid and its button presses', { plugins: [childA] }, async ($, on) => {
  const logs: string[] = []
  on('ui.log', (_: any, e: any) => { logs.push(e.text); return { value: undefined } })
  on('ui.render', ($: any, e: any) => { const { Text, Box } = $.ui.resolve(e); return e.requestId === 'grid' ? <Box /> : <Text>engine {e.requestId}</Text> })
  const ui = await $.ui.mount({ plugin: 'pane-grid-probe-cooperative', surface: 'terminal', component: 'Pane', requestId: 'grid', props })
  console.log('GRID TEXTS', JSON.stringify((await ui.findAll({ type: 'Text' })).map((t: any) => t.text)))
  try { await ui.press({ key: 'go', plugin: 'child-a' }); console.log('PRESS OK') } catch (err) { console.log('PRESS ERR', String(err)) }
  console.log('LOGS', logs.join(' | '))
  await ui.unmount()
})
