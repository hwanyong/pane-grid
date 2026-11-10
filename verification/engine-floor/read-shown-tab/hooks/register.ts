import type { Register } from 'claude-code'
import { readShownTab } from './pane-grid'

// 엔진 하한 시험: import 한 function declaration readShownTab 에 $ 를 넘기는 모양.
// 이 mod 를 쓰는 차례는 verification/engine-floor/README.md 에 있다.

export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const shown = await readShownTab($)
    $.ui.log(`floor-read-shown-tab: shown=${shown}`, { to: 'debug' })
    return next(e)
  })
}
