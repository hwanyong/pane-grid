import type { Register } from 'claude-code'

// 시험 C: 수정 불가 mod 의 Button 을 컨테이너 자신의 Button 으로 다시 그리고,
// 누름을 ui.press 의 next() 에 원래 plugin/element/requestId 로 바꿔 넘기는가
export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: 'grid' }, ($, e) => {
    const { Box, Button } = $.ui.resolve(e)
    return <Box><Button key="proxy" label="go (proxy)" onPress={() => $.ui.log('proxy own onPress')} /></Box>
  })
  on('ui.press', { element: 'proxy' }, async ($, e, next) => {
    try {
      const r = await next({ ...e, plugin: 'child-a', element: 'go', requestId: 'a' })
      $.ui.log('rewrite result ' + JSON.stringify(r))
      return r
    } catch (err) {
      $.ui.log('rewrite ERR ' + String(err))
      return next(e)
    }
  }).catch(($, e, next) => { $.ui.log('PRESS HOOK ERR ' + JSON.stringify(next.error)); return next(e) })
}
