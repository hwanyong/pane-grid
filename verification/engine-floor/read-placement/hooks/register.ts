import type { Register } from 'claude-code'
import { readPlacement } from './pane-grid'

// 엔진 하한 시험: import 한 function declaration readPlacement 에 $ 를 넘기는 모양.
// 이 mod 를 쓰는 차례는 verification/engine-floor/README.md 에 있다.
const PLUGIN = 'pane-grid-floor-read-placement'

export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: /^grid-/ }, async ($, e, next) => {
    const placement = await readPlacement($, PLUGIN)
    $.ui.log(`floor-read-placement: cell=${placement?.cell}`, { to: 'debug' })
    return next(e)
  })
}
