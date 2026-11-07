import type { Register } from 'claude-code'

// 시험 B': 순서 무관 규약. 아래쪽 자식은 key="cell:<plugin>" Box 를 덧붙이고,
// 컨테이너는 next(e) 결과에서 cell:* 를 모아 칸에 배치한다. 위쪽 자식은 slot:<plugin> 을 채운다.
const SLOTS = ['child-a', 'child-b']

function collect(n: any, out: Map<string, any>): void {
  if (!n || typeof n !== 'object') return
  const k = n.props?.key
  if (typeof k === 'string' && k.startsWith('cell:')) { out.set(k.slice(5), n); return }
  for (const c of n.children ?? []) collect(c, out)
}

export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: 'grid' }, async ($, e, next) => {
    const below = await next(e)
    const cells = new Map<string, any>()
    collect(below, cells)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        {SLOTS.map(id => (
          <Box key={'slot:' + id} flexDirection="column" borderStyle="single" width="50%">
            {cells.get(id) ?? <Text dimColor>empty {id}</Text>}
          </Box>
        ))}
      </Box>
    )
  }).catch(($, e, next) => { $.ui.log('GRID ERR ' + JSON.stringify(next.error)); return next(e) })
}
