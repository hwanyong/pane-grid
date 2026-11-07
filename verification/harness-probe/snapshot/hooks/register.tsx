import type { Register } from 'claude-code'

// 시험 A: 다른 mod 의 pane 이 그려질 때 next(e) 의 반환값을 저장하고, pane 'grid' 에 그 트리를 그린다.
// 'b' 는 글자만, 'a' 는 Button 을 담는다. pane 'grid-b' 는 b 만, 'grid-ab' 는 a 와 b 를 넣는다.
const cache = new Map<string, unknown>()

const GRIDS: Record<string, string[]> = { 'grid-b': ['b'], 'grid-ab': ['a', 'b'] }

export const register: Register = on => {
  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    const ids = GRIDS[e.requestId]
    if (!ids) {
      const tree = await next(e)
      cache.set(e.requestId, tree)
      return tree
    }
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        {ids.map(id => (
          <Box flexDirection="column" borderStyle="single">
            {(cache.get(id) as any) ?? <Text>no tree for {id}</Text>}
          </Box>
        ))}
      </Box>
    )
  }).catch(($, e, next) => {
    $.ui.log('GRID ERR ' + JSON.stringify(next.error))
    return next(e)
  })
}
