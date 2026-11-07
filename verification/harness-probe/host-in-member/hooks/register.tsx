import type { Register } from 'claude-code'

// 시험 D: 수정하지 않는 mod 의 pane 'a' 가 그려질 때, 그 render 의 next(e) 트리(누를 수 있음)와
// 다른 mod pane 'b' 의 저장해 둔 트리(글자만)를 한 Box 에 나란히 그린다.
const MEMBERS = ['a', 'b']
const cache = new Map<string, unknown>()

export const register: Register = on => {
  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (!MEMBERS.includes(e.requestId)) return next(e)
    const live = await next(e)
    cache.set(e.requestId, live)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        {MEMBERS.map(id => (
          <Box flexDirection="column" borderStyle="single" width="50%">
            {id === e.requestId ? (live as any) : ((cache.get(id) as any) ?? <Text dimColor>{id} not drawn yet</Text>)}
          </Box>
        ))}
      </Box>
    )
  }).catch(($, e, next) => {
    $.ui.log('HOST ERR ' + JSON.stringify(next.error))
    return next(e)
  })
}
